DO
$$
DECLARE
    t record;
BEGIN
	FOR t IN 
	SELECT tt.table_name,acpr.privilege_type,grantee,grantor,table_type 
	FROM
		information_schema.tables tt
	LEFT JOIN (
		SELECT *
		FROM information_schema.role_table_grants 
		WHERE grantee = 'aam_middile_officer'
		AND privilege_type='SELECT'
	) acpr ON acpr.table_name = tt.table_name
	WHERE (tt.table_schema='public') 
		AND left(tt.table_name,3)!='pg_'
		AND left(tt.table_name,4)!='sql_'
		and table_type='BASE TABLE' and grantee isnull
	ORDER BY table_name
	LOOP
			EXECUTE format('GRANT SELECT ON TABLE public.%I TO aam_middile_officer;',  t.table_name);
	END LOOP;
END;
$$ LANGUAGE plpgsql;
