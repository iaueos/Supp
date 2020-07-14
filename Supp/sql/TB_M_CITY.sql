create table tb_m_city ( province varchar(50), city varchar(50), id integer identity(1,1), Created Datetime constraint df_m_city_created default getdate(), 
creator varchar(50), modified datetime, modifier varchar(50), constraint pk_m_city primary key (id)); 
