-- select * from "bAccountTransaction" where "dataTime"='09/01/2023'
-- select * from "bLedgerTransactions" where "dateTime"='09/01/2023'
delete from "bAccountTransaction" where  idtrade =ANY(Array[105,102]);
delete from "bLedgerTransactions" where idtrade =ANY(Array[105,102])