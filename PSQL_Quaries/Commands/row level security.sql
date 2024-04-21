-- ALTER TABLE "bAccountTransaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY create_only_auto_entries_insert ON "bAccountTransaction" ;
CREATE POLICY create_only_auto_entries_insert ON "bAccountTransaction" FOR INSERT TO aam_middile_officer
WITH CHECK (
	(SELECT manual_edit_forbidden=TRUE FROM "bcTransactionType_Ext" et WHERE et.id = "bAccountTransaction"."XactTypeCode_Ext") 
);