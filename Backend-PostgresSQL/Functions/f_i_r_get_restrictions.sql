-- FUNCTION: public.f_i_r_get_restrictions(numeric[])

DROP FUNCTION IF EXISTS public.f_i_r_get_restrictions(numeric[]);

CREATE OR REPLACE FUNCTION public.f_i_r_get_restrictions(
	p_idportfolios numeric[])
    RETURNS TABLE(
			rest_type text,
			id int,code char varying, "type" text,listing numeric,secid char varying, portfolio_restriction_by_mp numeric,sum_weight numeric,mp_id int,mp_name character varying,
			mp_object_weight numeric,restriction_rate numeric,mp_weight numeric) 
    LANGUAGE 'plpgsql' 
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH 
main_set AS(
	SELECT
	COALESCE(rs.param,'rest') as param,
	rs.value,
  dportfolios.portfolioname,
  modelportfolios.sname,
	dstrategies_global_structure.weight_of_child as mp_weight,
	ms.type,
	ms.listing,
  modelportfolios.id AS mp_id,
  dportfolios.idportfolio,
	mp_structure.weight_of_child as secid_weight
	FROM dportfolios AS dportfolios
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = dportfolios.idstategy
  LEFT JOIN dstrategies_global_structure ON dstrategies_global_structure.id_strategy_parent = dstrategiesglobal.id
  LEFT JOIN dstrategiesglobal modelportfolios ON dstrategies_global_structure.id_strategy_child_integer = modelportfolios.id
  LEFT JOIN dstrategies_global_structure mp_structure ON mp_structure.id_strategy_parent = modelportfolios.id
	LEFT JOIN public.d_i_restrictions rs ON rs.restriction_type_id=5 AND rs.idportfolio = dportfolios.idportfolio AND mp_structure.id_strategy_child=rs.param
	LEFT JOIN public.mmoexsecurities ms ON ms.secid = mp_structure.id_strategy_child
  WHERE dportfolios.idportfolio = ANY(p_idportfolios)),	
mp_data AS (
	SELECT
		SUM(main_set.secid_weight) AS sum_weight,
		(SUM(main_set.secid_weight)*MAX(main_set.mp_weight)/100)::numeric(10,2) AS mp_object_weight,
		main_set.param, main_set.value, main_set.portfolioname, main_set.sname, main_set.mp_weight, main_set.type, main_set.listing,
		main_set.mp_id,main_set.idportfolio
	FROM main_set
	GROUP BY
	GROUPING SETS
		(
		(portfolioname, sname, idportfolio, main_set.mp_id, main_set.value, param,main_set.mp_weight),
		(portfolioname, sname, idportfolio, main_set.mp_id,main_set.mp_weight,main_set.type),
		(portfolioname, sname, idportfolio, main_set.mp_id,main_set.mp_weight,main_set.listing),
		(portfolioname, sname, idportfolio, main_set.mp_id,main_set.mp_weight)		
		)
)
SELECT 
CASE 
	WHEN mp_data."type"  NOTNULL THEN 'sec_type'
	WHEN mp_data.listing  NOTNULL THEN 'listing'
	WHEN mp_data.param  NOTNULL THEN 'secid'
	ELSE 'cash'
end  as rest_type,
mp_data.idportfolio,
mp_data.portfolioname,
mp_data."type",
mp_data.listing,
mp_data.param as secid, 
-- COALESCE(mp_data."type",'Cash') as type,
-- COALESCE(mp_data."group",'Cash') as group,
CASE 
	WHEN restrictions.object_owner='Cash' THEN ROUND(restrictions.value*mp_data.mp_weight/100,4) 
	ELSE ROUND(restrictions.value*(mp_data.mp_weight/100),4)
END AS portfolio_restriction_by_mp,
mp_data.sum_weight,
mp_data.mp_id,
mp_data.sname,
CASE 
	WHEN restrictions.object_owner='Cash' THEN (100 - ROUND(mp_data.mp_object_weight/(mp_data.mp_weight/100),4))*-1
	ELSE mp_data.mp_object_weight
END AS mp_object_weight,
restrictions.value as restriction_rate,
mp_data.mp_weight
FROM mp_data
  LEFT JOIN LATERAL (
		SELECT ro.object_id, ro.object_group, ro.object_owner, value FROM public.d_i_restrictions
		LEFT JOIN public.d_i_restrictions_objects AS ro ON d_i_restrictions.restriction_type_id=ro.id
		LEFT JOIN public.mmoexsecuritytypes mst ON ro.object_id=mst.id
		WHERE mp_data.idportfolio = d_i_restrictions.idportfolio and 
			CASE 
				WHEN mp_data."type"  NOTNULL THEN mst.security_type_name=mp_data.type
				WHEN mp_data.listing  NOTNULL THEN (ro.object_code = 'listing' AND d_i_restrictions.param::numeric=mp_data.listing)
				WHEN mp_data.param  NOTNULL THEN (ro.object_code = 'secid' AND d_i_restrictions.param=mp_data.param)
				ELSE ro.object_code = 'Leverage'
			end 
			
  ) AS restrictions ON TRUE
WHERE restrictions.value NOTNULL

ORDER BY idportfolio,rest_type;
END; 
$BODY$;

ALTER FUNCTION public.f_i_r_get_restrictions(numeric[]) OWNER TO postgres;
select * from f_i_r_get_restrictions(array[7])
-- where restriction_rate notnull