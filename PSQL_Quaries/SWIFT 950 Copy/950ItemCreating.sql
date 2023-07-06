UPDATE "bSWIFTGlobalMsg" SET testid = null;

INSERT INTO public."bSWIFTGlobalMsg"("msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", testid)
SELECT "msgId", "senderBIC", '2023-06-29', "typeMsg", "accountNo",  id FROM "bSWIFTGlobalMsg" where id<=3;

INSERT INTO public."bSWIFTStatement"("msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction")
SELECT "bSWIFTGlobalMsg".id,"amountTransaction", "typeTransaction", '2023-06-29', comment, "entryAllocatedId", "refTransaction"||'2'
FROM public."bSWIFTStatement"  LEFT join	"bSWIFTGlobalMsg" on "bSWIFTGlobalMsg".testid::text = "bSWIFTStatement"."msgId"
WHERE "bSWIFTGlobalMsg".id NOTNULL;