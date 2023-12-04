-- FUNCTION: public.f_i_get_market_quotes_for_portfolios1(text[], date)

-- DROP FUNCTION IF EXISTS public.f_i_get_market_quotes_for_portfolios1(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_get_market_quotes_for_portfolios1(
	p_secid_list text[],
	p_report_date date)
    RETURNS TABLE(tradedate date, boardid character varying, secid text, close numeric, currency_code numeric, percentprice boolean, is_primary numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT 
  last_quotes.tradedate,
  last_quotes.boardid,
  sec_list.sec_list,
  last_quotes.close,
  last_quotes.currency_code,
  last_quotes.percentprice,
  last_quotes.is_primary
FROM
  UNNEST(p_secid_list) AS sec_list
  LEFT JOIN LATERAL (
    SELECT
      t_moexdata_foreignshares.secid,
      t_moexdata_foreignshares.close,
      t_moexdata_foreignshares.tradedate::date,
      t_moexdata_foreignshares.boardid,
      t_moex_boards.currency_code,
      t_moex_boards.percentprice,
      mmoexboards.is_primary
    FROM
      t_moexdata_foreignshares
      LEFT JOIN mmoexboards ON mmoexboards.boardid = t_moexdata_foreignshares.boardid
      LEFT JOIN t_moex_boards ON t_moex_boards.code = t_moexdata_foreignshares.boardid
    WHERE
      t_moexdata_foreignshares.tradedate::date <= p_report_date
      AND t_moexdata_foreignshares.secid = sec_list.sec_list
      AND t_moexdata_foreignshares.close NOTNULL
    ORDER BY
      t_moexdata_foreignshares.tradedate DESC
    LIMIT
      1
  ) last_quotes ON TRUE;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_market_quotes_for_portfolios1(text[], date)
    OWNER TO postgres;
