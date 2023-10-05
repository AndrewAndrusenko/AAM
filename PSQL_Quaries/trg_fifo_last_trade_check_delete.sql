-- FUNCTION: public.trg_fifo_last_trade_check_delete()

-- DROP FUNCTION IF EXISTS public.trg_fifo_last_trade_check_delete();

CREATE OR REPLACE FUNCTION public.trg_fifo_last_trade_check_delete()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE 
id_last_trade numeric;
BEGIN
	SELECT 
	  CASE
		WHEN id_sell_trade != 0 THEN id_sell_trade
		ELSE idtrade
	  END INTO id_last_trade
	FROM
	  dtrades_allocated_fifo
	WHERE 
	  idportfolio=OLD.idportfolio 
	  AND secid=OLD.secid
	ORDER BY
	  id DESC
	LIMIT 1;
   IF (OLD.idtrade != id_last_trade  AND OLD.id_sell_trade != id_last_trade ) 
   THEN
      RAISE EXCEPTION 'It is not the latest trade in the FIFO calculation. Firstly the trade % has to be deleted from calcualtion', id_last_trade;
   END IF;
   RETURN OLD;
   
END
$BODY$;

ALTER FUNCTION public.trg_fifo_last_trade_check_delete()
    OWNER TO postgres;
