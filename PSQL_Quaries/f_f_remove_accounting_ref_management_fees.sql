-- FUNCTION: public.f_f_insert_management_fees(text[], date, date)

DROP FUNCTION IF EXISTS public.f_f_remove_accounting_ref_management_fees(numeric[]);

CREATE OR REPLACE FUNCTION public.f_f_remove_accounting_ref_management_fees(
	p_fees_id numeric[])
    RETURNS numeric
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
o_inserted_qty numeric;
BEGIN
WITH
  fees_set AS (
    SELECT
      id,
      id_b_entry
    FROM
      public.dfees_transactions
    WHERE
      dfees_transactions.id = ANY (p_fees_id)
      AND id_b_entry NOTNULL
  ),
  fees_with_empty_ref AS (
    SELECT
      *
    FROM
      fees_set
      LEFT JOIN (
        SELECT
          id AS id_entry
        FROM
          "bAccountTransaction"
        WHERE
          id = ANY (SELECT id_b_entry FROM fees_set)
      ) AS entries ON entries.id_entry = fees_set.id_b_entry
    WHERE
      id_entry ISNULL
  )
UPDATE dfees_transactions
SET
  id_b_entry = NULL
WHERE
  id = ANY (SELECT id FROM fees_with_empty_ref);
GET DIAGNOSTICS o_inserted_qty = ROW_COUNT;
RETURN o_inserted_qty;
END
$BODY$;

ALTER FUNCTION public.f_f_remove_accounting_ref_management_fees(numeric[])
    OWNER TO postgres;
select * from f_f_remove_accounting_ref_management_fees(array[5823,5824,5825])