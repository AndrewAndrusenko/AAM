-- FUNCTION: public.f_f_insert_management_fees(text[], date, date)

-- DROP FUNCTION IF EXISTS public.f_f_insert_management_fees(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_f_insert_management_fees(
	p_portfolio_list text[],
	p_report_date_start date,
	p_report_date_end date)
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
	status
  )
SELECT
  id_portfolio,
  1,
  management_fee_amount,
  report_date,
  NOW(),
  feevalue,
  npv,
  id_fee,
  fee_type,
  0
FROM
  f_f_calc_management_fees (
    p_portfolio_list,
    p_report_date_start,
    p_report_date_end
  )
WHERE f_f_calc_management_fees.id_fee_transaction ISNULL;
GET DIAGNOSTICS o_inserted_qty = ROW_COUNT;
RETURN o_inserted_qty;
END
$BODY$;

ALTER FUNCTION public.f_f_insert_management_fees(text[], date, date)
    OWNER TO postgres;
