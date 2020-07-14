using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Supp.Models;

namespace Supp.Controllers
{
    public class SupplierController : Controller
    {
        // GET: Supplier
        public ActionResult Index()
        {
            return View();
        }
     
        public JsonResult PutSupplier(List<Supplier> data)
        {
            if (data == null) return Json("ERR");
            int errCount = 0;

            foreach(Supplier sup in data)
            {
                int r = Sing.Execute(Sing.Me.SQL["PutSupplier"], sup, null, 10, System.Data.CommandType.Text);
                if (r < 0) errCount++;
            }

            return Json((errCount > 0) ? "FAIL" : "OK");
        }
        

        public JsonResult GetSupplier(string SUPPLIER_CODE = null, string PROVINCE =null, string CITY = null)
        {
            return Json(Sing.Qx<Supplier>("GetSupplier"
                , new { SUPPLIER_CODE, PROVINCE, CITY }).ToArray()
                , JsonRequestBehavior.AllowGet);
        }

        public JsonResult GetProvinceCity()
        {
            return Json(Sing.Qx<MasterCity>("GetMasterCity").ToArray()
                , JsonRequestBehavior.AllowGet);
        }
       
    }
}
