-- POLICY: create_only_auto_entries_delete

DROP POLICY IF EXISTS create_only_auto_entries_delete ON public."bLedgerTransactions";

CREATE POLICY create_only_auto_entries_delete
    ON public."bLedgerTransactions"
    AS PERMISSIVE
    FOR DELETE
    TO aam_middile_officer
    USING (
			EXISTS (
				SELECT FROM "bcTransactionType_Ext_Privileges" tp 
				WHERE (tp.transaction_type_id = "bLedgerTransactions"."XactTypeCode_Ext" AND current_user=tp.role)
		));