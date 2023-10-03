-- FUNCTION: public.f_fifo_select_current_positions_for_trade(text)

-- DROP FUNCTION IF EXISTS public.f_fifo_select_current_positions_for_trade(text);

CREATE OR REPLACE FUNCTION public.f_fifo_select_current_positions_for_trade(
	p_secid text)
    RETURNS TABLE(idportfolio numeric, "position" numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT 
dtrades_allocated_fifo.idportfolio,
SUM(CASE
	WHEN dtrades_allocated_fifo.closed = FALSE THEN (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out)*dtrades_allocated_fifo.tr_type
	ELSE 0
  END 
)AS POSITION
FROM
  public.dtrades_allocated_fifo
WHERE
--   dtrades_allocated_fifo.idportfolio = ANY(p_idportfolio)
--   AND 
  dtrades_allocated_fifo.secid = p_secid
GROUP BY dtrades_allocated_fifo.idportfolio;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_current_positions_for_trade(text)
    OWNER TO postgres;
