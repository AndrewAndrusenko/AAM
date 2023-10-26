-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

-- DROP FUNCTION IF EXISTS public.f_i_get_market_quotes_for_portfolios(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_get_market_quotes_for_portfolios(
	p_secid_list text[],
	p_report_date date)
    RETURNS TABLE(tradedate date, boardid character varying, is_primary numeric, board_title character varying, secid character varying, close numeric, currency_code numeric, percentprice boolean) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE cross_quote_rate numeric;
BEGIN
return query
with last_mtm_dates as (SELECT 
t_moexdata_foreignshares.secid,
max(t_moexdata_foreignshares.tradedate) filter  (where t_moexdata_foreignshares.close notnull) as td
FROM t_moexdata_foreignshares 
where t_moexdata_foreignshares.tradedate<=p_report_date
						
group by t_moexdata_foreignshares.secid
)
select 
t_moexdata_foreignshares.tradedate::date,t_moexdata_foreignshares.boardid,
mmoexboards.is_primary,mmoexboards.board_title,
t_moexdata_foreignshares.secid,
t_moexdata_foreignshares.close,
 t_moex_boards.currency_code,
t_moex_boards.percentprice
from last_mtm_dates
left join t_moexdata_foreignshares on (last_mtm_dates.secid=t_moexdata_foreignshares.secid and last_mtm_dates.td=t_moexdata_foreignshares.tradedate)
left join mmoexboards on mmoexboards.boardid = t_moexdata_foreignshares.boardid
left join t_moex_boards on t_moex_boards.code = t_moexdata_foreignshares.boardid

where t_moexdata_foreignshares.secid=ANY(p_secid_list)
and t_moexdata_foreignshares.close notnull
-- and mmoexboards.is_primary=1
;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_market_quotes_for_portfolios(text[], date)
    OWNER TO postgres;
