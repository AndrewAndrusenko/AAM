SELECT * from public.f_create_bulk_orders(
	ARRAY (select array_agg(id) from dorders where secid in ('GOOG-RM','SU26223RMFS6') and id_portfolio notnull)
)
