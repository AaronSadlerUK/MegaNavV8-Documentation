(function () {
    "use strict";

    function SassStylesheetsDeleteController($scope, treeService, navigationService, sassStylesheetsResource) {
        var vm = this;

        vm.performDelete = function () {

            //mark it for deletion (used in the UI)
            $scope.currentNode.loading = true;

            sassStylesheetsResource.deleteByPath($scope.currentNode.id)
                .then(function () {
                    $scope.currentNode.loading = false;
                    treeService.removeNode($scope.currentNode);
                    navigationService.hideMenu();
                });
        };

        vm.cancel = function () {
            navigationService.hideDialog();
        };

    }

    angular.module("umbraco").controller("Humaniise.Umbraco.Editors.SassStylesheets.DeleteController", SassStylesheetsDeleteController);
})();