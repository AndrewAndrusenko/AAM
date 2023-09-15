CREATE OR REPLACE PROCEDURE b_p_balance_close(
	closingdate date,
	INOUT rows_affected text DEFAULT null) 
LANGUAGE plpgsql
AS $$
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
FROM F_BCURRENTTURNOVERSANDBALNCESNOTCLOSED($1::date) AS ACCOUNT
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
FROM PUBLIC.F_BCURRENT_LEDGER_TURNOVERS_BALANCES_NOTCLOSED($1::date) AS LEDGER
WHERE "dataTime" = $1::date;

GET DIAGNOSTICS LEDGER_COUNT = ROW_COUNT;

UPDATE "gAppMainParams"
SET "firstOpenedDate" = (CLOSINGDATE + '1 day'::interval);

GET DIAGNOSTICS PERIOD_UPDATE = ROW_COUNT;

IF PERIOD_UPDATE = 0 THEN
ROLLBACK;

RAISE
EXCEPTION 'Unable to update firstOpenedDate within table gAppMainParams. Balance can not be closed: %.', $1;

END IF;

ROWS_AFFECTED = LEDGER_COUNT + ACCOUNT_COUNT;


COMMIT;
END;
$$;