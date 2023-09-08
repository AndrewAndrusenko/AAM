-- FUNCTION: public.f_delete_bulk_orders(bigint[])

-- DROP FUNCTION IF EXISTS public.f_delete_bulk_orders(bigint[]);

CREATE OR REPLACE FUNCTION public.f_delete_allocation_accounting(
	bigint[])
    RETURNS TABLE(id bigint, amount numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH "deletedbAccountTransaction" AS
	(DELETE
		FROM "bAccountTransaction"
		WHERE IDTRADE = ANY ($1) RETURNING "bAccountTransaction".id,
			"bAccountTransaction"."amountTransaction"),
	"deletedbLedgerTransactions" AS
	(DELETE
		FROM "bLedgerTransactions"
		WHERE IDTRADE = ANY ($1) RETURNING "bLedgerTransactions".id,
			"bLedgerTransactions".amount)
SELECT *
FROM "deletedbAccountTransaction"
UNION
SELECT *
FROM "deletedbLedgerTransactions";
END;
$BODY$;

ALTER FUNCTION public.f_delete_allocation_accounting(bigint[])
    OWNER TO postgres;
