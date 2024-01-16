-- FUNCTION: public.f_f_calc_management_fees(text[], date, date)

DROP FUNCTION IF EXISTS public.f_f_calc_performance_fees(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_f_calc_performance_fees(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date)
    RETURNS TABLE(
		start_npv numeric,
		id_calc numeric,
		idportfolio bigint,
		portfolioname character varying,
		pos_pv numeric,
		cash_flow numeric,
		fee_amount numeric,
		pl numeric,
		pl_above_hwm numeric,
		feevalue numeric,
		hwm numeric,
	    id_fee int,
        fee_type numeric, new_hwm numeric, hwm_date date,pf_hurdle numeric )
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
  fees_dataset AS (
    SELECT
	  fees_schedules.object_id as idportfolio,
	  end_npv.accountid,
      COALESCE(cash_moves.cash_flow, 0) AS cash_flow,
      end_npv.portfolioname,
      end_npv.pos_pv,
      (end_npv.pos_pv - cash_moves.cash_flow) AS pl,
      end_npv.pos_pv - COALESCE(cash_moves.cash_flow, 0) - COALESCE(fees_schedules.hwm, 0) AS pl_above_hwm,
      fees_schedules.feevalue,
      COALESCE(fees_schedules.hwm, 0) AS hwm,
	  fees_schedules.hwm_date,
	  fees_schedules.id_fee,
	  fees_schedules.fee_type,
	  fees_schedules.id_calc,
	  fees_schedules.pf_hurdle,
	  fees_schedules.highwatermark
    FROM
      public.f_i_get_npv_dynamic (p_portfolio_list, p_report_date_end, p_report_date_end, 840) AS end_npv
      LEFT JOIN LATERAL (
        SELECT
          f_i_get_deposits_withdrawals_per_portfolios_on_date.cash_flow
        FROM
          f_i_get_deposits_withdrawals_per_portfolios_on_date (p_portfolio_list, p_report_date_end)
        WHERE
          "accountNo" ISNULL
          AND f_i_get_deposits_withdrawals_per_portfolios_on_date.portfolioname = end_npv.portfolioname
      ) AS cash_moves ON TRUE
      LEFT JOIN LATERAL (
        SELECT
	      f_f_get_performance_fees_schedules.pf_hurdle,
		  f_f_get_performance_fees_schedules.highwatermark,
		  f_f_get_performance_fees_schedules.id_fee,
		  f_f_get_performance_fees_schedules.fee_type,
		  object_id,
          f_f_get_performance_fees_schedules.feevalue,
          f_f_get_performance_fees_schedules.hwm,
          f_f_get_performance_fees_schedules.hwm_date,
          calc_start,
          calc_end,
		  f_f_get_performance_fees_schedules.id_calc
		  
        FROM
          public.f_f_get_performance_fees_schedules (p_portfolio_list, p_report_date_start, p_report_date_end)
        WHERE
          f_f_get_performance_fees_schedules.portfolioname = end_npv.portfolioname
      ) AS fees_schedules ON TRUE
    WHERE
      end_npv."accountNo" ISNULL
  ),
  start_period_npv AS (
	  SELECT  
		  f_i_get_npv_dynamic.accountid,
		  f_i_get_npv_dynamic.portfolioname,
		  f_i_get_npv_dynamic.pos_pv
      FROM 
		  public.f_i_get_npv_dynamic (
			  ARRAY(SELECT fees_dataset.portfolioname FROM fees_dataset WHERE fees_dataset.pf_hurdle>0)
			  , p_report_date_start, p_report_date_start, 840) 
	  WHERE 
		  f_i_get_npv_dynamic."accountNo" ISNULL	  
  )
SELECT
  start_period_npv.pos_pv AS start_npv,
  CASE
    WHEN fees_dataset.hwm_date::date >= p_report_date_end THEN fees_dataset.id_calc
    ELSE null
  END AS id_calc,	
  fees_dataset.idportfolio,
  fees_dataset.portfolioname,
  ROUND(fees_dataset.pos_pv,2) as pos_pv,
  fees_dataset.cash_flow,
  CASE
    WHEN fees_dataset.pl_above_hwm > 0  AND fees_dataset.highwatermark = true THEN ROUND(
      fees_dataset.pl_above_hwm * fees_dataset.feevalue / 100,
      2
    )
	WHEN fees_dataset.pl > 0  AND fees_dataset.highwatermark = false  AND (fees_dataset.pf_hurdle = 0 OR fees_dataset.pf_hurdle ISNULL) 
		THEN ROUND(fees_dataset.pl * fees_dataset.feevalue / 100, 2 )
	WHEN (fees_dataset.pf_hurdle > 0 ) AND (fees_dataset.pos_pv/ start_period_npv.pos_pv-fees_dataset.pf_hurdle>0) THEN ROUND(
      (fees_dataset.pos_pv/ start_period_npv.pos_pv-1-fees_dataset.pf_hurdle/100) * start_period_npv.pos_pv * fees_dataset.feevalue / 100,
      2
    )
    ELSE 0
  END AS fee_amount,
  ROUND(fees_dataset.pl,2) as pl,
  ROUND(fees_dataset.pl_above_hwm,2) as pl_above_hwm,
  
  fees_dataset.feevalue,
  fees_dataset.hwm,
  fees_dataset.id_fee,
  fees_dataset.fee_type ,
  GREATEST(fees_dataset.hwm, ROUND(fees_dataset.pl,2)) as new_hwm,
  fees_dataset.hwm_date,
  fees_dataset.pf_hurdle
FROM
  fees_dataset
LEFt JOIN start_period_npv ON fees_dataset.portfolioname=start_period_npv.portfolioname;
END
$BODY$;

ALTER FUNCTION public.f_f_calc_performance_fees(text[], date, date)
    OWNER TO postgres;
select * from f_f_calc_performance_fees(
array['ACM002','VPC004'],'12/01/2023','12/30/2023')