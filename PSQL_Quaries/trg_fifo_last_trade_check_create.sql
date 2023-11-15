-- FUNCTION: public.trg_fifo_last_trade_check_create()

-- DROP FUNCTION IF EXISTS public.trg_fifo_last_trade_check_create();

CREATE OR REPLACE FUNCTION public.trg_fifo_last_trade_check_create()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
id_lasttrade numeric;
lasttrade_not_in_fifo BOOLEAN;
idtrades_in_fifo numeric[];
BEGIN
SELECT
  id INTO id_lasttrade
FROM
  public.dtrades_allocated
  LEFT JOIN dtrades ON dtrades.idtrade = dtrades_allocated.idtrade
WHERE
  tdate::date < NEW.trade_date::date
  AND dtrades_allocated.idportfolio = NEW.idportfolio
  AND dtrades.tidinstrument=NEW.secid
ORDER BY
  tdate DESC,
  id DESC
LIMIT
  1;

SELECT
  NOT EXISTS (
    SELECT
      1,
      idtrade
    FROM
      dtrades_allocated_fifo
    WHERE
      idtrade = id_lasttrade
  ) INTO lasttrade_not_in_fifo;

IF (lasttrade_not_in_fifo = TRUE AND id_lasttrade NOTNULL) THEN 
	RAISE EXCEPTION 'There are trades without fifo accounting in the previous day. Trade % has to be included in fifo first',id_lasttrade;
END IF;

SELECT
  ARRAY_AGG(idtrade) INTO idtrades_in_fifo
FROM
  public.dtrades_allocated_fifo
WHERE
  trade_date::date > NEW.out_date::date
  AND dtrades_allocated_fifo.idportfolio = NEW.idportfolio
  AND dtrades_allocated_fifo.secid=NEW.secid;
IF (array_length(idtrades_in_fifo,1)>0) THEN
	RAISE EXCEPTION 'There are trades in the fifo accounting after current trade date %. Trades % have to be deleted from fifo first',NEW.trade_date, idtrades_in_fifo;
END IF;
RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_fifo_last_trade_check_create()
    OWNER TO postgres;
