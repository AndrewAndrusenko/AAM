-- FUNCTION: public.f_f_calc_management_fees(text[], date, date)

DROP FUNCTION IF EXISTS public.f_f_calc_management_fees(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_f_calc_management_fees(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date)
    RETURNS TABLE(report_date date, id_portfolio bigint, portfolioname character varying, management_fee_amount numeric, npv numeric, fee_code character varying, calculation_start date, calculation_end date, period_start date, period_end date, schedule_range numrange, feevalue numeric, fee_type_value smallint, id_fee integer, 
				  fee_type numeric,id_fee_transaction numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH dfees_transactions AS (
    SELECT
      dfees_transactions.id,
	  dportfolios.portfolioname,
	  dfees_transactions.fee_date
    FROM
      public.dfees_transactions
	LEFT JOIN dportfolios ON dportfolios.idportfolio = dfees_transactions.id_object
    WHERE
      dportfolios.portfolioname = ANY(p_portfolio_list)
      AND dfees_transactions.fee_date >= p_report_date_start
      AND dfees_transactions.fee_date <= p_report_date_end
)
SELECT
  f_i_get_npv_dynamic.report_date,
  mfees_set.object_id as id_portfolio,
  f_i_get_npv_dynamic.portfolioname,
  ROUND(f_i_get_npv_dynamic.pos_pv * mfees_set.feevalue / 100 / 365, 2) AS management_fee_amount,
  f_i_get_npv_dynamic.pos_pv AS npv,
  mfees_set.fee_code,
  mfees_set.calc_start AS calculation_start,
  mfees_set.calc_end AS calculation_end,
  mfees_set.period_start,
  mfees_set.period_end,
  mfees_set.schedule_range,
  mfees_set.feevalue,
  mfees_set.fee_type_value,
  mfees_set.id_fee,
  mfees_set.fee_type,
  dfees_joined_set.id AS id_fee_transaction
FROM
  f_i_get_npv_dynamic (
	p_portfolio_list,
    p_report_date_start,
    p_report_date_end,
    840
  )
  LEFT JOIN LATERAL (
    SELECT
      *
    FROM
      f_f_get_management_fees_schedules (
		p_portfolio_list,
		p_report_date_start,
		p_report_date_end
      ) 
    WHERE
      f_f_get_management_fees_schedules.portfolioname = f_i_get_npv_dynamic.portfolioname
      AND f_i_get_npv_dynamic.report_date >= f_f_get_management_fees_schedules.calc_start
      AND f_i_get_npv_dynamic.report_date <= f_f_get_management_fees_schedules.calc_end
      AND f_f_get_management_fees_schedules.schedule_range @> pos_pv
  ) AS mfees_set ON TRUE
  LEFT JOIN LATERAL (
	SELECT * FROM dfees_transactions
	  WHERE dfees_transactions.portfolioname = f_i_get_npv_dynamic.portfolioname
	  AND dfees_transactions.fee_date =  f_i_get_npv_dynamic.report_date
  ) AS dfees_joined_set ON TRUE
WHERE
  "accountNo" ISNULL
  AND f_i_get_npv_dynamic.pos_pv>0 ;
END
$BODY$;

ALTER FUNCTION public.f_f_calc_management_fees(text[], date, date)
    OWNER TO postgres;
