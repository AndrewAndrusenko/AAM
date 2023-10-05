-- FUNCTION: public.f_fifo_delete_trades_from_fifo_calc(numeric[])

DROP FUNCTION IF EXISTS public.f_a_delele_accounting_fifo_for_allocated_trade(numeric[]);

CREATE OR REPLACE FUNCTION public.f_a_delele_accounting_fifo_for_allocated_trade(
	p_idtrades numeric[])
    RETURNS TABLE(id text,id_trade numeric, affected_rows jsonb) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  'deleted_fifo',
  c.idtrade,
  TO_JSONB(c)
FROM
  (SELECT * FROM public.f_fifo_delete_trades_from_fifo_calc (p_idtrades)) c
UNION
SELECT
  'deleted_accounting',
  b.idtrade,
  TO_JSONB(b)
FROM
  (SELECT * FROM public.f_delete_allocation_accounting (p_idtrades)) b
ORDER BY
  idtrade,1;
END;
$BODY$;

ALTER FUNCTION public.f_a_delele_accounting_fifo_for_allocated_trade(numeric[])
    OWNER TO postgres;
