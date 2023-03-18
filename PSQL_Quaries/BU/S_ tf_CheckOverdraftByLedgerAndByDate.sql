select * ,
("openingBalance" +	"accountTransaction"	+ "CrSignAmount" + "DbSignAmount") as "closingBalance" 

from stf_CheckOverdraftByLedgerAndByDate ('2023-03-19',2,2,10,1200)