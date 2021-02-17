function sassStylesheetsResource($q, $http, umbDataFormatter, umbRequestHelper, localizationService) {
	return {
        getByPath: function (virtualpath) {
            return umbRequestHelper.resourcePromise(
                $http.get("backoffice/bdcSass/SassStylesheets/GetByPath?" + umbRequestHelper.dictionaryToQueryString({ virtualPath: virtualpath })),
                "Failed to retrieve data for " + virtualpath);
		},
        getScaffold: function (id) {
            return $http.get("backoffice/bdcSass/SassStylesheets/GetScaffold?id=" + id);
        },
        createContainer: function (parentId, name) {
            var key = "codefile_createFolderFailedBy" + (isNaN(parseInt(parentId)) ? "Name" : "Id");
            var promise = localizationService.localize(key, [parentId]);

            return umbRequestHelper.resourcePromise(
                $http.post("backoffice/bdcSass/SassStylesheets/PostCreateContainer?" + umbRequestHelper.dictionaryToQueryString({ parentId: parentId, name: encodeURIComponent(name) })),
                promise);
        },
        save: function (codeFile) {
            return umbRequestHelper.resourcePromise(
                $http.post("backoffice/bdcSass/SassStylesheets/PostSave", angular.toJson(codeFile)),
                "Failed to save data for code file " + codeFile.name);
        },
        saveAndPublish: function (codeFile) {
            return umbRequestHelper.resourcePromise(
                $http.post("backoffice/bdcSass/SassStylesheets/PostCompile", angular.toJson(codeFile)),
                "Failed to save data for code file " + codeFile.name);
        },
        deleteByPath: function (virtualpath) {
            var promise = localizationService.localize("codefile_deleteItemFailed", [virtualpath]);

            return umbRequestHelper.resourcePromise(
                $http.post("backoffice/bdcSass/SassStylesheets/Delete?" + umbRequestHelper.dictionaryToQueryString({ virtualPath: virtualpath })),
                promise);
        }
	};
}

angular.module("umbraco.resources").factory("sassStylesheetsResource", sassStylesheetsResource);