UPDATE dorders
SET status = 'in_execution'
WHERE id = ANY(ARRAY[131,130]) OR parent_order = ANY(ARRAY[131,130]) 
RETURNING *
