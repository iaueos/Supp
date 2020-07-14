using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Supp.Models
{
    public class Supplier
    {
        public string SUPPLIER_CODE { get; set; } 
        public string SUPPLIER_NAME { get; set;  }
        public string ADDRESS { get; set;  }
        public string PROVINCE { get; set;  }
        public string CITY { get; set;  }
        public string PIC { get; set;  }
    }
}