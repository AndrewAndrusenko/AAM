with npv_dynamic as (
	select * 
	from f_i_get_npv_dynamic( Array['ACM002'],'10/10/2023','11/28/2023',840)
	where f_i_get_npv_dynamic."accountNo" isnull
), cash_transactions as (
	select dportfolios.portfolioname,
	"dataTime", 
	"XactTypeCode_Ext", "accountNo", id, 
	CASE 
		WHEN "XactTypeCode_Ext"=5 	THEN "amountTransaction"*-1
		ELSE "amountTransaction"
	END as cash_flow
	from "bAccountTransaction"
	left join "bAccounts" on "bAccounts"."accountId" = "bAccountTransaction"."accountId"
	left join dportfolios on "bAccounts".idportfolio = dportfolios.idportfolio
	where
	dportfolios.portfolioname = any(array['ACM002'])
	and "XactTypeCode_Ext" = ANY(array[3,5])
	and id!=10944
), corrections_to_roi as (
	select 
	(cash_transactions_main."dataTime" - '1 day'::interval)::date as correction_date,
	cash_transactions_main.cash_flow ,
	cash_transactions_main.portfolioname,
	coalesce(npv_dynamic.pos_pv,0)  as last_npv,
	(coalesce(npv_dynamic.pos_pv,0) + cash_transactions_main.cash_flow) as funds_invested
	from cash_transactions as cash_transactions_main
	left join npv_dynamic on (
		npv_dynamic.report_date = cash_transactions_main."dataTime" - '1 day'::interval
		AND cash_transactions_main.portfolioname=npv_dynamic.portfolioname)
	left join lateral (
    select * from cash_transactions
	where cash_transactions."dataTime"<=cash_transactions_main."dataTime" - '1 day'::interval
		AND cash_transactions_main.portfolioname=cash_transactions.portfolioname
	order by cash_transactions."dataTime" desc
	LIMIT 1
) as cash_transactions1 on true
), correction_rates_set as (
	select 
	ctr_joined.funds_invested as base_to_correct, 
	round(ctr_main.last_npv/ctr_joined.funds_invested,4) as correction_rate,
	ctr_main.cash_flow,
	ctr_main.last_npv,
	ctr_main.correction_date,
	ctr_main.portfolioname
	from corrections_to_roi as ctr_main
	left join lateral (
	select * from corrections_to_roi
		where 
		corrections_to_roi.correction_date<ctr_main.correction_date
		and corrections_to_roi.portfolioname=ctr_main.portfolioname
		order by correction_date desc
		limit 1
	) as ctr_joined on true
)
,correction_rate_array as (
	select 
	(correction_date + '1 day'::interval)::date as period_start_date,
	round (f_com_reduce_array_mult(
		array_agg (coalesce(correction_rate,1)) OVER (
			ORDER BY
			  portfolioname, "correction_date" ASC ROWS BETWEEN UNBOUNDED PRECEDING
			  AND CURRENT ROW
		  )),4) as correction_rate_compound,
	correction_rates_set.*
	from correction_rates_set 
)
select 
npv_dynamic.portfolioname,
npv_dynamic.report_date,
npv_dynamic.pos_pv::money as npv,
ROUND((npv_dynamic.pos_pv/(cra.last_npv+cash_flow)-1)*100,3) as roi_current_period,
ROUND((npv_dynamic.pos_pv/(cra.last_npv+cash_flow)-1)*100*correction_rate_compound,3) as time_wighted_roi,
cra.last_npv::money,
cash_flow::money,
correction_rate,
correction_rate_compound,
base_to_correct::money,
period_start_date
from npv_dynamic
left join lateral (
	select * from correction_rate_array 
	where correction_rate_array.period_start_date<=npv_dynamic.report_date
	and npv_dynamic.portfolioname=correction_rate_array.portfolioname
	order by correction_rate_array.period_start_date desc
	limit 1
) as cra on true
order by report_date desc

