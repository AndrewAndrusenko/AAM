select  pronamespace::regnamespace::text,proname,* 
from pg_proc 
where lower(prosrc) like '%f_a_b_balances_closed_all%'
