-- FUNCTION: public.f_f_insert_management_fees(text[], date, date)

-- DROP FUNCTION IF EXISTS public.f_f_insert_performance_fees(text[], date);

CREATE OR REPLACE FUNCTION public.f_f_insert_performance_fees(
	p_portfolio_list text[],
	p_report_date date)
    RETURNS numeric
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
o_inserted_qty numeric;
BEGIN
INSERT INTO
  public.dfees_transactions (
    id_object,
    fee_object_type,
    fee_amount,
    fee_date,
    calculation_date,
    fee_rate,
    calculation_base,
    id_fee_main,
    fee_type,
	status,
	pl,
	hwm
  )
SELECT
  idportfolio,
  2,
  fee_amount,
  p_report_date,
  NOW(),
  feevalue,
  pos_pv,
  id_fee,
  fee_type,
  0,
  pl,
  new_hwm
FROM
  f_f_calc_performance_fees (
    p_portfolio_list,
    '02/01/2023',
    p_report_date
  )
WHERE f_f_calc_performance_fees.id_calc ISNULL;
GET DIAGNOSTICS o_inserted_qty = ROW_COUNT;
RETURN o_inserted_qty;
END
$BODY$;

ALTER FUNCTION public.f_f_insert_performance_fees(text[], date)
    OWNER TO postgres;
-- select * from f_f_insert_performance_fees(array['ICM011'],'09/30/2023')