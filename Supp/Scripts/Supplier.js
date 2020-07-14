var ProvinceCity = [];
var Provinces = [];
var Suppliers = []; 

function distinct(value, index, self) { return value!==undefined && self.indexOf(value) === index; }

function renderOptions(e, aOptions) {
    var oe = $(e);
    oe.empty();
    oe.append($('<option/>').val('').text('ALL'));
    $.each(aOptions, function (i, a) { oe.append($('<option/>').val(a).text(a)); });
}

function SupplierCodeOnSearch(SUPPLIER_CODE) {
    $.getJSON('/Supplier/GetSupplier?SUPPLIER_CODE=' + encodeURIComponent(SUPPLIER_CODE)
        , function (x, h, r) {
            console.log(x);
            if (x.length < 1) return; 

            var s = x[0];
            $('#SUPPLIER_NAME').val(s.SUPPLIER_NAME);
            $('#ADDRESS').val(s.ADDRESS);
            $('#PROVINCE').val(s.PROVINCE);
            $('#CITY').val(s.CITY);
            $('#PIC').val(s.PIC);
    });
}


$(function () {
    $.getJSON("/Supplier/GetProvinceCity", function (data, status, xhr) {
        ProvinceCity = data;
        console.log('data:', data);

        var p = ProvinceCity.map(function (v, i, a) {
            return v.PROVINCE;
        }); 
        Provinces = p.filter(distinct);
        console.log('Provinces: ', Provinces);
        renderOptions('#ProvinceSelect', Provinces);
        renderOptions('#PROVINCE', Provinces);
    });

    
    $('#ProvinceSelect').change(function (e) {
        var provinceSelected = $(this).val(); 
        var c = ProvinceCity.map(function (v, i, a) {
            if (v.PROVINCE === provinceSelected)
                return v.CITY;
        });
        var aCities = c.filter(distinct);
        renderOptions("#CitySelect", aCities);
    });

    $('#PROVINCE').change(function (e) {
        var provinceSelected = $(this).val();
        var c = ProvinceCity.map(function (v, i, a) { if (v.PROVINCE === provinceSelected) return v.CITY; });
        var iCities = c.filter(distinct);
        renderOptions('#CITY', iCities);
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
        alert('DownloadButton.Click');
    });

    $('#UploadButton').click(function (e) {
        alert('UploadButton.Click');
    });

    $('#AddButton').click(function (e) {
        alert('AddButton.Click');
    });
    $('#EditButton').click(function (e) {
        alert('EditButton.Click');
    });
    $('#DeleteButton').click(function (e) {
        if (confirm("Delete this record?")) {
            console.log("Deleted");
        }
    });

});

