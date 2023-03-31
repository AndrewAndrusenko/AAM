SELECT  "accountNo", "accountId", "accountType", "datePreviousBalance" ,"dateBalance" , "openingBalance", 
      "totalDebit", "totalCredit", "OutGoingBalance", "checkClosing", "xacttypecode" 
      FROM f_s_balancesheet_all()
	  where "dateBalance"::date = '2023-02-28'
	  UNION
SELECT "accountNo", "accountId", 'Account' AS "accountType", null AS "datePreviousBalance",
 '2050-01-01' AS "dateBalance",
MAX ("openingBalance") AS "openingBalance",  
SUM ("totalDebit") AS "totalDebit" , SUM ("totalCredit") AS "totalCredit",
(MAX("openingBalance") + SUM("signedTurnOver")) as "outBalance", 0,"xActTypeCode"
 FROM public.f_bcurrentturnoversandbalncesnotclosed(
	'2023-02-18'
) 
where "dataTime"::date <='2023-02-28'
group by "accountId", "accountNo", "xActTypeCode"
ORDER by "dateBalance", "accountNo"