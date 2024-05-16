SELECT * 
FROM
  information_schema.tables tt
	where table_schema='public' and
	table_type='BASE TABLE'