INSERT INTO public.dfees_transactions(
	id_object, fee_object_type, fee_amount, fee_date, calculation_date, fee_rate, calculation_base,id_fee_main)
	
	select
	id_portfolio, 1, management_fee_amount, report_date, now(), feevalue, npv,id_fee	
	from f_f_calc_management_fees (array(select portfolioname from dportfolios),(now() - '1 months'::interval)::date,now()::date)
	;
	    