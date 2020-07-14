using Supp.Models;
using System;
using System.Reflection;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace Supp
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
        }

        protected void Application_PreSendRequestHeaders()
        {
            Response.Headers.Remove("Server");
            Response.Headers.Remove("X-AspNet-Version");
        }

        protected void Application_EndRequest()
        {
            Sing.Me.CloseDb();
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            Exception ex = Server.GetLastError();
            StringBuilder s = new StringBuilder("");

            if (ex != null)
            {
                HttpContext hc = HttpContext.Current;
                string url = (hc != null && hc.Request != null) ? hc.Request.Url.ToString() : "?";

                HttpException he = ex as HttpException;
                if (he != null)
                {
                    s.AppendFormat("\r\n\t @{0} ({1}) {2}", he.Source, he.WebEventCode, he.Message);
                }
                ex.Error<MvcApplication>("App", url, null, s.ToString());
            }
        }

        public void Application_End()
        {
            HttpRuntime runtime = (HttpRuntime)typeof(System.Web.HttpRuntime)
                .InvokeMember("_theRuntime",
                BindingFlags.NonPublic
                | BindingFlags.Static
                | BindingFlags.GetField,
                null,
                null,
                null);

            if (runtime == null)
                return;

            string shutDownMessage = (string)runtime.GetType()
                .InvokeMember("_shutDownMessage",
                 BindingFlags.NonPublic
                 | BindingFlags.Instance
                 | BindingFlags.GetField,
                 null,
                 runtime,
                 null);

            string shutDownStack = (string)runtime.GetType()
                .InvokeMember("_shutDownStack",
               BindingFlags.NonPublic
               | BindingFlags.Instance
               | BindingFlags.GetField,
               null,
               runtime,
               null);
            LogHelper.Say("\r\n\r\n_shutDownMessage={0}\r\n\r\n_shutDownStack={1}"
                    ,shutDownMessage,shutDownStack);
                                         
        }
    }

}
