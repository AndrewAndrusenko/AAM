-- FUNCTION: public.f_i_get_portfolios_structure_detailed_data(bigint[], date, integer)

-- DROP FUNCTION IF EXISTS public.f_i_get_all_portfolios_structure_detailed_data(bigint[], date, integer);

	CREATE OR REPLACE FUNCTION public.f_i_get_all_portfolios_structure_detailed_data(
	p_report_date date,
	p_report_currency integer)
    RETURNS TABLE(idportfolio integer, portfolio_code character varying, secid character varying, strategy_name character varying, mp_name character varying, fact_weight numeric, current_balance numeric, mtm_positon numeric, weight numeric, planned_position numeric, order_amount numeric, order_type text, order_qty numeric, mtm_rate numeric, mtm_date date, mtm_dirty_price numeric, cross_rate numeric, npv numeric, rate_date date, main_currency_code numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
	p_idportfolios bigint[];
BEGIN
RETURN QUERY
select * from f_i_get_portfolios_structure_detailed_data (p_idportfolios,p_report_date,p_report_currency);
END;
$BODY$;

ALTER FUNCTION public.f_i_get_all_portfolios_structure_detailed_data(date, integer)
    OWNER TO postgres;
