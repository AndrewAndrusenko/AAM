-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

-- DROP FUNCTION IF EXISTS public.f_i_marks(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_marks(
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
RETURN query
WITH
  last_mtm_dates AS (
    SELECT
      t_moexdata_foreignshares.secid,
      MAX(t_moexdata_foreignshares.tradedate) FILTER (
        WHERE
          t_moexdata_foreignshares.close NOTNULL
      ) AS td
    FROM
      t_moexdata_foreignshares
    WHERE
      t_moexdata_foreignshares.tradedate::date <= p_report_date::date
    GROUP BY
      t_moexdata_foreignshares.secid
  )
SELECT
  t_moexdata_foreignshares.tradedate::date,
  t_moexdata_foreignshares.boardid,
  mmoexboards.is_primary,
  mmoexboards.board_title,
  t_moexdata_foreignshares.secid,
  t_moexdata_foreignshares.close,
  t_moex_boards.currency_code,
  t_moex_boards.percentprice
FROM
  last_mtm_dates
  LEFT JOIN t_moexdata_foreignshares ON (
    last_mtm_dates.secid = t_moexdata_foreignshares.secid
    AND last_mtm_dates.td = t_moexdata_foreignshares.tradedate
  )
  LEFT JOIN mmoexboards ON mmoexboards.boardid = t_moexdata_foreignshares.boardid
  LEFT JOIN t_moex_boards ON t_moex_boards.code = t_moexdata_foreignshares.boardid
WHERE
  t_moexdata_foreignshares.secid = ANY (p_secid_list)
  AND t_moexdata_foreignshares.close NOTNULL
-- and mmoexboards.is_primary=1
;
END;
$BODY$;

ALTER FUNCTION public.f_i_marks(text[], date)
    OWNER TO postgres;
