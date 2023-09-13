-- FUNCTION: public.f_delete_allocation_accounting(bigint[])

-- DROP FUNCTION IF EXISTS public.f_delete_allocation_accounting(bigint[]);

CREATE OR REPLACE FUNCTION public.f_create_depo_accounts(portfolio_ids
	bigint[], secid_for_depo text)
    RETURNS setof "bAccounts"
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH "newDepoAccounts" AS
	(INSERT INTO PUBLIC."bAccounts"("accountNo",
								"accountTypeExt",
								"Information",
								"clientId",
								"currencyCode",
								"entityTypeCode",
								idportfolio,
								"dateOpening",
								secid)
	(SELECT "accountNo" || '_' || secid_for_depo AS "accountNo",
			15 AS "accountTypeExt",
			'Depo account for ' || secid_for_depo AS "Information",
			"clientId",
			"currencyCode",
			"entityTypeCode",
			idportfolio,
			NOW()::TIMESTAMP WITHOUT TIME ZONE AS "dateOpening",
			secid_for_depo AS SECID
		FROM "bAccounts"
		WHERE "accountTypeExt" = 13
			AND idportfolio = ANY(portfolio_ids)
			AND secid ISNULL) RETURNING *)
SELECT *
FROM "newDepoAccounts";
END;
$BODY$;

ALTER FUNCTION public.f_create_depo_accounts(portfolio_ids
	bigint[], secid_for_depo text)
    OWNER TO postgres;
