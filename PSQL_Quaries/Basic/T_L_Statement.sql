SELECT id, "ledgerID", cast("closingBalance" as money), "totalDebit", "totalCredit", "dateAcc"
	FROM public."bLedgerStatement"
	where "ledgerID" = 2
	ORDER by "dateAcc" desc limit 1