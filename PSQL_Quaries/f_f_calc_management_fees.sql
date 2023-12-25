-- FUNCTION: public.f_i_get_market_quote_for_trade(text, date)

DROP FUNCTION IF EXISTS public.f_f_calc_management_fees(text[],date, date);

CREATE OR REPLACE FUNCTION public.f_f_calc_management_fees(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date
    )
    RETURNS TABLE(
		report_date date,
		id_portfolio bigint,
		portfolioname char varying,
		management_fee_amount numeric,
		npv numeric,
		fee_code char varying,
		calculation_start date,
		calculation_end date,
		period_start date,
		period_end date,
		schedule_range numrange,
		feevalue numeric,
		fee_type_value smallint
	)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
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
  mfees_set.fee_type_value
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
WHERE
  "accountNo" ISNULL;
END
$BODY$;

ALTER FUNCTION public.f_f_calc_management_fees(text[],date, date)
    OWNER TO postgres;
select * from f_f_calc_management_fees (array(select portfolioname from dportfolios),(now() - '1 months'::interval)::date,now()::date)