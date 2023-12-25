select 
  COALESCE(report_date,NOW()) AS report_date,
  id_portfolio,
  portfolioname,
  sum(management_fee_amount) as management_fee_amount,
  npv,
  fee_code,
  calculation_start,
  calculation_end,
  period_start,
  period_end,
  schedule_range,
  feevalue,
  fee_type_value
from f_f_calc_management_fees (array(select portfolioname from dportfolios),(now() - '1 months'::interval)::date,now()::date)

group by
grouping sets (
(  report_date,
   id_portfolio,
  portfolioname,
   management_fee_amount,
  npv,
  fee_code,
  calculation_start,
  calculation_end,
  period_start,
  period_end,
  schedule_range,
  feevalue,
  fee_type_value),
	(id_portfolio,portfolioname)
)
order by portfolioname, npv