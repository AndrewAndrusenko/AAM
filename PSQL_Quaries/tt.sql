SELECT idportfolio, idclient, idstategy, portfolioname, portleverage
	FROM public.dportfolios;
	 SELECT * FROM public.f_i_get_npv_dynamic_with_perfomance_twroi (
		 array(SELECT portfolioname FROM public.dportfolios ),'11/5/2023', '12/5/2023', '978'
																	) ORDER BY portfolioname, report_date DESC;