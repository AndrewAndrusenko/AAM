-- PROCEDURE: public.p_a_b_balance_open(date, text)

-- DROP PROCEDURE IF EXISTS public.p_fifo_create_out_transactions(date, text);

CREATE OR REPLACE PROCEDURE public.p_fifo_create_out_transactions(
	p_idportfolio numeric,
	p_secid text,
	qty_to_execute numeric,
	execute_price numeric,
	p_id_trade numeric,
	INOUT rows_affected text DEFAULT NULL::text)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  out_transaction_count integer;
  in_transaction_count integer;

BEGIN


PERFORM f_fifo_create_sell_transactions(p_idportfolio,p_secid,qty_to_execute, execute_price,p_id_trade);
GET DIAGNOSTICS out_transaction_count = ROW_COUNT;
  
PERFORM f_fifo_change_position_sign(p_id_trade,qty_to_execute);
GET DIAGNOSTICS in_transaction_count = ROW_COUNT;

-- IF in_transaction_count = 0 THEN
-- ROLLBACK;

-- RAISE
-- EXCEPTION 'Unable create short sell for transaction: %.', p_id_trade;

-- END IF;

rows_affected = out_transaction_count + in_transaction_count;

COMMIT;
END;
$BODY$;

ALTER PROCEDURE public.p_fifo_create_out_transactions(numeric,text,numeric,numeric,numeric, text)
    OWNER TO postgres;
