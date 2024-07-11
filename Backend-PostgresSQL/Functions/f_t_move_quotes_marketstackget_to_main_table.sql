-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

-- DROP FUNCTION IF EXISTS public.f_t_move_quotes_marketstackget_to_main_table(date,numeric);

CREATE OR REPLACE FUNCTION public.f_t_move_quotes_marketstackget_to_main_table(
	p_quotes_date date,
	INOUT o_rows_moved numeric )
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE

AS $BODY$
BEGIN
DELETE
	FROM public.t_moexdata_foreignshares
	WHERE 
		sourcecode='msFS'
		AND tradedate=p_quotes_date;
INSERT INTO
  public.t_moexdata_foreignshares (
    boardid,
    secid,
    open,
    low,
    high,
    close,
    volume,
    legalcloseprice,
    waprice,
    globalsource,
    sourcecode,
    tradedate
  )
SELECT
  exchange AS boardid,
  secid,
  open,
  low,
  high,
  close,
  volume,
  adj_close,
  adj_close,
  globalsource,
  sourcecode,
  date AS tradedate
FROM
  t_marketstack_eod
  LEFT JOIN "aInstrumentsCodes" ON (
    "aInstrumentsCodes".code = t_marketstack_eod.symbol
    AND mapcode = 'msFS'
  )
WHERE
  "date"::date = p_quotes_date::date;
 GET DIAGNOSTICS o_rows_moved = ROW_COUNT;
  
END
$BODY$;

ALTER FUNCTION public.f_t_move_quotes_marketstackget_to_main_table(date,numeric)
    OWNER TO postgres;
