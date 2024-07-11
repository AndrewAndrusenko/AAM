-- FUNCTION: public.f_i_get_accured_interests_for_portfolios(text[], date)

-- DROP FUNCTION IF EXISTS public.f_i_get_accured_interests_for_portfolios(text[], date);

CREATE OR REPLACE FUNCTION public.f_i_get_accured_interests_for_portfolios(
	p_secid_list text[],
	p_report_date date)
    RETURNS TABLE(secid text, shortname text, coupon_calc numeric, couponrate numeric, couponamount numeric, unredemeedvalue numeric, facevalue numeric, faceunit character varying, interest_period_start date, days_qty interval, security_group_name text, price_type numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH instruments_list as (
	SELECT
	  mmoexsecurities.secid,
	  mmoexsecurities.shortname,
	  mmoexsecurities.facevalue,
	  mmoexsecurities.faceunit,
	  mmoexsecuritytypes.security_group_name, 
	  mmoexsecuritytypes.price_type
	FROM
	  mmoexsecurities
	  LEFT JOIN mmoexsecuritytypes ON mmoexsecurities."type"=mmoexsecuritytypes.security_type_name
    WHERE  mmoexsecurities.secid = ANY (p_secid_list)
),
  coupons_info AS (
    SELECT
      mmoexcorpactions.secid,
      MIN(date) FILTER (WHERE date >= p_report_date)::date interest_period_end,
      MAX(date) FILTER (WHERE date <= p_report_date)::date interest_period_start,
      (p_report_date::date - MAX(date) FILTER (WHERE date < p_report_date)) AS days_qty
    FROM
      public.mmoexcorpactions
    GROUP BY
      mmoexcorpactions.secid
    HAVING
      mmoexcorpactions.secid = ANY (p_secid_list)
  )
SELECT
  instruments_list.secid,
  instruments_list.shortname,
  ROUND((instruments_list.facevalue * mmoexcorpactions.couponrate / 100 * 
   (EXTRACT(days FROM coupons_info.days_qty)) / 365)
  ::NUMERIC,4 ) AS coupon_calc,
  mmoexcorpactions.couponrate,
  mmoexcorpactions.couponamount,
  mmoexcorpactions.unredemeedvalue,
  instruments_list.facevalue,
  instruments_list.faceunit,
  coupons_info.interest_period_start,
  coupons_info.days_qty,
  instruments_list.security_group_name, 
  instruments_list.price_type
FROM
  instruments_list
    LEFT JOIN coupons_info ON coupons_info.secid = instruments_list.secid
	LEFT JOIN mmoexcorpactions ON (
    coupons_info.secid = mmoexcorpactions.secid
    AND coupons_info.interest_period_end = mmoexcorpactions.date
    AND actiontype = 1
  );

END;
$BODY$;

ALTER FUNCTION public.f_i_get_accured_interests_for_portfolios(text[], date)
    OWNER TO postgres;
select * from f_i_get_accured_interests_for_portfolios(array['XS0993162683'],'11/24/2023')