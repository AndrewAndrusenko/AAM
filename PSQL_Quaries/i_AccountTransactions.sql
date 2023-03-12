INSERT INTO public."bAccountTransaction" 
("ledgerNoId", "dataTime", "XactTypeCode", "XactTypeCode_Ext", "accountId", "amountTransaction", "entryDetails", "extTransactionId")

select 
"ledgerNoId", '2023-02-21', "XactTypeCode", "XactTypeCode_Ext", "accountId", "amountTransaction", "entryDetails", "extTransactionId"
from "bAccountTransaction" where "dataTime"::date = '2023-02-20'::date
