 with  cash_transactions AS (
    SELECT
      dportfolios.portfolioname,
	  "dataTime",
      min ("dataTime")::date as date_first_transaction,
      max ("dataTime")::date as date_last_transaction,
      "accountNo",
      SUM(CASE
        WHEN "XactTypeCode_Ext" = 5 THEN "amountTransaction" * -1
        ELSE "amountTransaction"
      END) AS cash_flow
    FROM
      "bAccountTransaction"
      LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
      LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
    WHERE
      dportfolios.portfolioname = ANY (array['ACM002','VPC004','CCM004','ICM011'])
      AND "XactTypeCode_Ext" = ANY (ARRAY[3, 5])
	GROUP BY 
	grouping sets ((dportfolios.portfolioname, "dataTime", "accountNo"),(dportfolios.portfolioname),())
 ),
cash_transactions_running_total_shift as (
  select 
  ct_main.portfolioname ,
  SUM(coalesce(ct_joined.qty_transactions,0) )
  OVER (ORDER BY ct_main.portfolioname ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS  qty_transactions
  from cash_transactions as ct_main
  left join lateral (
  select portfolioname, count(portfolioname) as qty_transactions from cash_transactions
	  where
	  ct_main.portfolioname>cash_transactions.portfolioname
      and 
	  cash_transactions.portfolioname notnull and cash_transactions."accountNo" notnull
	  group by portfolioname
	  order by cash_transactions.portfolioname desc
	  limit 1
  ) as ct_joined on true
  where ct_main.portfolioname notnull and ct_main."accountNo" isnull
)
  , corrections_to_roi AS (
	  SELECT
	  (cash_transactions_main."dataTime" - '1 day'::INTERVAL)::date AS correction_date,
      cash_transactions_main.cash_flow,
      cash_transactions_main.portfolioname,
	  COALESCE(npv_dynamic.pos_pv,0) AS last_npv,
	  (COALESCE(npv_dynamic.pos_pv, 0) + cash_transactions_main.cash_flow) AS funds_invested
    FROM  cash_transactions AS cash_transactions_main
  
      LEFT JOIN LATERAL (
		  SELECT * from f_i_get_npv_dynamic (
			  array['ACM002','VPC004','CCM004','ICM011'], 
			  (select date_first_transaction from cash_transactions where cash_transactions."portfolioname" isnull ),
			  (select date_last_transaction from cash_transactions where cash_transactions."portfolioname" isnull ),
			  840)
		  where "accountNo" isnull and
		 f_i_get_npv_dynamic.report_date = cash_transactions_main."dataTime" - '1 day'::INTERVAL
        AND cash_transactions_main.portfolioname = f_i_get_npv_dynamic.portfolioname
      ) as npv_dynamic ON TRUE
      LEFT JOIN LATERAL (
        SELECT * FROM 
          cash_transactions
        WHERE  
		  cash_transactions."dataTime" <= cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = cash_transactions.portfolioname
        ORDER BY
          cash_transactions."dataTime" DESC
        LIMIT 1
      ) AS cash_transactions1 ON TRUE
	WHERE  cash_transactions_main."dataTime" notnull
	order by portfolioname,correction_date
  ),
  correction_rates_set AS (
    SELECT
      ctr_joined.funds_invested AS base_to_correct,
      ROUND(ctr_main.last_npv / ctr_joined.funds_invested, 4) AS correction_rate,
      ctr_main.cash_flow,
      ctr_main.last_npv,
      ctr_main.correction_date,
      ctr_main.portfolioname
    FROM
      corrections_to_roi AS ctr_main
      LEFT JOIN LATERAL (
        SELECT * FROM
          corrections_to_roi
        WHERE
          corrections_to_roi.correction_date < ctr_main.correction_date
          AND corrections_to_roi.portfolioname = ctr_main.portfolioname
        ORDER BY
          correction_date DESC
        LIMIT 1
      ) AS ctr_joined ON TRUE
  ),  correction_rate_array AS ( 
	SELECT
      (correction_date + '1 day'::INTERVAL)::date AS period_start_date,
          ARRAY_AGG(COALESCE(correction_rates_set.correction_rate, 1))  OVER (
            ORDER BY
              correction_rates_set.portfolioname,
              correction_rates_set."correction_date" ASC ROWS BETWEEN UNBOUNDED PRECEDING
              AND CURRENT ROW
          ) AS correction_rate_compound,
      correction_rates_set.*
    FROM
      correction_rates_set
 )
 select 
correction_rate_array.portfolioname, correction_rate,
correction_rate_compound[cash_transactions_running_total_shift.qty_transactions+1:],
round(f_com_reduce_array_mult(correction_rate_compound[cash_transactions_running_total_shift.qty_transactions+1:]),4) as compound_rate,
 * 
 from correction_rate_array
 left join cash_transactions_running_total_shift on cash_transactions_running_total_shift.portfolioname = correction_rate_array.portfolioname