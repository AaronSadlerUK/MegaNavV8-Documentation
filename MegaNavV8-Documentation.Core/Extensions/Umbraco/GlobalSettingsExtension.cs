using Umbraco.Web.PublishedModels;
using Umbraco.Web;

namespace MegaNavV8_Documentation.Core.Extensions.Umbraco
{
    public static class GlobalSettingsExtension
    {
        public static GlobalSettings GlobalSettings(this UmbracoHelper umbraco)
        {
            return umbraco.ContentSingleAtXPath("//globalSettings") as GlobalSettings;
        }
    }
}