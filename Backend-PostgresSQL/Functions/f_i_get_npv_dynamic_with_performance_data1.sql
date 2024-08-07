-- FUNCTION: public.f_i_get_market_quotes_for_portfolios(text[], date)

DROP FUNCTION IF EXISTS public.f_i_get_npv_dynamic_with_performance_data(text[], date,date);

CREATE OR REPLACE FUNCTION public.f_i_get_npv_dynamic_with_performance_data(
	p_secid_list text[],
	p_report_date_start date,
	p_report_date_end date)
    RETURNS TABLE(report_date date,portfolioname character varying, "accountNo" text,secid character varying,
	balance numeric, pos_pv money, mtm_rate numeric,  mtm_date date,boardid character varying,percentprice boolean) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
DECLARE 
first_accounting_date date;
BEGIN
SELECT  "FirstOpenedDate" INTO first_accounting_date FROM public."gAppMainParams";
RETURN query
WITH
temp_balance AS (
SELECT * FROM f_a_b_balancesheet_total_closed_and_notclosed() 
	WHERE f_a_b_balancesheet_total_closed_and_notclosed.portfolioname = ANY (p_secid_list)
),
  dates_with_accounts AS (
    SELECT DISTINCT
      temp_balance."accountNo",
      cash_movements_dates."dataTime",
      temp_balance.secid,
      temp_balance.portfolioname
    FROM
      temp_balance
      FULL JOIN (
        SELECT DATE_TRUNC('day', dd)::date AS "dataTime"
        FROM
          GENERATE_SERIES(
			p_report_date_start::TIMESTAMP,
            p_report_date_end::TIMESTAMP,
            '1 day'::INTERVAL
          ) dd
      ) AS cash_movements_dates ON TRUE

  ),
  balances_per_dates AS (
    SELECT * FROM dates_with_accounts
      LEFT JOIN LATERAL (
        SELECT "OutGoingBalance" FROM temp_balance
        WHERE
          temp_balance."accountNo" = dates_with_accounts."accountNo"
          AND temp_balance."dateBalance" <= dates_with_accounts."dataTime"
        ORDER BY temp_balance."dateBalance" DESC
        LIMIT 1
      ) bal2 ON TRUE
  )
SELECT
  "dataTime" AS report_date,
  balances_per_dates.portfolioname,
  balances_per_dates."accountNo",
  balances_per_dates.secid,
  "OutGoingBalance" AS balance,
  SUM(COALESCE(close,1) * "OutGoingBalance")::money AS pos_pv,
  close AS mtm,
  tradedate::date AS mtm_date,
  t2.boardid,
  t_moex_boards.percentprice
FROM
  balances_per_dates
  LEFT JOIN LATERAL (
    SELECT tradedate, close, t_moexdata_foreignshares.secid,t_moexdata_foreignshares.boardid
    FROM t_moexdata_foreignshares
    WHERE
      t_moexdata_foreignshares.secid = balances_per_dates.secid
      AND t_moexdata_foreignshares.tradedate <= balances_per_dates."dataTime"
      AND close NOTNULL
    ORDER BY tradedate DESC
    LIMIT 1
  ) t2 ON TRUE
  LEFT JOIN t_moex_boards ON t_moex_boards.code=t2.boardid
GROUP BY
  GROUPING SETS (
    ("dataTime",balances_per_dates."accountNo",balances_per_dates.secid,"OutGoingBalance",close, tradedate,balances_per_dates.portfolioname,  
	  t2.boardid,t_moex_boards.percentprice),
    ("dataTime", balances_per_dates.portfolioname)
  );
END;
$BODY$;

ALTER FUNCTION public.f_i_get_npv_dynamic_with_performance_data(text[], date,date)
    OWNER TO postgres;
