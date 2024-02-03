SELECT 
-- array_agg(
  column_name || ':' || 
  CASE
    WHEN data_type = 'date' THEN '"Date"'
    WHEN data_type = 'character varying' THEN '"string"'
    WHEN data_type = 'numeric'
    OR data_type = 'bigint'
    OR data_type = 'smallint' THEN '"number"'
    ELSE '"'||data_type||'""'
  END
--   )
FROM
  information_schema.columns
WHERE
  table_name = 'dtrades_allocated_fifo';