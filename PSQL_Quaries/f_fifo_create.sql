-- FUNCTION: public.f_fifo_create(numeric, text, numeric, numeric, numeric, numeric)

-- DROP FUNCTION IF EXISTS public.f_fifo_create(numeric, text, numeric, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_create(
	p_idportfolio numeric,
	p_secid text,
	p_qty_to_execute numeric,
	p_execute_price numeric,
	p_id_trade numeric,
	p_tr_type_to_close numeric)
    RETURNS TABLE(id bigint, idtrade bigint, tr_type smallint, qty numeric, qty_out numeric, price_in numeric, price_out numeric, closed boolean, idportfolio numeric, trade_date date, secid character varying, profit_loss numeric, id_sell_trade numeric, id_buy_trade numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT * FROM f_fifo_create_out_transactions(p_tr_type_to_close,p_id_trade,p_execute_price)
UNION  
SELECT * FROM f_fifo_change_position_sign(p_id_trade,p_qty_to_execute,p_execute_price);
END;
$BODY$;

ALTER FUNCTION public.f_fifo_create(numeric, text, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
