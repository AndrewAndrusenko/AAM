SELECT array_agg(column_name||' '||data_type)
FROM
  information_schema.columns
WHERE
  table_name = 'dorders';