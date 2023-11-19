SELECT * from public.f_i_o_create_orders_by_mp3(
	array['icm011'],array['aapl-rm','goog-rm'],now()::date,840::int,0.01::numeric
-- 	<p_portfolio_code text[]>, 
-- 	<p_secid_list text[]>, 
-- 	<p_report_date date>, 
-- 	<p_report_currency integer>, 
-- 	<p_min_deviation numeric>
)