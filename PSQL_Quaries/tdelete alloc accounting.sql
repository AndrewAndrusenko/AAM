WITH "deletedbAccountTransaction" as(
delete from "bAccountTransaction" where idtrade=463 returning id,"amountTransaction"),
"deletedbLedgerTransactions" as (
delete FROM "bLedgerTransactions" where idtrade=463 returning id,amount) 
select * from "deletedbAccountTransaction"
UNION
select * from "deletedbLedgerTransactions"