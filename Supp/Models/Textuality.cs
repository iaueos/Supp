using System.IO;
using System.Linq;
using System.Web;
using System.Web.Hosting;

namespace Supp.Models
{
    public class Textuality
    {
        public string this[string key]
        {
            get
            {
                string textkey = "text." + key; 
                string sql = (Sing.Me.Get<string>(textkey));
                if (!string.IsNullOrEmpty(sql)) return sql; 
                
                //handle direct query
                string fn = key;

                if (fn.Contains(Path.AltDirectorySeparatorChar))
                    fn = fn.Replace(Path.AltDirectorySeparatorChar, Path.DirectorySeparatorChar);

                fn = HttpContext.Current != null ?
                    Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/sql"), fn) + ".sql"
                    : Path.Combine(HostingEnvironment.MapPath("~/sql"), fn) + ".sql";
                bool read = false;
                if (!File.Exists(fn))
                {
                    fn = HttpContext.Current != null ?
                    Path.Combine(System.Web.HttpContext.Current.Server.MapPath("~/sql"), key) + ".txt"
                    : Path.Combine(HostingEnvironment.MapPath("~/sql"), key) + ".txt";
                    if (!File.Exists(fn)) { sql = ""; read = false; }
                }
                if (!read)
                    sql = File.ReadAllText(fn);

                Sing.Me.Set(textkey, sql, 0);
                
                return sql;
            }
        }
    }
}