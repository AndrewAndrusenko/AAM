-- PROCEDURE: public.p_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric, numeric, numeric)

-- DROP PROCEDURE IF EXISTS public.p_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric, numeric, numeric);

CREATE OR REPLACE PROCEDURE public.p_fifo_create_out_transactions(
	p_idportfolio numeric,
	p_secid text,
	qty_to_execute numeric,
	execute_price numeric,
	p_id_trade numeric,
	p_tr_type_to_close numeric,
	INOUT rows_affected numeric DEFAULT NULL::numeric,
	INOUT idtrade numeric DEFAULT NULL::numeric)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  out_transaction_count integer;
  in_transaction_count integer;

BEGIN

PERFORM f_fifo_create_out_transactions(p_tr_type_to_close,p_id_trade);
GET DIAGNOSTICS out_transaction_count = ROW_COUNT;
  
PERFORM f_fifo_change_position_sign(p_id_trade,qty_to_execute);
GET DIAGNOSTICS in_transaction_count = ROW_COUNT;

-- IF in_transaction_count = 0 THEN
-- ROLLBACK;

-- RAISE
-- EXCEPTION 'Unable create short sell for transaction: %.', p_id_trade;

-- END IF;

rows_affected = out_transaction_count + in_transaction_count;
idtrade=p_id_trade;
COMMIT;
END;
$BODY$;

ALTER PROCEDURE public.p_fifo_create_out_transactions(numeric, text, numeric, numeric, numeric, numeric, numeric, numeric)
    OWNER TO postgres;
