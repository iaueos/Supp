using Dapper;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Runtime.Caching;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using System.Web.Script.Serialization;

namespace Supp.Models
{
    public class Sing : IDisposable
    {
        private static Sing _me = null;
        public static Sing Me
        {
            get
            {
                if (_me == null)
                    _me = new Sing();
                return _me;
            }
        }

        private MemoryCache _mem = null;

        public MemoryCache Mem
        {
            get
            {
                if (_mem == null)
                {
                    _mem = MemoryCache.Default;
                }
                return _mem;
            }
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                List<string> cacheKeys = Mem.Select(a => a.Key).ToList();
                foreach (string k in cacheKeys)
                {
                    IDisposable d = Mem[k] as IDisposable;
                    if (d != null) d.Dispose();
                    Mem.Remove(k);
                }
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
        public void ContextSet(string key, object value)
        {
            if (HttpContext.Current != null)
            {
                if ((bool)HttpContext.Current?.Items?.Contains(key))
                    HttpContext.Current.Items.Remove(key);

                HttpContext.Current.Items.Add(key, value);
            }
        }
        public T ContextGet<T>(string key)
        {
            if (    (HttpContext.Current != null)
                && ((bool)HttpContext.Current?.Items?.Contains(key))
                && (HttpContext.Current.Items[key] is T v))
                    return v;
            return default(T);
        }
        public void Set(string key, object value, int ageSeconds = -300)
        {
            CacheItemPolicy cip = new CacheItemPolicy();
            if (ageSeconds < 0) /// sliding expiration 
            {
                cip.SlidingExpiration = TimeSpan.FromSeconds(ageSeconds * -1);
            }
            else if (ageSeconds > 0) /// absolute expiration 
            {
                cip.AbsoluteExpiration = new DateTimeOffset(DateTime.Now, TimeSpan.FromSeconds(ageSeconds));
            }
            else // never expire 
            {
                cip.AbsoluteExpiration = ObjectCache.InfiniteAbsoluteExpiration;
            }
            if (value == null)
            {
                if (Mem.Contains(key)) Mem.Remove(key);
                return; 
            }
            Mem.Set(key, value, cip);
        }

        public T Get<T>(string key)
        {
            CacheItem c = Mem.GetCacheItem(key);
            if (c != null)
            {
                if (c.Value is T v)
                    return v;
                else
                    return default(T);
            }
            else
                return default(T);
        }

        public string KonS
        {
            get
            {
                string konci = "talihubungan";
                string cs = Get<string>(konci);
                
                if (string.IsNullOrEmpty(cs))
                {
                    string AppDb = ConfigurationManager.AppSettings["Db"];
                    AppDb = AppDb.Trim() ?? "localhost";

                    if (AppDb.StartsWith("%") && AppDb.EndsWith("%"))
                    {
                        cs = Environment.GetEnvironmentVariable(AppDb.Substring(1, AppDb.Length - 2));
                    }
                    else
                    {
                        cs = ConfigurationManager.ConnectionStrings[AppDb].ConnectionString;
                    }
                    Set(konci, cs);
                }
                return cs;
            }
        }

        public IDbConnection Db()
        {
            IDbConnection db = ContextGet<IDbConnection>("Db");
            
            if (db == null)
            {
                string cs = KonS;
                if (!string.IsNullOrEmpty(cs))
                {
                    db = new SqlConnection(cs);
                    if (db.State != ConnectionState.Open)
                    {
                        db.Open();
                    }
                    ContextSet("Db", db);
                }
                else
                    throw new Exception("No Connection Setting found");
            }
            return db;
        }

        public void CloseDb()
        {
            IDbConnection db = ContextGet<IDbConnection>("Db");

            if (db != null && db.State == ConnectionState.Open)
            {
                db.Close();
            }
        }

        public string Dersa(string fi, string prikefile)
        {
            byte[] decryptedData;
            
            if (!File.Exists(fi) || !File.Exists(prikefile)) return "";

            using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider(8192))
            {
                rsa.FromXmlString(File.ReadAllText(prikefile));
                decryptedData = rsa.Decrypt(File.ReadAllBytes(fi), false);
            }
            Encoding u = new UTF8Encoding();
            return  u.GetString(decryptedData);
        }

        public string DeployedVersion
        {
            get
            {
                string dv = Get<string>("DeployedVersion");
                if (string.IsNullOrEmpty(dv)) {
                    System.Reflection.Assembly a = System.Reflection.Assembly.GetExecutingAssembly();
                    System.IO.FileInfo f = new System.IO.FileInfo(a.Location);
                    DateTime adt = f.LastWriteTime;
                    dv = adt.ToString("yyyyMMdd HHmmss") + " " + a.GetName().Version.ToString();
                    Set("DeployedVersion", dv);
                }
                return dv;
            }
        }


        public Textuality SQL
        {
            get
            {
                Textuality t = Get<Textuality>("SQL");
                if (t == null)
                {
                    t = new Textuality();
                    Set("SQL", t, 0);
                }
                return t;
            }
        }

