-- FUNCTION: public.f_a_delele_accounting_fifo_for_allocated_trade(numeric[])

-- DROP FUNCTION IF EXISTS public.f_a_create_accounting_fifo_for_allocated_trade(numeric[]);

CREATE OR REPLACE FUNCTION public.f_a_create_accounting_fifo_for_allocated_trade(
	p_idportfolio numeric,
	p_secid text,
	qty_to_execute numeric,
	execute_price numeric,
	p_id_trade numeric,
	p_tr_type_to_close numeric)
    RETURNS TABLE(id text, id_trade numeric, affected_rows jsonb) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  'created_fifo_out_transactions',
  c.idtrade,
  TO_JSONB(c)
FROM
  (SELECT * FROM public.f_fifo_create_out_transactions(p_tr_type_to_close,p_id_trade)) c
UNION
SELECT
  'created_fifo_in_transactions_changed_postion_sign',
  b.idtrade,
  TO_JSONB(b)
FROM
  (SELECT * FROM public.f_fifo_change_position_sign(p_id_trade,qty_to_execute)) b
ORDER BY
  idtrade,1;
END;
$BODY$;
  
ALTER FUNCTION public.f_a_create_accounting_fifo_for_allocated_trade(numeric,text,numeric,numeric,numeric,numeric)
    OWNER TO postgres;
