with current_position as (
	SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios(ARRAY[2,7,11,25,29])
),
full_portfolio as (
	select
		coalesce(modelportfolio_structure.id,current_position.idportfolio) as idportfolio,
		coalesce(modelportfolio_structure.instrument,current_position.instrument) as secid,
		coalesce(modelportfolio_structure.code,current_position.portfolioname) as portfolio_code,
		CASE 
			WHEN current_position.instrument='money' THEN modelportfolio_structure.total_weight
			ELSE coalesce(modelportfolio_structure.instrument_corrected_weight,0) 
		END as weight,
		coalesce(current_position.current_balance,0) as current_balance,
		coalesce(current_position.positon_type,'investment') as position_type,
		coalesce(current_position."accountNo",'new') as account_no,
		current_position.account_currency
	from 
		current_position 
		full outer join
		(
		select id,instrument,code,instrument_corrected_weight,total_type,total_weight
		from f_i_model_portfolios_select_mp_structure_for_accounts(ARRAY[7,2,11,25,29])
		) as modelportfolio_structure ON (
			modelportfolio_structure.id=current_position.idportfolio AND  current_position.instrument=COALESCE(modelportfolio_structure.instrument,modelportfolio_structure.total_type)
		)
),
instrument_list as (
	select distinct secid from full_portfolio
),
mtm_data as (
	select 
		DISTINCT ON (secid) * 
	from f_i_get_market_quotes_for_portfolios((select array_agg(secid) from instrument_list))
		order by secid, is_primary desc
),
accured_interest_data as (
	select * from f_i_get_accured_interests_for_portfolios((select array_agg(secid) from instrument_list),now()::date)
),
cross_currency_quotes as (
	select * from f_i_get_cross_rates(ARRAY[840,978,756,826],now()::date,840)
),
full_portfolio_with_mtm_data as (
  select 
	full_portfolio.idportfolio,
	full_portfolio.portfolio_code,
	full_portfolio.secid,
	full_portfolio.weight,
	full_portfolio.current_balance,
	round (
	  case 
		when accured_interest_data.price_type=2 then (accured_interest_data.facevalue*mtm_data.close/100+accured_interest_data.coupon_calc)*full_portfolio.current_balance
		when full_portfolio.position_type='money' then 1*full_portfolio.current_balance
		else mtm_data.close*full_portfolio.current_balance
	  end, 
	2) as mtm_positon,
	mtm_data.close as mtm_rate,
	round (
	  case 
		when accured_interest_data.price_type=2 then accured_interest_data.facevalue*mtm_data.close/100+accured_interest_data.coupon_calc
		when full_portfolio.position_type='money' then 0
		else mtm_data.close
	  end, 
	4)	as mtm_dirty_price,
	mtm_data.tradedate as mtm_date,
	round (
	  case 
		when accured_interest_data.price_type=2 
			then (accured_interest_data.facevalue*mtm_data.close/100+accured_interest_data.coupon_calc)*full_portfolio.current_balance*cross_currency_quotes.cross_rate
		when full_portfolio.position_type='money' then 1*full_portfolio.current_balance*cross_currency_quotes.cross_rate
		else mtm_data.close*full_portfolio.current_balance*cross_currency_quotes.cross_rate
	  end, 
	2) as mtm_positon_base_cur,
	mtm_data.boardid,
	accured_interest_data.coupon_calc,
	accured_interest_data.couponrate,
	round(cross_currency_quotes.cross_rate,6) as cross_rate,
	cross_currency_quotes.rate_date,
	case 
		when accured_interest_data.price_type=2 then accured_interest_data.faceunit::numeric
		when full_portfolio.position_type='money' then full_portfolio.account_currency
		else mtm_data.currency_code
	end as main_currency_code,
	 "account_no"
  from full_portfolio
  left join mtm_data on mtm_data.secid=full_portfolio.secid
  left join accured_interest_data on	accured_interest_data.secid=full_portfolio.secid
  left join cross_currency_quotes on	cross_currency_quotes.base_code=
	(case 
		when accured_interest_data.price_type=2 then accured_interest_data.faceunit::numeric
		when full_portfolio.position_type='money' then full_portfolio.account_currency
		else mtm_data.currency_code
	end) 
),
npv_portfolios as (
	select idportfolio, sum(mtm_positon) as npv
	from full_portfolio_with_mtm_data
	group by idportfolio
)
select 
full_portfolio_with_mtm_data.idportfolio,
full_portfolio_with_mtm_data.portfolio_code,
full_portfolio_with_mtm_data.secid,
round(mtm_positon/npv*100,2) as fact_weight,
full_portfolio_with_mtm_data.current_balance,
full_portfolio_with_mtm_data.mtm_positon,
full_portfolio_with_mtm_data.weight,
round (npv*weight/100,2)::money as planned_position,
case when mtm_dirty_price=0 then 0::money else round ((npv*weight/100 - mtm_positon),2)::money end as order_amount,
case 
when secid='money' then null
when (npv*weight/100 - mtm_positon)>0 then 'BUY'
else 'SELL'
end as order_type,
case when mtm_dirty_price=0 then 0 else abs(div((npv*weight/100-mtm_positon),mtm_dirty_price)) end as order_qty,
full_portfolio_with_mtm_data.mtm_rate,
full_portfolio_with_mtm_data.mtm_date,
full_portfolio_with_mtm_data.mtm_dirty_price,
full_portfolio_with_mtm_data.cross_rate,
npv_portfolios.npv,
full_portfolio_with_mtm_data.rate_date
from full_portfolio_with_mtm_data
left join npv_portfolios ON full_portfolio_with_mtm_data.idportfolio=npv_portfolios.idportfolio
order by full_portfolio_with_mtm_data.idportfolio,secid

