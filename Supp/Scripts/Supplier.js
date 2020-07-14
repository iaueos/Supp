var ProvinceCity = [];
var Provinces = [];
var Suppliers = []; 
var UploadSuppliers = [];

function distinct(value, index, self) { return value!==undefined && self.indexOf(value) === index; }

function renderOptions(e, aOptions, EmptyText) {
    var oe = $(e);
    oe.empty();
    oe.append($('<option/>').val('').text(EmptyText));
    aOptions.forEach(function (v, i) { oe.append($('<option/>').val(v).text(v)); }); 
}

function SupplierCodeOnSearch(SUPPLIER_CODE) {
    $.getJSON('/Supplier/GetSupplier?SUPPLIER_CODE=' + encodeURIComponent(SUPPLIER_CODE)
        , function (x, h, r) {
            if (x.length < 1) {
                $('#SUPPLIER_NAME').val('');
                $('#ADDRESS').val('');
                $('#PROVINCE').val('');
                $('#CITY').val('');
                $('#PIC').val('');
            } else {


                var s = x[0];
                $('#SUPPLIER_NAME').val(s.SUPPLIER_NAME);
                $('#ADDRESS').val(s.ADDRESS);
                $('#PROVINCE').val(s.PROVINCE);
                $('#CITY').val(s.CITY);
                $('#PIC').val(s.PIC);
            }
    });
}


$(function () {
    $.getJSON("/Supplier/GetProvinceCity", function (data, status, xhr) {
        ProvinceCity = data;
        var p = ProvinceCity.map(function (v, i, a) {
            return v.PROVINCE;
        }); 
        Provinces = p.filter(distinct);
        
        renderOptions('#ProvinceSelect', Provinces, 'ALL');
        renderOptions('#PROVINCE', Provinces, '');
    });

    
    $('#ProvinceSelect').change(function (e) {
        var provinceSelected = $(this).val(); 
        var c = ProvinceCity.map(function (v, i, a) {
            if (v.PROVINCE === provinceSelected)
                return v.CITY;
        });
        var aCities = c.filter(distinct);
        renderOptions("#CitySelect", aCities, 'ALL');
    });

    $('#PROVINCE').change(function (e) {
        var provinceSelected = $(this).val();
        var c = ProvinceCity.map(function (v, i, a) { if (v.PROVINCE === provinceSelected) return v.CITY; });
        var iCities = c.filter(distinct);
        renderOptions('#CITY', iCities, '');
    });

    $('#CitySelect').change(function (e) {
        var citySelected = $(this).val();
    });

    $('#SearchButton').click(function (e) {
        $.getJSON("/Supplier/GetSupplier?SUPPLIER_CODE=" + encodeURIComponent($('#SupplierCode').val())
            + '&PROVINCE=' + encodeURIComponent($('#ProvinceSelect').val())
            + '&CITY=' + encodeURIComponent($('#CitySelect').val())
            , function (data, status, xhr) {
                console.log(data); 
                Suppliers = data;
            });
    }); 

    $('#ClearButton').click(function (e) {
        $('#SupplierCode').val('');
        $("#ProvinceSelect").val('');
        $("#CitySelect").val('');
    });


    $('#SaveButton').click(function (e) {
        var data = [];
        data.push({
            SUPPLIER_CODE: $('#SUPPLIER_CODE').val()
            , SUPPLIER_NAME: $('#SUPPLIER_NAME').val()
            , ADDRESS: $('#ADDRESS').val()
            , PROVINCE: $('#PROVINCE').val()
            , CITY: $('#CITY').val()
            , PIC: $('#PIC').val()
        });
        
        $.post("/Supplier/PutSupplier"
            , { data: data }
            , function (x, h, r) { alert("data saving " + x); }
            , "json");
    });

    $('#CancelButton').click(function (e) {

    });


    $('#SUPPLIER_CODE').blur(function () {
        SupplierCodeOnSearch($(this).val());
    }); 

    $('#SUPPLIER_CODE').keyup(function (e) {
        if (e.keyCode === 13) {
            SupplierCodeOnSearch($('#SUPPLIER_CODE').val());
        }
    });

    $('#DownloadButton').click(function (e) {
        if (Suppliers.length < 1) {
            alert("Search first");
            return;
        }
        var workbook = XLSX.utils.book_new();
        var wsheet = XLSX.utils.json_to_sheet(Suppliers);
        var colwidths = [15, 25, 35, 15, 15, 12]; 
        wsheet['!cols'] = colwidths.map(function (v, i, a) { return { width: v }; });
        XLSX.utils.book_append_sheet(workbook, wsheet, 'Suppliers');
        XLSX.writeFile(workbook, 'Suppliers.xlsx');        
    });

    $('#ExcelUpload').change(function (e) {
        UploadSuppliers = [];
        let files = e.target.files;
        var f;
        for (var i = 0; i < files.length; i++ ) {
            f = files[i];
            var r = new FileReader(); 
            var n = r.name;
            r.onload = function (ev) {
                var data = ev.target.result;
                var workbook = null;
                try {
                    workbook = XLSX.read(data, { type: 'binary' });
                } catch (ex) {
                    alert('read Excel Error');
                }
                if (workbook === null) return; 

                workbook.SheetNames.forEach(function (sheetName) {
                    var suppliers = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                    
                    if (suppliers.length > 0);
                    var colNames = suppliers[0];

                    suppliers.forEach(function (v, i) {
                        if (i > 0) {
                            var d = {};
                            var s = v;
                            colNames.forEach(function (colname, coli) {
                                d[colname] = s[coli];
                            });
                            UploadSuppliers.push(d);
                        }

                    });

                    console.log(UploadSuppliers);
                   
                });
            };
            r.onerror = function (e) {
                alert(e);
            };
            r.readAsBinaryString(f);
        }
    });

    $('#UploadButton').click(function (e) {
        if (UploadSuppliers.length > 0) {
            $.post("/Supplier/PutSupplier"
                , { data: UploadSuppliers }
                , function (x, h, r) { alert("data saving " + x); }
                , "json");
        } else {
            alert('Select File to upload');
        }
    });

    $('#AddButton').click(function (e) {
        alert('AddButton.Click');
    });
    $('#EditButton').click(function (e) {
        alert('EditButton.Click');
    });
    $('#DeleteButton').click(function (e) {
        if (confirm("Delete this record?")) {
           alert("Deleted");
        }
    });

});

