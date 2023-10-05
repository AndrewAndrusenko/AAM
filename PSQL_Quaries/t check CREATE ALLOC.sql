with lasttrade as   ( 
	SELECT  dtrades.tdate, id
    FROM public.dtrades_allocated
	left join dtrades ON dtrades.idtrade = dtrades_allocated.idtrade
    WHERE tdate::date<'2023/09/20'::date and dtrades_allocated.idportfolio=2
	order by tdate desc,id desc
	limit 1
)
select id,exists (select 1,idtrade from dtrades_allocated_fifo where idtrade=(select id from lasttrade )) from lasttrade
-- raise notice 'id %',1


--       dtrades_allocated_fifo.idportfolio = p_idportfolio
--       AND dtrades_allocated_fifo.secid = p_secid
--       AND dtrades_allocated_fifo.tr_type = p_tr_type_to_close
--     ORDER BY
--       dtrades_allocated_fifo.idtrade,
--       out_date DESC,
--       qty ASC,
--       qty_out DESC
