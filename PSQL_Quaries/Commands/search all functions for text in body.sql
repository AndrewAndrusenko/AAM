select  pronamespace::regnamespace::text,proname,* 
from pg_proc 
where lower(prosrc) like '%f_i_o_get_orders_unaccounted_qty%'
