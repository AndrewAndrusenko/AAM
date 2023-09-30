-- FUNCTION: public.f_delete_allocation_accounting(bigint[])

DROP FUNCTION IF EXISTS public.f_delete_allocation_accounting(bigint[]);

CREATE OR REPLACE FUNCTION public.f_delete_allocation_accounting(
	bigint[])
    RETURNS TABLE(id bigint, amount numeric,"entryDetails" character varying ,idtrade numeric) 
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
		WHERE "bAccountTransaction".idtrade = ANY ($1) RETURNING "bAccountTransaction".id,
			"bAccountTransaction"."amountTransaction","bAccountTransaction"."entryDetails","bAccountTransaction".idtrade),
	"deletedbLedgerTransactions" AS
	(DELETE
		FROM "bLedgerTransactions"
		WHERE "bLedgerTransactions".idtrade = ANY ($1) RETURNING "bLedgerTransactions".id,
			"bLedgerTransactions".amount,"bLedgerTransactions"."entryDetails","bLedgerTransactions".idtrade)
SELECT *
FROM "deletedbAccountTransaction"
UNION
SELECT *
FROM "deletedbLedgerTransactions";
END;
$BODY$;

ALTER FUNCTION public.f_delete_allocation_accounting(bigint[])
    OWNER TO postgres;
