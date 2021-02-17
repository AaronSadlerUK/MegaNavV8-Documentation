(function () {
    "use strict";

    function SassStylesheetsCreateController($scope, $location, navigationService, formHelper, sassStylesheetsResource) {
        var vm = this;
        var node = $scope.currentNode;

        vm.createFile = createFile;
        vm.close = close;
        vm.creatingFolder = false;
        vm.showCreateFolder = showCreateFolder;
        vm.createFolder = createFolder;

        function createFile() {
            $location.path("/settings/SassStylesheets/edit/" + node.id).search("create", "true");
            navigationService.hideMenu();
        }

        function showCreateFolder() {
            vm.creatingFolder = true;
        }

        function createFolder(form) {

            if (formHelper.submitForm({ scope: $scope, formCtrl: form })) {

                sassStylesheetsResource.createContainer(node.id, vm.folderName).then(function (saved) {

                    navigationService.hideMenu();

                    navigationService.syncTree({
                        tree: "SassStylesheets",
                        path: saved.path,
                        forceReload: true,
                        activate: true
                    });

                    formHelper.resetForm({ scope: $scope });

                }, function (err) {

                    vm.createFolderError = err;

                });
            }

        }

        function close() {
            const showMenu = true;
            navigationService.hideDialog(showMenu);
        }

    }


    angular.module("umbraco").controller("Humaniise.Umbraco.Editors.SassStylesheets.CreateController", SassStylesheetsCreateController);
})();