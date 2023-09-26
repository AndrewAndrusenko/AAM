select proname, prosrc from pg_proc where lower(prosrc) like '%f_ledger_balance_closure_select_data%';
