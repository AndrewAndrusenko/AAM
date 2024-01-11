-- FUNCTION: public.f_f_get_performance_fees_schedules(text[], date, date)

DROP FUNCTION IF EXISTS public.f_f_get_performance_fees_schedules(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_f_get_performance_fees_schedules(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date)
    RETURNS TABLE(object_id bigint, portfolioname character varying, id_fee integer, fee_code character varying, fee_type numeric, calc_start date, calc_end date, period_start date, period_end date, fee_type_value smallint, feevalue numeric, 
				  calculation_period numeric, schedule_range numrange, range_parameter character varying, below_ranges_calc_type smallint, hwm numeric ,hwm_date date) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  dfees_objects.object_id,
  dportfolios.portfolioname,
  dfees_main.id as id_fee,
  dfees_main.fee_code,
  dfees_main.fee_type,
  CASE
    WHEN dfees_objects.period_start < p_report_date_start THEN p_report_date_start
    ELSE dfees_objects.period_start
  END AS calc_start,
  CASE
    WHEN dfees_objects.period_end > p_report_date_end THEN p_report_date_end
    ELSE dfees_objects.period_end
  END AS calc_end,
  dfees_objects.period_start,
  dfees_objects.period_end,
  dfees_schedules.fee_type_value,
  dfees_schedules.feevalue,
  dfees_schedules.calculation_period,
  dfees_schedules.schedule_range,
  dfees_schedules.range_parameter,
  dfees_schedules.below_ranges_calc_type,
  hwm_data.hwm,
  hwm_data.hwm_date
FROM
  dfees_objects
  LEFT JOIN dfees_main ON dfees_objects.id_fee_main = dfees_main.id
  LEFT JOIN dfees_schedules ON dfees_schedules.id_fee_main = dfees_main.id
  LEFT JOIN dportfolios ON dfees_objects.object_id = dportfolios.idportfolio
  LEFT JOIN LATERAL (
  SELECT dfees_performance_fees_high_watermarks.hwm,dfees_performance_fees_high_watermarks.hwm_date FROM dfees_performance_fees_high_watermarks
	WHERE 
	dfees_performance_fees_high_watermarks.hwm_date<p_report_date_start AND
	dfees_performance_fees_high_watermarks.id_portfolio=dfees_objects.object_id
	ORDER BY dfees_performance_fees_high_watermarks.hwm_date DESC 
	LIMIT 1
	) AS hwm_data ON TRUE
WHERE
  dfees_objects.fee_object_type = 1
  AND dfees_main.fee_type = 2
  AND dportfolios.portfolioname = ANY (p_portfolio_list)
  AND dfees_objects.period_end > p_report_date_start
  AND dfees_objects.period_start < p_report_date_end;
END
$BODY$;

ALTER FUNCTION public.f_f_get_performance_fees_schedules(text[], date, date)
    OWNER TO postgres;
