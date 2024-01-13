-- FUNCTION: public.f_f_calc_management_fees(text[], date, date)

DROP FUNCTION IF EXISTS public.f_f_calc_performance_fees(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_f_calc_performance_fees(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date)
    RETURNS TABLE(
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
        fee_type numeric, new_hwm numeric )
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
	  fees_schedules.id_calc
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
		  f_f_get_performance_fees_schedules.id_fee,
		  f_f_get_performance_fees_schedules.fee_type,
		  object_id,
          f_f_get_performance_fees_schedules.feevalue,
          f_f_get_performance_fees_schedules.hwm,
          hwm_date,
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
  )
SELECT
  CASE
    WHEN fees_dataset.hwm_date >= p_report_date_end THEN fees_dataset.id_calc
    ELSE null
  END AS id_calc,	
  fees_dataset.idportfolio,
  fees_dataset.portfolioname,
  ROUND(fees_dataset.pos_pv,2) as pos_pv,
  fees_dataset.cash_flow,
  CASE
    WHEN fees_dataset.pl_above_hwm > 0 THEN ROUND(
      fees_dataset.pl_above_hwm * fees_dataset.feevalue / 100,
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
  GREATEST(fees_dataset.hwm, ROUND(fees_dataset.pl,2)) as new_hwm
FROM
  fees_dataset;
END
$BODY$;

ALTER FUNCTION public.f_f_calc_performance_fees(text[], date, date)
    OWNER TO postgres;
select * from f_f_calc_performance_fees(
array(select portfolioname from dportfolios ),'03/01/2023','09/30/2023')