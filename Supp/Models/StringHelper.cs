using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using System.Globalization;

namespace Supp.Models
{
    public static class StringHelper
    {
        readonly static string DirtyFileNamePattern = "[^A-z|0-9|_|-|\\.]+";

        public static string SanitizeFilename(this string insane)
        {
            Regex regEx = new Regex("[^A-z0-9\\-_\\.]+");
            Regex rX = new Regex("[`\\s\\^\\]\\[]+");
            return Regex.Replace(regEx.Replace(rX.Replace(insane, "_"), "_"), @"[\s|_]+", "_");
        }

        public static bool IsDirty(string s)
        {
            return Regex.IsMatch(s, DirtyFileNamePattern);
        }

        public static string AsJson(this object o)
        {
            return (o==null) ? null: (new System.Web.Script.Serialization.JavaScriptSerializer()).Serialize(o);
        }
        
        public static int? AsInt(this string s)
        {
            if (int.TryParse(s, out int v))
                return v;
            else
                return null;
        }

        public static long? AsLong(this string s)
        {
            if (long.TryParse(s, out long v))
                return v;
            else
                return null; 
        }

        public static decimal? AsDecimal(this string s)
        {
            int deciID = s.LastIndexOf(",");
            int deciEN = s.LastIndexOf(".");
            NumberStyles n = NumberStyles.None;
            string culture = "";
            if (deciID > 0 && deciEN > 0)
            {
                n = n | NumberStyles.AllowThousands;
            }
            if (deciID > deciEN)
            {
                culture = "de-DE";
                n = n | NumberStyles.AllowDecimalPoint;
            }
            else
            {
                culture = "en-US";
                n = n | NumberStyles.AllowDecimalPoint;
            }
            if (decimal.TryParse(s,  n,  new CultureInfo(culture), out decimal d))
                return d;
            else
                return null;
        }

        public static string MaxLen(this string s, int len = 0)
        {
            return (!string.IsNullOrEmpty(s) && s.Length > len && len>0) ? s.Substring(0, len) : s;
        }

        public static string AnsiDateOf(this string dt)
        {
            int dd = 0, mm = 0, yyyy = 0;
            DateTime d;
            string nd = null;
            if (string.IsNullOrEmpty(dt)) return nd;
            if (dt.Length == 8)
            {
                if (DateTime.TryParseExact(dt, "ddMMyyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                {
                    yyyy = dt.Substring(0, 4).AsInt() ?? 1900;
                    mm = dt.Substring(4, 2).AsInt() ?? 1;
                    dd = dt.Substring(6, 2).AsInt() ?? 1;
                    d = new DateTime(yyyy, mm, dd);

                }
                else if (DateTime.TryParseExact(dt, "ddMMyyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                {
                    dd = dt.Substring(0, 2).AsInt() ?? 1;
                    mm = dt.Substring(2, 2).AsInt() ?? 1;
                    yyyy = dt.Substring(4, 4).AsInt() ?? 1900;
                    d = new DateTime(yyyy, mm, dd);
                }               

                /// try out alternate format first 
                if (yyyy>= 1900)
                {
                    nd = d.ToString("yyyy-MM-dd");
                }
            }
            else if (dt.Length>=10)
            {
                char[] seps = new char[] { '-', '/', '.', ' ', 'T' };
                
                string[] t = dt.Split(seps);
                if (t.Length >= 3)
                {
                    if (t[0].Length==4 && t[1].Length == 2 && t[2].Length ==2)
                    {
                        yyyy = t[0].AsInt()??0;
                        mm = t[1].AsInt() ?? 0;
                        dd = t[2].AsInt() ?? 0;
                    }
                    else if (t[0].Length == 2 && t[1].Length == 2 && t[2].Length == 4)
                    {
                        dd = t[0].AsInt() ?? 0;
                        mm = t[1].AsInt() ?? 0;
                        yyyy = t[2].AsInt() ?? 0;
                    }
                    nd = string.Format("{0,4:0000}-{1,2:00}-{2,2:00}", yyyy, mm, dd);
                    if (!DateTime.TryParseExact(nd, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d))
                        nd = null;
                }
            }
            return nd;
        }

        public static DateTime AsDate(this string dt)
        {
            DateTime d = new DateTime(1853, 12, 31);
            DateTime.TryParseExact(dt.AnsiDateOf(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out d);
            return d;
        }
    }
}