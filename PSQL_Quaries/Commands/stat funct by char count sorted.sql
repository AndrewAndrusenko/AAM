select proname, length (prosrc) from pg_proc 
order by length (prosrc) desc
-- where proname= 'f_i_get_portfolios_structure_detailed_data'