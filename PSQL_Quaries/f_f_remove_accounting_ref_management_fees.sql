-- FUNCTION: public.f_f_remove_accounting_ref_management_fees(numeric[])

-- DROP FUNCTION IF EXISTS public.f_f_remove_accounting_ref_management_fees(numeric[]);

CREATE OR REPLACE FUNCTION public.f_f_remove_accounting_ref_management_fees(
	p_entries_ids numeric[])
    RETURNS numeric[]
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
o_inserted_qty numeric;
deleted_entries numeric[];
BEGIN
WITH 
deleted_accounted_trans AS (
	delete from "bAccountTransaction"
	where id = ANY(p_entries_ids) and "dataTime">'09/22/2023' RETURNING id
),
deleted_ledger_trans AS (
delete from "bLedgerTransactions"
where id = ANY(p_entries_ids) and "dateTime">'09/22/2023' RETURNING id
),
deleted_entries AS (
SELECT * FROM deleted_accounted_trans
UNION
SELECT * FROM deleted_ledger_trans
)
SELECT array_agg(id) into deleted_entries from deleted_entries ;

UPDATE dfees_transactions
SET
  id_b_entry1 = NULL,
    b_transaction_date = null
WHERE
   deleted_entries::bigint[]@>id_b_entry1;
GET DIAGNOSTICS o_inserted_qty = ROW_COUNT;
RETURN deleted_entries;
END
$BODY$;

ALTER FUNCTION public.f_f_remove_accounting_ref_management_fees(numeric[])
    OWNER TO postgres;
