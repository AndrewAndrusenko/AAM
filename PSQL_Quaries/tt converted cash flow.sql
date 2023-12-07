WITH
  cash_transactions AS (
    SELECT
      dportfolios.portfolioname,
      "dataTime",
      MIN("dataTime")::date AS date_first_transaction,
      "accountNo",
      SUM(
        CASE
          WHEN "XactTypeCode_Ext" = 5 THEN "amountTransaction" * -1
          ELSE "amountTransaction"
        END
      ) AS cash_flow,
	  "bAccounts"."currencyCode" as account_currency
    FROM
      "bAccountTransaction"
      LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
      LEFT JOIN dportfolios ON "bAccounts".idportfolio = dportfolios.idportfolio
    WHERE
      dportfolios.portfolioname = ANY (ARRAY['ACM002','ICM016'])
      AND "XactTypeCode_Ext" = ANY (ARRAY[3, 5])
      AND "dataTime" <= '11/28/23'
    GROUP BY
      GROUPING SETS (
        (
          dportfolios.portfolioname,
          "dataTime",
          "accountNo",
		  "currencyCode"
        ),
        (dportfolios.portfolioname),
        ()
      )
  ),
  npv_dynamic AS (
    SELECT *
    FROM
      f_i_get_npv_dynamic (
        ARRAY['ACM002','ICM016'],
        CASE
          WHEN (SELECT date_first_transaction FROM cash_transactions WHERE cash_transactions."portfolioname" ISNULL) < '03/28/23'
            THEN (SELECT date_first_transaction FROM cash_transactions WHERE cash_transactions."portfolioname" ISNULL )
          ELSE '03/28/23'
        END,
        '11/28/23',
        978
      )
    WHERE
      f_i_get_npv_dynamic."accountNo" ISNULL AND f_i_get_npv_dynamic.pos_pv notnull AND f_i_get_npv_dynamic.pos_pv!=0
  ),
  cash_transactions_running_total_shift AS (
    SELECT
      ct_main.portfolioname,
      SUM(COALESCE(ct_joined.qty_transactions, 0)) OVER (
        ORDER BY
          ct_main.portfolioname ASC ROWS BETWEEN UNBOUNDED PRECEDING
          AND CURRENT ROW
      ) AS qty_transactions
    FROM
      cash_transactions AS ct_main
      LEFT JOIN LATERAL (
        SELECT
          cash_transactions.portfolioname,
          COUNT(cash_transactions.portfolioname) AS qty_transactions
        FROM
          cash_transactions
        WHERE
          ct_main.portfolioname > cash_transactions.portfolioname
          AND cash_transactions.portfolioname NOTNULL
          AND cash_transactions."accountNo" NOTNULL
        GROUP BY
          cash_transactions.portfolioname
        ORDER BY
          cash_transactions.portfolioname DESC
        LIMIT
          1
      ) AS ct_joined ON TRUE
    WHERE
      ct_main.portfolioname NOTNULL
      AND ct_main."accountNo" ISNULL
  )
  ,
    corrections_to_roi AS (
    SELECT
      (cash_transactions_main."dataTime" - '1 day'::INTERVAL
      )::date AS correction_date,
--       cash_transactions_main.cash_flow,
	  CASE 
	  WHEN cash_transactions_main.account_currency!=978 
	  THEN 
	  (select rate from f_i_get_cross_rate_for_trade(cash_transactions_main.account_currency,978,cash_transactions_main."dataTime"::date,810::numeric)) 
	  * cash_transactions_main.cash_flow
	  ELSE cash_transactions_main.cash_flow
	  END as cash_flow,
      cash_transactions_main.portfolioname,
      COALESCE(nd1.pos_pv, 0) AS last_npv,
      (
        COALESCE(nd1.pos_pv, 0) + cash_transactions_main.cash_flow
      ) AS funds_invested
    FROM
      cash_transactions AS cash_transactions_main
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          npv_dynamic
        WHERE
          npv_dynamic.report_date = cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = npv_dynamic.portfolioname
      ) AS nd1 ON TRUE
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          cash_transactions
        WHERE
          cash_transactions."dataTime" <= cash_transactions_main."dataTime" - '1 day'::INTERVAL
          AND cash_transactions_main.portfolioname = cash_transactions.portfolioname
        ORDER BY
          cash_transactions."dataTime" DESC
        LIMIT 1
      ) AS cash_transactions1 ON TRUE
    WHERE
      cash_transactions_main."dataTime" NOTNULL
	   )
-- 	   ,
--   correction_rates_set AS (
    SELECT
      ctr_joined.funds_invested AS base_to_correct,
	  ctr_joined.*,
      ROUND(ctr_main.last_npv / ctr_joined.funds_invested, 4) AS correction_rate,
      ctr_main.cash_flow,
      ctr_main.last_npv,
      ctr_main.correction_date,
      ctr_main.portfolioname
    FROM
      corrections_to_roi AS ctr_main
      LEFT JOIN LATERAL (
        SELECT *
        FROM
          corrections_to_roi
        WHERE
          corrections_to_roi.correction_date < ctr_main.correction_date
          AND corrections_to_roi.portfolioname = ctr_main.portfolioname
        ORDER BY
          correction_date DESC
        LIMIT 1
      ) AS ctr_joined ON TRUE