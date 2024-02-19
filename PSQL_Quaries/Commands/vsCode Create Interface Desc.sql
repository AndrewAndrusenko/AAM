SELECT array_agg(
  column_name || ':' || 
  CASE
    WHEN data_type = 'date' THEN 'Date'
    WHEN data_type = 'character varying' 
	OR data_type = 'character'
	THEN 'string'
    WHEN data_type = 'numeric'
    OR data_type = 'bigint'
    OR data_type = 'integer'
    OR data_type = 'smallint' THEN 'number'
    ELSE data_type
  END)
FROM
  information_schema.columns
WHERE
  table_name = 'bcSchemeAccountTransaction';