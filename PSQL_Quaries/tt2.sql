with 

portfolio_data as (
	select
		ps.idportfolio,
		ps.portfolio_code,
		ps.secid,
		ms.group,
	  ms.type AS sec_type,
		ms.listing,
		ps.mp_id,
		sum(ps.mtm_positon) mtm_postion,
		max(ps.npv)  as npv
	FROM f_i_get_portfolios_structure_detailed_data (array['vpc005','acm002'], now()::date, 840) ps
	LEFT JOIN public.mmoexsecurities ms ON ms.secid = ps.secid
	group by
	grouping sets (
		(ps.idportfolio,ps.portfolio_code,ps.secid,	ms.group, ms.type, ms.listing,ps.mp_id),
		(ps.idportfolio,ps.portfolio_code, ms.type),
		(ps.idportfolio,ps.portfolio_code,	ms.group),
		(ps.idportfolio,ps.portfolio_code, ms.listing)
	)
), vr as (
select 
vr.id,
vr.code,
vr.rest_type,
vr."type",vr."listing",vr.secid,
vr.mp_name,
vr.mp_id,
CASE 
	WHEN vr.rest_type='cash' THEN ROUND(vr.portfolio_restriction_by_mp/vr.mp_weight*100,4) ELSE vr.portfolio_restriction_by_mp
END AS portfolio_restriction_by_mp,
vr.mp_object_weight,
vr.sum_weight

from f_i_r_verify_restrictions(array[29,11]) vr
), 
unnaccounted_orders AS (
select 
nor.id_portfolio as idportfolio,nor.secid,
pd.sec_type,pd.listing,pd.group,
SUM(CASE WHEN nor.type = 'BUY' THEN nor.unaccounted_amount ELSE nor.unaccounted_amount*-1 END) AS net_orders
FROM f_i_o_get_orders_unaccounted_qty(ARRAY[11,29],null) as nor
left join portfolio_data pd on nor.secid = pd.secid and pd.idportfolio=nor.id_portfolio
	GROUP BY
	GROUPING SETS
	(
		(nor.id_portfolio,pd.sec_type),
		(nor.id_portfolio,pd.group),
		(nor.id_portfolio,pd.listing),
		(nor.id_portfolio,nor.secid),
		(nor.id_portfolio)
	)
),
main_set as (	
	select
	id,
	code,
	mp_name,
	rest_type,
	vr."type",vr."listing",vr.secid,
	
	portfolio_restriction_by_mp as restrictinon,
	CASE 
		WHEN pd.mtm_postion/pd.npv*100<vr.portfolio_restriction_by_mp THEN 0 ELSE ROUND(pd.mtm_postion/pd.npv*100,4)-vr.portfolio_restriction_by_mp
	END AS act_violation,
	CASE 
		WHEN vr.mp_object_weight<vr.portfolio_restriction_by_mp THEN 0 ELSE vr.mp_object_weight-vr.portfolio_restriction_by_mp
	END AS mp_violation,
	ROUND(pd.mtm_postion/pd.npv*100,4) as act_weight,
	mp_object_weight as mp_weight,
	sum_weight,
	pd.mtm_postion as act_mtm ,
	pd.npv

	from  vr

	left join portfolio_data pd on 
		(
		(vr.id=pd.idportfolio and pd.sec_type=vr.type AND COALESCE (pd.secid,pd."group") ISNULL	AND pd.listing ISNULL) 
		OR 	
		(vr.id=pd.idportfolio and pd.listing=vr.listing AND COALESCE (pd.secid,pd."group",pd.sec_type) ISNULL)
		OR
		(vr.id=pd.idportfolio and LEFT(pd.secid,5)='MONEY' and vr.rest_type='cash') 
		OR
		(vr.id=pd.idportfolio and pd.secid=vr.secid) 
	)
)

select 
	ms.id,
	ms.code,
	ms.mp_name,
	ms.rest_type,
  COALESCE(ms."type",ms."listing"::text,ms.secid) AS param,
	
	ms.restrictinon,
		CASE 
		WHEN (nao.net_orders+act_mtm)/npv*100<ms.restrictinon THEN 0 ELSE ROUND((nao.net_orders+act_mtm)/npv*100,4)-ms.restrictinon
	END AS act_violation_and_orders,
ms.act_violation,
ms.mp_violation,
ROUND((nao.net_orders+act_mtm)/npv*100,4) as act_weight_and_orders,
	ms.act_weight,
	ms.mp_weight,
	sum_weight,
	ms.act_mtm ,
	ms.npv,
nao.net_orders::numeric(20,2)

from main_set ms
LEFT JOIN unnaccounted_orders nao ON
		(
		(ms.id = nao.idportfolio and nao.sec_type=ms.type AND COALESCE (nao.secid,nao."group",nao.listing::text) ISNULL) 
		OR 	
		(ms.id = nao.idportfolio and ms.listing=nao.listing AND COALESCE (nao.secid,nao."group",nao.sec_type) ISNULL)
		OR
		(ms.id = nao.idportfolio and ms.rest_type='cash' AND COALESCE (nao.secid,nao."group",nao.sec_type,nao.listing::text) ISNULL) 
		OR
		(ms.id = nao.idportfolio and ms.secid=nao.secid) 
	)
