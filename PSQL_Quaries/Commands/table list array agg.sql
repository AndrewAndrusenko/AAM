WITH ms AS 
(SELECT tt.table_name
FROM
  information_schema.tables tt
	WHERE (tt.table_schema='public') 
	AND left(tt.table_name,3)!='pg_'
	AND left(tt.table_name,4)!='sql_'
	and table_type='BASE TABLE'
	order by table_name
 )
 select array_agg(ms.table_name) from ms