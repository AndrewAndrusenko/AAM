-- PROCEDURE: public.p_a_b_balance_open(date, text)

-- DROP PROCEDURE IF EXISTS public.p_fifo_delete_accounting_fifo(date, text);

CREATE OR REPLACE PROCEDURE public.p_fifo_delete_accounting_fifo(
	p_idtrades numeric[],
	INOUT rows_affected record DEFAULT NULL::record)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  ledger_count integer;
  account_count integer;
  period_update integer;

BEGIN
SELECT * FROM public.f_fifo_delete_trades_from_fifo_calc(p_idtrades) INTO rows_affected;
GET DIAGNOSTICS ACCOUNT_COUNT = ROW_COUNT;
SELECT * FROM public.f_delete_allocation_accounting(p_idtrades) INTO rows_affected;
GET DIAGNOSTICS LEDGER_COUNT = ROW_COUNT;
-- IF PERIOD_UPDATE = 0 THEN
-- ROLLBACK;
-- RAISE
-- EXCEPTION 'Unable to update firstOpenedDate within table gAppMainParams. Balance can not be opened: %.', $1;
-- END IF;

-- ROWS_AFFECTED = LEDGER_COUNT + ACCOUNT_COUNT;

COMMIT;
END;
$BODY$;

ALTER PROCEDURE public.p_fifo_delete_accounting_fifo(numeric[], record)
    OWNER TO postgres;
