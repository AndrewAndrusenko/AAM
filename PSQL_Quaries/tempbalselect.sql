SELECT "accountId", "accountNo", "xActTypeCode",
MAX ("openingBalance"):: money, SUM("signedTurnOver")::money, 
(MAX("openingBalance") + SUM("signedTurnOver")) ::money as "outBalance", 
SUM ("totalDebit")::money, SUM ("totalCredit")::money  FROM public.f_bcurrentturnoversandbalncesnotclosed(
	'2023-02-19'
) 
where "dataTime"::date <='2023-03-14'
group by "accountId", "accountNo", "xActTypeCode"