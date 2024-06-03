UPDATE "bSWIFTGlobalMsg" SET testid = null; -- its needed to take only one bulk and do not duplicate relations btw glb msg and items

INSERT INTO public."bSWIFTGlobalMsg"("msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", testid)
SELECT "msgId", "senderBIC", now()::date, "typeMsg", "accountNo",  id FROM "bSWIFTGlobalMsg" where id<=3;

INSERT INTO public."bSWIFTStatement"("msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction")
SELECT "bSWIFTGlobalMsg".id,"amountTransaction", "typeTransaction", now()::date, comment, "entryAllocatedId", "refTransaction"||'2'
FROM public."bSWIFTStatement"  LEFT join	"bSWIFTGlobalMsg" on "bSWIFTGlobalMsg".testid::text = "bSWIFTStatement"."msgId"
WHERE "bSWIFTGlobalMsg".id NOTNULL;

-- SELECT * FROM  public."bSWIFTStatement" order by id desc


-- SELECT * FROM  public."bSWIFTGlobalMsg" order by id desc
