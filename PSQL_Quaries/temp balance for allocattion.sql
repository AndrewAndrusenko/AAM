SELECT *
	FROM public."bAccountStatement";
	SELECT DISTINCT ON("b"."accountId") 
	"b"."accountId", "b"."dateAcc", "b"."closingBalance",
	"b"."totalCredit", "b"."totalDebit" 
	FROM "bAccountStatement" as "b" 
    WHERE "b"."dateAcc" < '08/15/2023'
	ORDER BY "b"."accountId", "dateAcc" DESC 