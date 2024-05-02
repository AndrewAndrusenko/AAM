-- FUNCTION  public.f_i_r_verify_restrictions(numeric[])

DROP FUNCTION IF EXISTS public.f_i_r_verify_restrictions(text[]);

CREATE OR REPLACE FUNCTION public.f_i_r_verify_restrictions_v2(
	p_idportfolios_code text[])
    RETURNS TABLE(
			id integer,
			code character varying,
			mp_name character varying,
			rest_type text,
			param text,
			restrictinon numeric,
			act_violation_and_orders numeric,
			act_violation numeric,
			mp_violation numeric,
			act_weight_and_orders numeric,act_weight numeric,mp_weight numeric,
			sum_weight numeric,
			act_mtm numeric,
			npv numeric,
			net_orders  numeric(20,2)
		) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE p_idportfolios numeric [];
BEGIN
IF p_idportfolios_code ISNULL 
THEN 
	SELECT array_agg(idportfolio) INTO p_idportfolios FROM dportfolios;
	SELECT array_agg(portfolioname) INTO p_idportfolios_code FROM dportfolios;
	ELSE
	SELECT array_agg(idportfolio) INTO p_idportfolios FROM dportfolios WHERE LOWER(portfolioname) = ANY (p_idportfolios_code);
END IF;
RETURN QUERY
WITH
  portfolio_data AS (
    SELECT
      ps.idportfolio,
      ps.portfolio_code,
      ps.secid,
      ms.group,
      ms.type AS sec_type,
      ms.listing,
      ps.mp_id,
      SUM(ps.mtm_positon) mtm_postion,
      MAX(CASE WHEN ps.npv = 0 THEN 1 ELSE ps.npv END) AS npv
    FROM
      f_i_get_portfolios_structure_detailed_data (
        (p_idportfolios_code),
        NOW()::date,
        840
      ) ps
      LEFT JOIN public.mmoexsecurities ms ON ms.secid = ps.secid
    GROUP BY
      GROUPING SETS (
        (
          ps.idportfolio,
          ps.portfolio_code,
          ps.secid,
          ms.group,
          ms.type,
          ms.listing,
          ps.mp_id
        ),
        (ps.idportfolio, ps.portfolio_code, ms.type),
        (ps.idportfolio, ps.portfolio_code, ms.group),
        (ps.idportfolio, ps.portfolio_code, ms.listing)
      )
  ),
  unnaccounted_orders AS (
    SELECT
      nor.id_portfolio AS idportfolio,
      nor.secid,
      pd.sec_type,
      pd.listing,
      pd.group,
      SUM(
        CASE
          WHEN nor.type = 'BUY' THEN nor.unaccounted_amount
          ELSE nor.unaccounted_amount * -1
        END
      ) AS net_orders
    FROM
      f_i_o_get_orders_unaccounted_qty (p_idportfolios, NULL) AS nor
      LEFT JOIN portfolio_data pd ON nor.secid = pd.secid
      AND pd.idportfolio = nor.id_portfolio
    GROUP BY
      GROUPING SETS (
        (nor.id_portfolio, pd.sec_type),
        (nor.id_portfolio, pd.group),
        (nor.id_portfolio, pd.listing),
        (nor.id_portfolio, nor.secid),
        (nor.id_portfolio)
      )
  ),
  vr AS (
    SELECT
      res.id,
      res.code,
      res.rest_type,
      res."type",
      res."listing",
      res.secid,
      res.mp_name,
      res.mp_id,
      CASE
        WHEN res.rest_type = 'cash' THEN ROUND(res.portfolio_restriction_by_mp / COALESCE(res.mp_weight,1) * 100, 4)
        ELSE res.portfolio_restriction_by_mp
      END AS portfolio_restriction_by_mp,
      res.mp_object_weight,
      res.sum_weight
    FROM
      f_i_r_get_restrictions (p_idportfolios) res
  ),
  main_set AS (
    SELECT
      vr.id,
      vr.code,
      vr.mp_name,
      vr.rest_type,
      vr."type",
      vr."listing",
      vr.secid,
      portfolio_restriction_by_mp AS restrictinon,
      CASE
        WHEN pd.mtm_postion / pd.npv * 100 < vr.portfolio_restriction_by_mp THEN 0
        ELSE ROUND(pd.mtm_postion / pd.npv * 100, 4) - vr.portfolio_restriction_by_mp
      END AS act_violation,
      CASE
        WHEN vr.mp_object_weight < vr.portfolio_restriction_by_mp THEN 0
        ELSE vr.mp_object_weight - vr.portfolio_restriction_by_mp
      END AS mp_violation,
      ROUND(pd.mtm_postion / pd.npv * 100, 4) AS act_weight,
      mp_object_weight AS mp_weight,
      vr.sum_weight,
      pd.mtm_postion AS act_mtm,
      pd.npv
    FROM
      vr
      LEFT JOIN portfolio_data pd ON (
        (vr.id = pd.idportfolio AND pd.sec_type = vr.type
          AND COALESCE(pd.secid, pd."group", pd.listing::text) ISNULL
        )
        OR (vr.id = pd.idportfolio AND pd.listing = vr.listing
          AND COALESCE(pd.secid, pd."group", pd.sec_type) ISNULL
        )
        OR (vr.id = pd.idportfolio AND LEFT(pd.secid, 5) = 'MONEY' AND vr.rest_type = 'cash')
        OR (vr.id = pd.idportfolio AND pd.secid = vr.secid)
      )
  )
SELECT
  ms.id,
  ms.code,
  ms.mp_name,
  ms.rest_type,
  COALESCE(ms."type", ms."listing"::TEXT, ms.secid) AS param,
  ms.restrictinon,
  CASE
    WHEN (COALESCE(nao.net_orders, 0) + ms.act_mtm) / ms.npv * 100 < ms.restrictinon THEN 0
    ELSE ROUND((COALESCE(nao.net_orders, 0) + ms.act_mtm) / ms.npv * 100, 4) - ms.restrictinon
  END AS act_violation_and_orders,
  ms.act_violation,
  ms.mp_violation,
  ROUND((COALESCE(nao.net_orders, 0) + ms.act_mtm) / ms.npv * 100, 4) AS act_weight_and_orders,
  ms.act_weight,
  ms.mp_weight,
  ms.sum_weight,
  ms.act_mtm,
  ms.npv,
  nao.net_orders::NUMERIC(20, 2)
FROM
  main_set ms
  LEFT JOIN unnaccounted_orders nao ON (
    (
      ms.id = nao.idportfolio AND nao.sec_type = ms.type
      AND COALESCE(nao.secid, nao."group", nao.listing::TEXT) ISNULL
    )
    OR (
      ms.id = nao.idportfolio AND ms.listing = nao.listing
      AND COALESCE(nao.secid, nao."group", nao.sec_type) ISNULL
    )
    OR (
      ms.id = nao.idportfolio AND ms.rest_type = 'cash'
      AND COALESCE(nao.secid,nao."group",nao.sec_type,nao.listing::TEXT) ISNULL
    )
    OR (ms.id = nao.idportfolio AND ms.secid = nao.secid
    )
  );
	
END; 
$BODY$;

ALTER FUNCTION public.f_i_r_verify_restrictions_v2(text[])
    OWNER TO postgres;
select * from f_i_r_verify_restrictions_v2(array['acm002'])
ORDER BY id,rest_type
