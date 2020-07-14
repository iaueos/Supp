MERGE INTO TB_M_SUPPLIER m 
USING (
	SELECT 
		@SUPPLIER_CODE supplier_code , 
		@SUPPLIER_NAME supplier_name, 
		@ADDRESS address, 
		@PROVINCE province, 
		@CITY city,
		@PIC pic
) x on x.supplier_code = m.SUPPLIER_CODE 
WHEN MATCHED THEN 
UPDATE set SUPPLIER_NAME = x.supplier_name, ADDRESS = x.address
   , PROVINCE = x.province, CITY = x.city, PIC = x.PIC
WHEN NOT MATCHED THEN 
INSERT (SUPPLIER_CODE, SUPPLIER_NAME, ADDRESS, PROVINCE, CITY, PIC) 
VALUES (x.supplier_code, x.supplier_name, x.address, x.province, x.city, x.pic) ;