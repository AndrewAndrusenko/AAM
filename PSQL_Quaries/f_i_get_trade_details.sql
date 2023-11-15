-- FUNCTION: public.f_i_get_bulk_order_details(numeric)

DROP FUNCTION IF EXISTS public.f_i_get_trade_details(numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_trade_details(
	p_idtrade numeric)
    RETURNS TABLE(
		tdate text, vdate text,secid_name text, cpty character varying,  
		qty numeric,allocatedqty numeric,
		price numeric,trtype character varying, tidinstrument character varying, trade_amount numeric,details character varying,
		accured_interest numeric,   settlement_amount numeric,
		settlement_rate numeric,idtrade numeric
		)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
allocated_qty numeric;
BEGIN
SELECT
  SUM(dtrades_allocated.qty) INTO allocated_qty
FROM
  public.dtrades_allocated
WHERE
  dtrades_allocated.idtrade = p_idtrade;

RETURN QUERY
SELECT
  TO_CHAR(dtrades.tdate,'mm/dd/yyyy'),
  TO_CHAR(dtrades.vdate,'mm/dd/yyyy'),
  mmoexsecurities.name AS secid_name,
  dclients.clientname AS cpty,
  dtrades.qty,
  allocated_qty AS allocatedqty,
  dtrades.price,
  dtrades.trtype,
  dtrades.tidinstrument,
  dtrades.trade_amount,
  dtrades.details,
  dtrades.accured_interest,
  dtrades.settlement_amount,
  dtrades.settlement_rate,
  dtrades.idtrade
FROM
  public.dtrades
  LEFT JOIN dclients ON dclients.idclient = dtrades.id_cpty
  LEFT JOIN mmoexsecurities ON mmoexsecurities.secid = dtrades.tidinstrument
WHERE
  dtrades.idtrade = p_idtrade;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_trade_details(numeric)
    OWNER TO postgres;
	select * from f_i_get_trade_details(294985)
