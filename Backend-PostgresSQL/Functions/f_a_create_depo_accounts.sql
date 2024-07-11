-- FUNCTION: public.f_create_depo_accounts(bigint[], text)

-- DROP FUNCTION IF EXISTS public.f_a_create_depo_accounts(bigint[], text);

CREATE OR REPLACE FUNCTION public.f_a_create_depo_accounts(
	p_portfolio_ids bigint[],
	p_secid_for_depo text)
    RETURNS SETOF "bAccounts" 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
portfolios_without_root_depo text[];
qty_portfolios_without_root_depo numeric;
first_accounting_date date;
BEGIN
SELECT  "FirstOpenedDate" INTO first_accounting_date FROM public."gAppMainParams";
SELECT
	ARRAY_AGG(portfolioname) INTO portfolios_without_root_depo
FROM
	UNNEST(p_portfolio_ids)  AS t1
	LEFT JOIN dportfolios ON t1.t1 = dportfolios.idportfolio
	LEFT JOIN (
		SELECT
			"accountId",
			idportfolio
		FROM
			"bAccounts"
		WHERE
			"accountTypeExt" = 13
			AND idportfolio = ANY (p_portfolio_ids)
	) AS depo ON depo.idportfolio = t1.t1
WHERE
	"accountId" ISNULL;
IF array_length(portfolios_without_root_depo,1)>0 THEN
RAISE EXCEPTION 'Portfolio without root depo account %',ARRAY_TO_STRING(portfolios_without_root_depo,',');
END IF;
RETURN QUERY
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
	(SELECT "accountNo" || '_' || p_secid_for_depo AS "accountNo",
			15 AS "accountTypeExt",
			'Depo account for ' || p_secid_for_depo AS "Information",
			"clientId",
			"currencyCode",
			"entityTypeCode",
			idportfolio,
			first_accounting_date::TIMESTAMP WITHOUT TIME ZONE AS "dateOpening",
			p_secid_for_depo AS SECID
		FROM "bAccounts"
		WHERE "accountTypeExt" = 13
			AND idportfolio = ANY(p_portfolio_ids)
			AND secid ISNULL) RETURNING *)
SELECT *
FROM "newDepoAccounts";
END;
$BODY$;

ALTER FUNCTION public.f_a_create_depo_accounts(bigint[], text)
    OWNER TO postgres;
