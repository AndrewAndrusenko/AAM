-- FUNCTION: public.f_a_b_get_all_entries_transactions(date, date, numeric[], text[], text[], numeric)

DROP FUNCTION IF EXISTS public.f_a_b_get_qty_entries_per_allocated_trade(numeric[]);

CREATE OR REPLACE FUNCTION public.f_a_b_get_qty_entries_per_allocated_trade(
	p_id_allocated_trades numeric[])
    RETURNS TABLE(
		idtrade numeric,
		entries_qty bigint 
		)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH
  account_entries AS (
    SELECT
      "bAccountTransaction".id,"bAccountTransaction".idtrade
    FROM
      "bAccountTransaction"
    WHERE
      "bAccountTransaction".idtrade = ANY (p_id_allocated_trades)
  ),
  ledger_entries AS (
    SELECT
      "bLedgerTransactions".id,"bLedgerTransactions".idtrade
    FROM
      "bLedgerTransactions"
    WHERE
      "bLedgerTransactions".idtrade = ANY (p_id_allocated_trades)
  )
SELECT
  entries.idtrade, COUNT(entries.entries_qty)
FROM
  (
    SELECT
      account_entries.idtrade, account_entries.id AS entries_qty
    FROM
      account_entries
    UNION
    SELECT
      ledger_entries.idtrade,ledger_entries.id AS entries_qty
    FROM
      ledger_entries
  ) AS entries
GROUP BY
  entries.idtrade;
END;
$BODY$;

ALTER FUNCTION public.f_a_b_get_qty_entries_per_allocated_trade( numeric[])
    OWNER TO postgres;
select * from f_a_b_get_qty_entries_per_allocated_trade(array[19133,19135])