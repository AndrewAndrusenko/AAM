-- FUNCTION: public.f_i_r_verify_restrictions_v2(text[])

DROP FUNCTION IF EXISTS f_i_r_verify_allocation_vs_restrictions(numeric[], numeric, char varying, int);

CREATE OR REPLACE FUNCTION public.f_i_r_verify_allocation_vs_restrictions(
	p_idportfolio	numeric[],
	p_allocation_amount numeric,
	p_alloc_secid char varying,
	p_verification_type int)
    RETURNS TABLE(
			new_wgt numeric, new_viol numeric, new_mtm numeric,
			id integer, code character varying, mp_name character varying, rest_type text, param text, restrictinon numeric, act_violation_and_orders numeric, act_violation numeric, mp_violation numeric, act_weight_and_orders numeric, act_weight numeric, mp_weight numeric, sum_weight numeric, act_mtm numeric, npv numeric, net_orders numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE p_portfolios_code text[];
BEGIN
SELECT array_agg(LOWER(portfolioname)) INTO p_portfolios_code FROM dportfolios WHERE idportfolio=ANY(p_idportfolio);
RETURN QUERY
WITH
  draft_set AS (
    SELECT
      CASE
        WHEN vr.rest_type = 'cash' THEN vr.act_mtm - p_allocation_amount
        ELSE vr.act_mtm + p_allocation_amount
      END AS new_mtm,
      vr.*
    FROM
      f_i_r_verify_restrictions_v2 (p_portfolios_code) vr
      LEFT JOIN (
        SELECT
          secid,
          "group",
          "type",
          "listing"
        FROM
          mmoexsecurities
        WHERE
          secid = p_alloc_secid
      ) st ON (
        vr.param = ANY (
          ARRAY[st.group, st.type, st.listing::TEXT, st.secid]
        )
        OR vr.rest_type = 'cash'
      )
    WHERE
      st.secid NOTNULL
  )
SELECT
  ROUND(ds.new_mtm / ds.npv * 100, 4) AS new_wgt,
  ROUND(
    CASE
      WHEN ds.rest_type = 'cash' THEN ds.new_mtm / ds.npv * 100 * -1 - ds.restrictinon
      ELSE ds.new_mtm / ds.npv * 100 - ds.restrictinon
    END,
    4
  ) AS new_viol,
  ds.*
FROM
  draft_set ds
WHERE
  CASE
    WHEN ds.rest_type = 'cash' THEN ds.new_mtm / ds.npv * 100 * -1 - ds.restrictinon
    ELSE ds.new_mtm / ds.npv * 100 - ds.restrictinon
  END > 0;
	
END; 
$BODY$;

ALTER FUNCTION public.f_i_r_verify_allocation_vs_restrictions(numeric[], numeric, char varying, int)
    OWNER TO postgres;
SELECT * FROM f_i_r_verify_allocation_vs_restrictions
(array[29],5620,'LLY-RM',0);
