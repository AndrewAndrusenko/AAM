WITH 
deleted_accounted_trans AS (
	delete from "bAccountTransaction"
	where id = ANY(array[ 13545, 1164, 1165 ]) and "dataTime">'09/22/2023' RETURNING id
),
deleted_ledger_trans AS (
delete from "bLedgerTransactions"
where id = ANY(array[ 13545, 1164, 1165 ]) and "dateTime">'09/22/2023' RETURNING id
)
SELECT * FROM deleted_accounted_trans
UNION
SELECT * FROM deleted_ledger_trans