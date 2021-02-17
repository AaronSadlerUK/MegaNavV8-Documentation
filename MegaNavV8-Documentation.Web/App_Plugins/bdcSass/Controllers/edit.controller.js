(function () {
    "use strict";

    function SassStylesheetsEditController($scope, $routeParams, $timeout, $http, appState, editorState, navigationService, assetsService, sassStylesheetsResource, codefileResource, contentEditingHelper, notificationsService, localizationService, templateHelper, angularHelper, umbRequestHelper) {
        var vm = this;

        vm.page = {};
        vm.page.loading = true;
        vm.page.menu = {};
        vm.page.menu.currentSection = appState.getSectionState("currentSection");
        vm.page.menu.currentNode = null;
        vm.page.saveButtonState = "init";
        vm.page.saveAndPublishButtonState = "init";

        //Used to toggle the keyboard shortcut modal
        //From a custom keybinding in ace editor - that conflicts with our own to show the dialog
        vm.showKeyboardShortcut = false;

        //Keyboard shortcuts for help dialog
        vm.page.keyboardShortcutsOverview = [];

        templateHelper.getGeneralShortcuts().then(function (shortcuts) {
            vm.page.keyboardShortcutsOverview.push(shortcuts);
        });

        templateHelper.getEditorShortcuts().then(function (shortcuts) {
            vm.page.keyboardShortcutsOverview.push(shortcuts);
        });

        vm.stylesheet = {
            content: "",
            rules: []
        };

        // bind functions to view model
        vm.save = justSave;
        vm.saveAndPublish = saveAndPublish;

        /* Function bound to view model */
        function justSave() {
            interpolateAndSave(false);
        }

        function saveAndPublish() {
            interpolateAndSave(true);
        }

        function interpolateAndSave(publish) {
            vm.page.saveButtonState = "busy";
            vm.page.saveAndPublishButtonState = "busy";

            var activeApp = _.find(vm.page.navigation, function (item) {
                return item.active;
            });

            if (activeApp.alias === "rules") {
                // we're on the rules tab: interpolate the rules into the editor value and save the output as stylesheet content
                interpolateRules().then(
                    function (content) {
                        vm.stylesheet.content = content;
                        save(activeApp, publish);
                    },
                    function (err) {
                    }
                );
            } else {
                // we're on the code tab: just save the editor value as stylesheet content
                vm.stylesheet.content = vm.editor.getValue();
                save(activeApp, publish);
            }
        }

        /* Local functions */

        function save(activeApp, publish = false) {
            contentEditingHelper.contentEditorPerformSave({
                saveMethod: publish ? sassStylesheetsResource.saveAndPublish : sassStylesheetsResource.save,
                scope: $scope,
                content: vm.stylesheet,
                // We do not redirect on failure for style sheets - this is because it is not possible to actually save the style sheet
                // when server side validation fails - as opposed to content where we are capable of saving the content
                // item if server side validation fails
                redirectOnFailure: false,
                rebindCallback: function (orignal, saved) { }
            }).then(function (saved) {

                if (saved.notifications && saved.notifications.length > 0) {
                    console.log(saved.notifications);
                    /*angular.forEach(saved.notifications, function (notification) {
                        if (notification.type === 3)
                            notificationsService.success(notification.header, notification.message);
                        if (notification.type === 2)
                            notificationsService.error(notification.header, notification.message);
                    });*/
                    if (publish) {
                        vm.page.saveAndPublishButtonState = "error";
                    }
                } else {
                    vm.page.saveAndPublishButtonState = publish ? "success" : "init";
                    localizationService.localizeMany(publish ? ["speechBubbles_editContentPublishedHeader", "speechBubbles_editContentPublishedText"] : ["speechBubbles_fileSavedHeader", "speechBubbles_fileSavedText"]).then(function (data) {
                        var header = data[0];
                        var message = data[1];
                        notificationsService.success(header, message);
                    });
                }

                //check if the name changed, if so we need to redirect
                if (vm.stylesheet.id !== saved.id) {
                    contentEditingHelper.redirectToRenamedContent(saved.id);
                }
                else {
                    vm.page.saveButtonState = "success";
                    vm.stylesheet = saved;

                    //sync state
                    editorState.set(vm.stylesheet);

                    // sync tree
                    navigationService.syncTree({ tree: "SassStylesheets", path: vm.stylesheet.path, forceReload: true }).then(function (syncArgs) {
                        vm.page.menu.currentNode = syncArgs.node;
                    });

                    if (activeApp.alias === "rules") {
                        $scope.selectApp(activeApp);
                    }
                }

            }, function (err) {

                vm.page.saveButtonState = "error";
                vm.page.saveAndPublishButtonState = "error";

                localizationService.localizeMany(["speechBubbles_validationFailedHeader", "speechBubbles_validationFailedMessage"]).then(function (data) {
                    var header = data[0];
                    var message = data[1];
                    notificationsService.error(header, message);
                });

            });


        }

        function init() {
            //we need to load this somewhere, for now its here.
            assetsService.loadCss("lib/ace-razor-mode/theme/razor_chrome.css", $scope);

            if ($routeParams.create) {
                sassStylesheetsResource.getScaffold($routeParams.id).then(function (stylesheet) {
                    //console.log(stylesheet);
                    const mode = $routeParams.rtestyle ? "RTE" : null;
                    ready(stylesheet.data, false);
                    generateNavigation(null); // mode
                });
            } else {
                sassStylesheetsResource.getByPath($routeParams.id).then(function (stylesheet) {
                    //console.log(stylesheet);
                    ready(stylesheet, true);
                    extractRules().then(rules => {
                        vm.stylesheet.rules = rules;
                        const mode = rules && rules.length > 0 ? "RTE" : null;
                        generateNavigation(null); // mode
                    });
                });
            }

        }

        function generateNavigation(mode) {
            //console.log(mode);
            localizationService.localizeMany(["stylesheet_tabRules", "stylesheet_tabCode"]).then(function (data) {
                vm.page.navigation = [
                    {
                        "name": data[1],
                        "alias": "code",
                        "icon": "icon-brackets",
                        "view": "views/stylesheets/views/code/code.html"
                    },
                    {
                        "name": data[0],
                        "alias": "rules",
                        "icon": "icon-font",
                        "view": "views/stylesheets/views/rules/rules.html"
                    }
                ];
                if (mode === "RTE") {
                    vm.page.navigation[1].active = true;
                } else {
                    vm.page.navigation[0].active = true;
                }
            });
        }

        function ready(stylesheet, syncTree) {

            vm.page.loading = false;

            vm.stylesheet = stylesheet;

            vm.setDirty = function () {
                setFormState("dirty");
            };

            //sync state
            editorState.set(vm.stylesheet);

            if (syncTree) {
                navigationService.syncTree({ tree: "SassStylesheets", path: vm.stylesheet.path, forceReload: true }).then(function (syncArgs) {
                    vm.page.menu.currentNode = syncArgs.node;
                });
            }

            vm.aceOption = {
                mode: "scss",
                theme: "chrome",
                showPrintMargin: false,
                advanced: {
                    fontSize: '14px',
                    enableSnippets: true,
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: false
                },
                onLoad: function (_editor) {

                    vm.editor = _editor;

                    //Update the auto-complete method to use ctrl+alt+space
                    _editor.commands.bindKey("ctrl-alt-space", "startAutocomplete");

                    //Unassigns the keybinding (That was previously auto-complete)
                    //As conflicts with our own tree search shortcut
                    _editor.commands.bindKey("ctrl-space", null);

                    // TODO: Move all these keybinding config out into some helper/service
                    _editor.commands.addCommands([
                        //Disable (alt+shift+K)
                        //Conflicts with our own show shortcuts dialog - this overrides it
                        {
                            name: 'unSelectOrFindPrevious',
                            bindKey: 'Alt-Shift-K',
                            exec: function () {
                                //Toggle the show keyboard shortcuts overlay
                                $scope.$apply(function () {
                                    vm.showKeyboardShortcut = !vm.showKeyboardShortcut;
                                });
                            },
                            readOnly: true
                        }
                    ]);

                    // initial cursor placement
                    // Keep cursor in name field if we are create a new style sheet
                    // else set the cursor at the bottom of the code editor
                    if (!$routeParams.create) {
                        $timeout(function () {
                            vm.editor.navigateFileEnd();
                            vm.editor.focus();
                        });
                    }

                    vm.editor.on("change", changeAceEditor);
                }
            };

            function changeAceEditor() {
                setFormState("dirty");
            }

            function setFormState(state) {

                // get the current form
                var currentForm = angularHelper.getCurrentForm($scope);

                // set state
                if (state === "dirty") {
                    currentForm.$setDirty();
                } else if (state === "pristine") {
                    currentForm.$setPristine();
                }
            }
        }

        function interpolateRules() {
            return codefileResource.interpolateStylesheetRules(vm.stylesheet.content, vm.stylesheet.rules);
        }

        function extractRules() {
            return codefileResource.extractStylesheetRules(vm.stylesheet.content);
        }

        $scope.selectApp = function (app) {
            vm.page.loading = true;

            // are we going to the code tab?
            if (app.alias === "code") {
                // yes - interpolate the rules into the current editor value before displaying the editor
                interpolateRules().then(
                    function (content) {
                        vm.stylesheet.content = content;
                        vm.page.loading = false;
                    },
                    function (err) {
                    }
                );
            }
            else {
                // no - extract the rules from the current editor value before displaying the rules tab
                extractRules().then(
                    function (rules) {
                        vm.stylesheet.rules = rules;
                        vm.page.loading = false;
                    },
                    function (err) {
                    }
                );
            }
        };

        init();

    }

    angular.module("umbraco").controller("Humaniise.Umbraco.Editors.SassStylesheets.EditController", SassStylesheetsEditController);

})();