        public static int Exec(string q, object x = null)
        {
            IDbConnection db = Sing.Me.Db();
            string qq = (x is bool && (bool)x) ? q : Sing.Me.SQL[q];
            if (string.IsNullOrEmpty(qq))
                return -1;
            try
            {
                return db.Execute(qq, x);
            }
            catch (Exception ex)
            {
                ex.Error<int>("Exec", x, q, qq);
                return -1;
            }
        }

        public static int Execute(string q, object param = null, IDbTransaction dbt = null, int? timeout = null, CommandType? ct = null)
        {
            if (string.IsNullOrEmpty(q))
                return -1;
            IDbConnection db = Sing.Me.Db();
            int ret = 0;
            try
            {
                ret = db.Execute(q, param, dbt, timeout, ct);
            }
            catch (Exception ex)
            {
                ret = -2;
                ex.Error<int>("Execute", param, "", q);
            }
            return ret;
        }

   


        public static int Run(string q, params object[] x)
        {
            IDbConnection db = Sing.Me.Db();
            string qq = Sing.Me.SQL[q];
            int ret = -1;
            do
            {
                if (string.IsNullOrEmpty(qq)) break;
                try
                {
                    ret = db.Execute(qq, x);
                }
                catch (Exception ex)
                {
                    ex.Error<int>("Run", x.ToList(), q, qq);
                    ret = -2;
                }
            } while (false);

            return ret;
        }

        public static IEnumerable<T> Qx<T>(
            string sql,
            object param = null,
            IDbTransaction transaction = null,
            bool buffered = true,
            int? commandTimeout = null,
            CommandType? commandType = null)
        {
            IDbConnection DB = Sing.Me.Db();
            string q = null;
            if (param is bool && (bool)param) q = sql;
            if (string.IsNullOrEmpty(q)) q = Sing.Me.SQL[sql];

            try
            {
                if (string.IsNullOrEmpty(q))
                    throw new Exception("sql is empty");
                return DB.Query<T>(q, param, transaction, buffered, commandTimeout, commandType);
            }
            catch (Exception ex)
            {
                ex.Error<T>("Qx", param, sql, q);
                return new List<T> { default(T) };
            }
        }

        public static IEnumerable<T> Query<T>(string sql,
            object param = null,
            IDbTransaction transaction = null,
            bool buffered = true,
            int? commandTimeout = null,
            CommandType? commandType = null)
        {
            IDbConnection DB = Sing.Me.Db();
            if (string.IsNullOrEmpty(sql))
                return new List<T> { default(T) };
            commandTimeout = commandTimeout ?? 300;
            try
            {
                return DB.Query<T>(sql, param, transaction, buffered, commandTimeout, commandType);
            }
            catch (Exception ex)
            {
                ex.Error<T>("Query", param, "", sql);
                return new List<T> { default(T) };
            }
        }
    }

    public static class LogHelper
    {
        public static void Say(string s, params object[] x)
        {
            string apath = Sing.Me.Get<string>("AppDataPath");
            if (string.IsNullOrEmpty(apath))
            {
                apath = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData)
                            , "Supp", "Log");
                if (!Directory.Exists(apath))
                    Directory.CreateDirectory(apath);
                Sing.Me.Set("AppDataPath", apath);
            }
            File.AppendAllText(Path.Combine(apath, DateTime.Now.ToString("yyyyMMdd") + ".log")
                 , DateTime.Now.ToString("HH:mm:ss") + "\t" + string.Format(s, x));
        }
        public static void Error<T>(this Exception ex, string fun, object param = null, string fkey = null, string fval = null)
        {
            StringBuilder b = new StringBuilder("");

            b.Append($"{fun}<{(typeof(T)).Name}>");

            string st = null;

            int i = 0;
            while (ex != null && (i++ < 7))
            {
                b.Append($"\t[{ex.GetType().Name}] {ex.Message}");
                if (st == null) st = ex.StackTrace;

                ex = ex.InnerException;
                b.AppendLine("");
            }

            string uname = "", url = "", method = "", username = "", npwp = "";
            try
            {
                url = HttpContext.Current.Request.Url.ToString();
                method = HttpContext.Current.Request.HttpMethod;
                if (HttpContext.Current.User != null)
                {
                    uname = HttpContext.Current.User.Identity.Name;
                }
                
            }
            catch (Exception xh)
            {
                b.AppendLine($"\t{xh.Message}");
            }
            b.AppendLine($"\t{npwp}|{username}|{uname}|{method} {url}");

            if (!string.IsNullOrEmpty(fkey))
                b.AppendLine($"\t[{fkey}]=");
            if (!string.IsNullOrEmpty(fval))
                b.AppendLine($"\t{fval}");

            bool p = false;
            var j = new JavaScriptSerializer();
            if (param != null)
            {
                if (param.GetType().Name.Equals("string"))
                    b.AppendLine($"param:\r\n\t{param}");
                else
                    foreach (var prop in param.GetType().GetProperties())
                    {
                        if (!p) { b.AppendLine("param:"); p = true; };

                        string v = "";
                        try
                        {
                            v = j.Serialize(prop.GetValue(param));
                        }
                        catch (Exception)
                        {
                            v = "?";
                        }
                        b.AppendLine($"\t{prop.Name}= {v}");
                    }
            }

            b.AppendLine($"\t{st}\r\n");
            Say(b.ToString());
        }
    }
}