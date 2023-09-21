-- DELETE FROM public.dtrades_allocated_fifo
-- 	WHERE secid='GOOG-RM' and tr_type=1
update dtrades_allocated_fifo set qty_out=0 
