SELECT array_agg('dtrades_allocated_fifo.'||column_name)
FROM
  information_schema.columns
WHERE
  table_name = 'dtrades_allocated_fifo';