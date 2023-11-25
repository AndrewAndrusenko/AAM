-- select * from f_i_get_market_quotes_for_portfolios1 (
-- ARRAY(select distinct secid from dorders),
-- now()::date)
select * from f_i_get_market_quotes_for_portfolios (
ARRAY(select distinct secid from dorders),
now()::date)