with posa as (SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios(ARRAY[2,7,25,29])
)
select
coalesce(modelportfolio_structure.id,posa.idportfolio) as id,
coalesce(modelportfolio_structure.instrument,posa.instrument) as instrument,
coalesce(mtm.close,0) as mtm_rate,
coalesce(accured_interests.coupon_calc,0) as accured_interest,
coalesce(accured_interests.facevalue,0) as facevalue,
coalesce(accured_interests.faceunit,'0') as faceunit,

coalesce(modelportfolio_structure.code,posa.portfolioname) as code,
coalesce(modelportfolio_structure.instrument_corrected_weight,0) as weight,
coalesce(posa.current_balance,0) as current_balance,
coalesce(posa.positon_type,'investment') as position_type,
coalesce(posa."accountNo",'new') as account_no
 from posa 
full outer join
(select * from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,25,29])) 
as modelportfolio_structure ON (modelportfolio_structure.id=posa.idportfolio AND  posa.instrument=modelportfolio_structure.instrument)
left join (select * from f_i_get_market_quotes_for_portfolios(ARRAY[7,2,25,29])) as mtm on mtm.secid=modelportfolio_structure.instrument
left join (select * from f_i_get_accured_interests_for_portfolios(array[2,7],now()::date)) as accured_interests ON accured_interests.secid=modelportfolio_structure.instrument
order by coalesce(modelportfolio_structure.id,posa.idportfolio), posa.instrument
