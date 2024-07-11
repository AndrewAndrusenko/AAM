-- FUNCTION: public.f_i_get_market_quotes_for_portfolios1(text[], date)

DROP FUNCTION IF EXISTS public.f_i_get_market_quote_for_trade(text, date);

CREATE OR REPLACE FUNCTION public.f_i_get_market_quote_for_trade(
	p_secid text,
	p_report_date date)
    RETURNS TABLE(secid character varying,close numeric, tradedate date, boardid character varying ) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
  SELECT
      t_moexdata_foreignshares.secid,
      t_moexdata_foreignshares.close ,
      t_moexdata_foreignshares.tradedate::date,
      t_moexdata_foreignshares.boardid
    FROM
      t_moexdata_foreignshares
      LEFT JOIN mmoexboards ON mmoexboards.boardid = t_moexdata_foreignshares.boardid
      LEFT JOIN t_moex_boards ON t_moex_boards.code = t_moexdata_foreignshares.boardid
    WHERE
      t_moexdata_foreignshares.tradedate::date <= p_report_date
      AND t_moexdata_foreignshares.secid = p_secid
      AND t_moexdata_foreignshares.close NOTNULL
    ORDER BY
      t_moexdata_foreignshares.tradedate DESC
    LIMIT
      1;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_market_quote_for_trade(text, date)
    OWNER TO postgres;
select * from f_i_get_market_quote_for_trade ('GOOG-RM','11/01/23')