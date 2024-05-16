SELECT tt.table_name,acpr.privilege_type,grantee,grantor,table_type 
FROM
  information_schema.tables tt
LEFT JOIN (
	SELECT *
	FROM information_schema.role_table_grants 
	WHERE grantee = 'aam_accountant'
	AND privilege_type='UPDATE'
) acpr ON acpr.table_name = tt.table_name
WHERE (tt.table_schema='public') 
	AND left(tt.table_name,3)!='pg_'
	AND left(tt.table_name,4)!='sql_'
	and table_type='BASE TABLE' and grantee notnull
ORDER BY table_name
