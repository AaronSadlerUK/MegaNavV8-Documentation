(function () {
    "use strict";

    function SassStylesheetsOverviewController($scope, $location, $timeout, navigationService) {
        var vm = this;
        vm.loading = false;

        function init() {
            $timeout(function () {
                navigationService.syncTree({ tree: "SassStylesheets", path: "-1" });
            });
        }
        init();
    }

    angular.module("umbraco").controller("Humaniise.Umbraco.Editors.SassStylesheets.OverviewController", SassStylesheetsOverviewController);

})();