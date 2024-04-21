-- POLICY: create_only_auto_entries_insert
ALTER TABLE "bLedgerTransactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS create_only_auto_entries_insert ON public."bLedgerTransactions";

CREATE POLICY create_only_auto_entries_insert
    ON public."bLedgerTransactions"
    AS PERMISSIVE
    FOR INSERT
    TO aam_middile_officer
    WITH CHECK (
			EXISTS ( 
				SELECT FROM "bcTransactionType_Ext" et  
				WHERE (et.id = "bLedgerTransactions"."XactTypeCode_Ext") AND et.manual_edit_forbidden = true
			)
		);
