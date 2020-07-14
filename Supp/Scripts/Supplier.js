var ProvinceCity = [];
var Provinces = [];
var Suppliers = []; 
var UploadSuppliers = [];
var MODES = { ADD: 1, EDIT: 2, DEFAULT: 0, INIT: -1 };
var modes = MODES.INIT;
function distinct(value, index, self) { return value!==undefined && self.indexOf(value) === index; }

function renderOptions(e, aOptions, EmptyText) {
    var oe = $(e);
    oe.empty();
    oe.append($('<option/>').val('').text(EmptyText));
    aOptions.forEach(function (v, i) { oe.append($('<option/>').val(v).text(v)); }); 
}

function clearFileInput(id) {
    var oldInput = document.getElementById(id);
    var newInput = document.createElement("input");
    newInput.type = "file";
    newInput.id = oldInput.id;
    newInput.name = oldInput.name;
    newInput.className = oldInput.className;
    newInput.style.cssText = oldInput.style.cssText;
    oldInput.parentNode.replaceChild(newInput, oldInput);
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


function AddToGrid(v, i) {
    var rowTemplate = $('#SuppliersGrid>tbody>tr#tr0').clone();
    rowTemplate = rowTemplate.removeClass("hidden").addClass('dataRow');
    var row = rowTemplate.clone().prop("id", "row_" + i);
    row.find(".colSELECTION>input[type=checkbox]").prop('id', 'check_' + i).prop('value', v.SUPPLIER_CODE);
    row.find('.colSUPPLIER_CODE').html(v.SUPPLIER_CODE);
    row.find('.colSUPPLIER_NAME').html(v.SUPPLIER_NAME);
    row.find('.colADDRESS').html(v.ADDRESS);
    row.find('.colPROVINCE').html(v.PROVINCE);
    row.find('.colCITY').html(v.CITY);
    row.find('.colPIC').html(v.PIC);
    $('#SuppliersGrid>tbody').append(row.clone());
}

function UpdateGrid(i) {
    var row = $('#SuppliersGrid>tbody>tr#row_' + i);
    var v = Suppliers[i];
    row.find('.colSUPPLIER_NAME').html(v.SUPPLIER_NAME);
    row.find('.colADDRESS').html(v.ADDRESS);
    row.find('.colPROVINCE').html(v.PROVINCE);
    row.find('.colCITY').html(v.CITY);
    row.find('.colPIC').html(v.PIC);
}
function ToGrid(suppliers) {
    $('#SuppliersGrid>tbody>tr.dataRow').remove();
    suppliers.forEach(function (v, i) {
        AddToGrid(v, i);
    });
}

function clearGrid(d) {
    var cb = $('#SuppliersGrid>tbody>tr.dataRow>td.colSELECTION>input[type=checkbox]');
    d.forEach(function (i, a) {
        $('#SuppliersGrid>tbody>tr.dataRow>td.colSELECTION>input[type=checkbox][value=' + a + ']').parent().parent().remove();
        Suppliers = Suppliers.filter(function (i, a) { return i.SUPPLIER_CODE !== a });
    });
}

function setModes(mode) {
    modes = mode;
    switch (mode) {
        case MODES.ADD:
            $('#SuppliersGrid').show();
            $('#SuppliersGrid>tbody>tr#trIn').show(); 
            $('#SaveButton').show();
            $('#CancelButton').show();
            break;
        case MODES.EDIT:
            $('#SuppliersGrid').show();
            $('#SuppliersGrid>tbody>tr#trIn').show(); 
            $('#SaveButton').show();
            $('#CancelButton').show();
            break;
        case MODES.INIT:
            $('#EditButton').hide();
            $('#DeleteButton').hide();
            $('#DownloadButton').hide();
            $('#SuppliersGrid>tbody>tr#trIn').hide();
            $('#SaveButton').hide();
            $('#CancelButton').hide();
            $('#SuppliersGrid').hide();
            
            break;
        default:
            $('#SuppliersGrid').show();
            $('#SuppliersGrid>tbody>tr#trIn').hide();
            $('#SaveButton').hide();
            $('#CancelButton').hide();
            $('#EditButton').show();
            $('#DeleteButton').show();
            $('#DownloadButton').show();
            break;
    }
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
                
                Suppliers = data;
                if (Suppliers && Suppliers.length > 0)
                    setModes(MODES.DEFAULT);
                ToGrid(Suppliers);
            });
    }); 

    $('#ClearButton').click(function (e) {
        $('#SupplierCode').val('');
        $("#ProvinceSelect").val('');
        $("#CitySelect").val('');
        clearFileInput('ExcelUpload');            
        setModes(MODES.INIT);
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
            , function (x, h, r) { if (x === 'OK') alert("Data Successfully " + ((modes == MODES.ADD)? "Added": "Updated" )); else alert("error updating data"); }
            , "json")
            .done(function () {
                var ix = -1;
                Suppliers.forEach(function (v, i, a) {
                    if (v.SUPPLIER_CODE === data[0].SUPPLIER_CODE) {
                        ix = i;
                    }
                });
                if (ix >= 0) {
                    var ed = data[0];
                    Suppliers[ix].SUPPLIER_NAME = ed.SUPPLIER_NAME; 
                    Suppliers[ix].ADDRESS = ed.ADDRESS; 
                    Suppliers[ix].PROVINCE = ed.PROVINCE; 
                    Suppliers[ix].CITY = ed.CITY; 
                    Suppliers[ix].PIC = ed.PIC;
                    UpdateGrid(ix);
                } else {
                    var newdata = data[0];
                    Suppliers.push(newdata);
                    AddToGrid(newdata, Suppliers.length - 1);
                }
                setModes(MODES.DEFAULT);
            });
    });

    $('#CancelButton').click(function (e) {
        setModes(MODES.DEFAULT); 
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
                    var colNames = [ 'SUPPLIER_CODE', 'SUPPLIER_NAME', 'ADDRESS', 'PROVINCE', 'CITY', 'PIC' ];

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
        setModes(MODES.ADD); 
        $('#SUPPLIER_CODE').prop('readonly', false);
        $('#SUPPLIER_CODE').val('');
        $('#SUPPLIER_NAME').val('');
        $('#ADDRESS').val('');
        $('#PROVINCE').val('');
        $('#CITY').val('');
        $('#PIC').val('');
        $('#SUPPLIER_CODE').focus();
    });
    $('#EditButton').click(function (e) {
        var a = $('#SuppliersGrid>tbody>tr.dataRow>td.colSELECTION>input[type=checkbox]:checked');
        if (a.length < 1) {
            alert('select data to edit');
            return;
        } else if (a.length > 1) {
            alert('select only one data to edit');
            return;
        }
        var supplierCode = a[0].value;
        SupplierCodeOnSearch(supplierCode);
        $('#SUPPLIER_CODE').val(supplierCode);
        $('#SUPPLIER_CODE').prop('readonly', true);
        $('#SUPPLIER_NAME').focus();
        setModes(MODES.EDIT);

    });
    $('#DeleteButton').click(function (e) {
        var data = [];
        $.each( $('#SuppliersGrid>tbody>tr.dataRow>td.colSELECTION>input[type=checkbox]:checked'), function (i, a) { data.push(a.value); } );
        if (data.length > 0) {
            console.log('data: ', data);
            if (confirm("Apakah anda yakin ingin menghapus data ini ?")) {
                $.post('/Supplier/DelSupplier', { data: data }
                    , function (x, h, r) { alert('data deletion ' + x); }
                    , "json")
                    .done(function (e) {
                        clearGrid(data);
                    });
            }
        } else {
            alert('select data to delete');
        }
    });
    setModes(MODES.INIT); 
});

