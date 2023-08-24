SELECT * from public.f_create_bulk_orders(
	ARRAY (select array_agg(id) from dorders where secid in ('GOOG-RM') and id_portfolio notnull)
)
