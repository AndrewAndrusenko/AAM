CREATE OR REPLACE PROCEDURE B_P_BALANCE_OPEN(CLOSINGDATE date, INOUT ROWS_AFFECTED text DEFAULT NULL) LANGUAGE PLPGSQL AS $$
DECLARE
  ledger_count integer;
  account_count integer;
  period_update integer;

BEGIN
DELETE FROM public."bAccountStatement" WHERE "dateAcc"::date = closingdate;
GET DIAGNOSTICS ACCOUNT_COUNT = ROW_COUNT;
DELETE FROM public."bLedgerStatement" WHERE "dateAcc"::date = closingdate;
GET DIAGNOSTICS LEDGER_COUNT = ROW_COUNT;


UPDATE "gAppMainParams"
SET "firstOpenedDate" = ("firstOpenedDate" + '1 day'::interval);

GET DIAGNOSTICS PERIOD_UPDATE = ROW_COUNT;

IF PERIOD_UPDATE = 0 THEN
ROLLBACK;

RAISE
EXCEPTION 'Unable to update firstOpenedDate within table gAppMainParams. Balance can not be opened: %.', $1;

END IF;

ROWS_AFFECTED = LEDGER_COUNT + ACCOUNT_COUNT;


COMMIT;
END;
$$;