-- POLICY: create_only_auto_entries_insert

DROP POLICY IF EXISTS create_only_auto_entries_insert ON public."bLedgerTransactions";

CREATE POLICY create_only_auto_entries_insert
    ON public."bLedgerTransactions"
    AS PERMISSIVE
    FOR INSERT
    TO aam_middile_officer
    WITH CHECK (
			EXISTS (
				SELECT FROM "bcTransactionType_Ext_Privileges" tp 
				WHERE (tp.transaction_type_id = "bLedgerTransactions"."XactTypeCode_Ext" AND current_user=tp.role)
		));
