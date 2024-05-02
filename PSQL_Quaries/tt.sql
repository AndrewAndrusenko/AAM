with 
portfolio_data as (
	select
		ps.idportfolio,
		ps.portfolio_code,
		ps.secid,
		ms.group,
	  ms.type AS sec_type,
		ms.listing,
		sum(ps.mtm_positon) mtm_postion,
		max(ps.npv)  as npv
	FROM f_i_get_portfolios_structure_detailed_data (array['vpc005'], now()::date, 840) ps
	LEFT JOIN public.mmoexsecurities ms ON ms.secid = ps.secid
	group by
	grouping sets (
		(ps.idportfolio,ps.portfolio_code,ps.secid,	ms.group, ms.type, ms.listing),
		(ps.idportfolio,ps.portfolio_code, ms.type),
		(ps.idportfolio,ps.portfolio_code,	ms.group),
		(ps.idportfolio,ps.portfolio_code, ms.listing)
	)
)
	
select 
pd_secid.mtm_postion as mtm_secid,
pd.mtm_postion as mtm_sec_type ,
pd_listing.mtm_postion as mtm_listing,
pd_cash.mtm_postion as mtm_cash,
vr.* 
from f_i_r_verify_restrictions(array[29]) vr
left join portfolio_data pd_secid on (vr.id=pd_secid.idportfolio and pd_secid.secid=vr.secid) 
left join portfolio_data pd_cash on (vr.id=pd_cash.idportfolio and LEFT(pd_cash.secid,5)='MONEY' and vr.rest_type='cash') 
left join portfolio_data pd on 
	(vr.id=pd.idportfolio and pd.sec_type=vr.type 
	AND COALESCE (pd.secid,pd."group") ISNULL
	AND pd.listing ISNULL
)
left join portfolio_data pd_listing on 
	(vr.id=pd_listing.idportfolio and pd_listing.listing=vr.listing 
	AND COALESCE (pd_listing.secid,pd_listing."group",pd_listing.sec_type) ISNULL
)