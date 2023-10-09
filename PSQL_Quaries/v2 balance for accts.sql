with posa as (SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios(ARRAY[2,7,25,29])
)
select
coalesce(modelportfolio_structure.id,posa.idportfolio) as id,
coalesce(modelportfolio_structure.instrument,posa.instrument) as instrument,

coalesce(modelportfolio_structure.code,posa.portfolioname) as code,
coalesce(modelportfolio_structure.instrument_corrected_weight,0) as weight,
coalesce(posa.current_balance,0) as current_balance,
coalesce(posa.current_balance,0) as current_balance,
coalesce(posa.positon_type,'investment') as current_balance,
coalesce(posa."accountNo",'new') as account_no
 from posa 
full outer join
(select * from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,25,29])) 
as modelportfolio_structure ON (modelportfolio_structure.id=posa.idportfolio AND  posa.instrument=modelportfolio_structure.instrument)
order by coalesce(modelportfolio_structure.id,posa.idportfolio), posa.instrument
