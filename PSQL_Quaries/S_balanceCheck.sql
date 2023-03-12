select "accountType", SUM("totalTO") from (
select "accountType", 
CASE "accountType" 
	WHEN 'Account' THEN SUM("closingBalance" * -1)   
	ELSE SUM("closingBalance")
END AS "totalTO"
from f_bbalancesheet_lastmovement ('2023-02-20') 
GROUP BY ("accountType")
ORDER BY "accountType"
) AS "bTotals"
GROUP BY CUBE (1)
ORDER BY 1