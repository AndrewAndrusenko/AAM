-- PROCEDURE: public.p_a_b_balance_close(date, text)

-- DROP PROCEDURE IF EXISTS public.p_a_b_balance_close(date, text);

CREATE OR REPLACE PROCEDURE public.p_a_b_balance_close(
	closingdate date,
	INOUT rows_affected text DEFAULT NULL::text)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
  ledger_count integer;
  account_count integer;
  period_update integer;
  
BEGIN
INSERT INTO "bAccountStatement" ("dateAcc",
								"closingBalance",
								"totalCredit",
								"totalDebit",
								"accountId")
SELECT "dataTime" AS "dateAcc",
	"openingBalance" + "signedTurnOver" AS "closingBalance",
	ACCOUNT."totalCredit",
	ACCOUNT."totalDebit",
	ACCOUNT."accountId"
FROM f_a_b_current_turnovers_and_balnces_not_closed_v2($1::date,null,null,null) AS ACCOUNT
WHERE "dataTime" = $1::date;

GET DIAGNOSTICS ACCOUNT_COUNT = ROW_COUNT;

INSERT INTO "bLedgerStatement" ("ledgerID",
								"closingBalance",
								"totalDebit",
								"totalCredit",
								"dateAcc")
SELECT LEDGER."accountId" AS "ledgerID",
	LEDGER."openingBalance" + LEDGER."signedTurnOver" AS "closingBalance",
	LEDGER."totalDebit",
	LEDGER."totalCredit",
	"dataTime" AS "dateAcc"
FROM PUBLIC.f_a_b_bcurrent_ledger_turnovers_balances_notclosed_v2($1::date,null,null,null) AS LEDGER
WHERE "dataTime" = $1::date;

GET DIAGNOSTICS LEDGER_COUNT = ROW_COUNT;

UPDATE "gAppMainParams"
SET "FirstOpenedDate" = (CLOSINGDATE + '1 day'::interval);

GET DIAGNOSTICS PERIOD_UPDATE = ROW_COUNT;

IF PERIOD_UPDATE = 0 THEN
ROLLBACK;

RAISE
EXCEPTION 'Unable to update firstOpenedDate within table gAppMainParams. Balance can not be closed: %.', $1;

END IF;

ROWS_AFFECTED = LEDGER_COUNT + ACCOUNT_COUNT;

COMMIT;
END;
$BODY$;

ALTER PROCEDURE public.p_a_b_balance_close(date, text)
    OWNER TO postgres;
