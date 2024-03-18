-- DROP FUNCTION IF EXISTS public.f_a_b_balance_date_accounts( daterange, numeric[], text[]);

CREATE OR REPLACE FUNCTION public.f_a_b_balance_date_accounts(
	p_date_balance_range daterange,
	p_account_types numeric[],
	p_accounts_list text[]
)
    RETURNS TABLE(
	"accountNo" character varying,
    "accountTypeExt" bigint ,
    "clientId" bigint ,
    "currencyCode" numeric,
    "entityTypeCode" bigint ,
    "accountId" bigint ,
    "dateOpening" date,
    idportfolio bigint ,
    "dateAcc" date)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
 SELECT 
	 "bAccounts"."accountNo",
    "bAccounts"."accountTypeExt",
    "bAccounts"."clientId",
    "bAccounts"."currencyCode",
    "bAccounts"."entityTypeCode",
    "bAccounts"."accountId",
    "bAccounts"."dateOpening",
    "bAccounts".idportfolio,
    "balanceDate"."dateAcc"
   FROM "bAccounts"
     CROSS JOIN LATERAL (  
		SELECT DISTINCT "bAccountStatement"."dateAcc"
		FROM "bAccountStatement"
		  WHERE (p_date_balance_range ISNULL OR  p_date_balance_range@>"bAccountStatement"."dateAcc")
		UNION
		SELECT DISTINCT "bLedgerStatement"."dateAcc" 
		FROM "bLedgerStatement"
		WHERE (p_date_balance_range ISNULL OR  p_date_balance_range@>"bLedgerStatement"."dateAcc")
	 ) "balanceDate"
  WHERE
  "bAccounts"."dateOpening" <= "balanceDate"."dateAcc" AND
  (p_accounts_list ISNULL OR "bAccounts"."accountNo"=ANY(p_accounts_list)) AND
  (p_account_types ISNULL OR "bAccounts"."accountTypeExt"=ANY(p_account_types));
  
END;
$BODY$;

ALTER FUNCTION public.f_a_b_balance_date_accounts(daterange, numeric[], text[])
    OWNER TO postgres;
select * from f_a_b_balance_date_accounts(
	'[3/5/2024,3/7/2024]'::daterange,
										  array[8],null
-- 										  array['ClearAll', '40820840PANDRW001', '40807840CLIEN3001' ]
)