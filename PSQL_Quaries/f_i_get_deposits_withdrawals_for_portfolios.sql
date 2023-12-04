-- FUNCTION: public.f_i_get_accured_interest_for_period_secidlist(text[], date, date)

-- DROP FUNCTION IF EXISTS public.f_i_get_deposits_withdrawals_for_portfolios(text[], date, date);

CREATE OR REPLACE FUNCTION public.f_i_get_deposits_withdrawals_for_portfolios(
	p_portfolios text[],
	p_period_start date,
	p_period_end date)
    RETURNS TABLE(start_date date, end_date date, d_qty interval, secid character varying, unredemeedvalue numeric, couponrate numeric, couponamount numeric, actiontype numeric, couponamountrur numeric, currency character varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT
  copr_action2_periods.date::date AS start_date,
  main_corp_actions.date::date AS end_date,
  main_corp_actions.date - copr_action2_periods.date::date AS d_qty,
  main_corp_actions.secid,
  main_corp_actions.unredemeedvalue,
  main_corp_actions.couponrate,
  main_corp_actions.couponamount,
  main_corp_actions.actiontype,
  main_corp_actions.couponamountrur,
  main_corp_actions.currency
FROM
  public.mmoexcorpactions AS main_corp_actions
  LEFT JOIN LATERAL (
    SELECT * FROM
      public.mmoexcorpactions
    WHERE
      mmoexcorpactions.secid = main_corp_actions.secid
      AND mmoexcorpactions.date < main_corp_actions.date
    ORDER BY
      mmoexcorpactions.date DESC
    LIMIT 1
  ) AS copr_action2_periods ON TRUE
WHERE
  main_corp_actions.actiontype = 1
  AND main_corp_actions.secid = ANY (p_secid_list)
  AND main_corp_actions.date > p_period_start
  AND main_corp_actions.date - INTERVAL '1 year' <= p_period_end + INTERVAL '1 year';	
END;
$BODY$;

ALTER FUNCTION public.f_i_get_deposits_withdrawals_for_portfolios(text[], date, date)
    OWNER TO postgres;
