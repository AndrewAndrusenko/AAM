-- update dorders set parent_order = null where secid='GOOG-RM'
select * from dorders order by id desc
-- UPDATE dorders SET parent_order = null WHERE dorders.parent_order = ANY (SELECT 63) RETURNING *