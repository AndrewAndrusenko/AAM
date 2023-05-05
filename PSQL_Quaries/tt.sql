
INSERT into mmoexsecuritygroups
select * from json_populate_recordset(null::mmoexsecuritygroups, (
select REPLACE($$'
			   [
{"id": 12, "name": "stock_index", "title": "Indices", "is_hidden": 0},
{"id": 4, "name": "stock_shares", "title": "Stocks", "is_hidden": 0},
{"id": 3, "name": "stock_bonds", "title": "Bonds", "is_hidden": 0},
{"id": 9, "name": "currency_selt", "title": "Currency", "is_hidden": 0},
{"id": 10, "name": "futures_forts", "title": "Futures", "is_hidden": 0},
{"id": 26, "name": "futures_options", "title": "Options", "is_hidden": 0},
{"id": 18, "name": "stock_dr", "title": "Depositary receipts", "is_hidden": 0},
{"id": 33, "name": "stock_foreign_shares", "title": "Foreign issuers shares", "is_hidden": 0},
{"id": 6, "name": "stock_eurobond", "title": "Eurobonds", "is_hidden": 0},
{"id": 5, "name": "stock_ppif", "title": "Investment shares", "is_hidden": 0},
{"id": 20, "name": "stock_etf", "title": "Exchange traded funds", "is_hidden": 0},
{"id": 24, "name": "currency_metal", "title": "Precious metal", "is_hidden": 0},
{"id": 21, "name": "stock_qnv", "title": "Qualified investors", "is_hidden": 0},
{"id": 27, "name": "stock_gcc", "title": "General collateral certificates", "is_hidden": 0},
{"id": 29, "name": "stock_deposit", "title": "Deposit CCP", "is_hidden": 0},
{"id": 28, "name": "currency_futures", "title": "Currency futures", "is_hidden": 0},
{"id": 31, "name": "currency_indices", "title": "Currency fixings", "is_hidden": 0},
{"id": 22, "name": "stock_mortgage", "title": "Mortgage note", "is_hidden": 1}			   
			   
			   ]
			   
'$$,$$'$$, '')::json))