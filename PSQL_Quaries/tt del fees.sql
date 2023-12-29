select * from "bAccountTransaction"
where "dataTime" > '12/27/2023';
delete from "bAccountTransaction"
where "dataTime" > '12/27/2023';

select * from "bLedgerTransactions"
where "dateTime" > '12/27/2023';
delete from "bLedgerTransactions"
where "dateTime" > '12/27/2023'