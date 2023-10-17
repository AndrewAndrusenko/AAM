WITH
  current_position AS (
    SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios (array[23],now()::date)
  ),
  full_portfolio AS (
    SELECT
      COALESCE(modelportfolio_structure.id, current_position.idportfolio) AS idportfolio,
      COALESCE(modelportfolio_structure.instrument,current_position.instrument) AS secid,
      COALESCE(modelportfolio_structure.code,current_position.portfolioname) AS portfolio_code,
      CASE
        WHEN current_position.instrument = 'money' THEN modelportfolio_structure.total_weight
        ELSE COALESCE(modelportfolio_structure.instrument_corrected_weight,0)
      END AS weight,
      COALESCE(current_position.current_balance, 0) AS current_balance,
      COALESCE(current_position.positon_type, 'investment') AS position_type,
      COALESCE(current_position."accountNo", 'new') AS account_no,
      current_position.account_currency
    FROM
      current_position
      FULL OUTER JOIN (
        SELECT
          id,
          instrument,
          code,
          instrument_corrected_weight,
          total_type,
          total_weight
        FROM
          f_i_model_portfolios_select_mp_structure_for_accounts (array[23])
      ) AS modelportfolio_structure ON (
        modelportfolio_structure.id = current_position.idportfolio
        AND current_position.instrument = COALESCE(modelportfolio_structure.instrument,modelportfolio_structure.total_type)
      )
	  WHERE modelportfolio_structure.instrument NOTNULL OR current_position.instrument NOTNULL
  ),
  instrument_list AS (
    SELECT DISTINCT full_portfolio.secid FROM full_portfolio
  ),
  mtm_data AS (
    SELECT DISTINCT ON (secid) * 
	  FROM f_i_get_market_quotes_for_portfolios ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list),now()::date)
    ORDER BY secid, is_primary DESC
  ),
  accured_interest_data AS (
    SELECT * FROM f_i_get_accured_interests_for_portfolios ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list), now()::date)
  ),
  cross_currency_quotes AS (
    SELECT * FROM f_i_get_cross_rates (ARRAY[840, 978, 756, 826], now()::date, 840)
  ),
  full_portfolio_with_mtm_data AS (
    SELECT
      full_portfolio.idportfolio,
      full_portfolio.portfolio_code,
      full_portfolio.secid,
      full_portfolio.weight,
      full_portfolio.current_balance,
      ROUND(
        CASE
          WHEN accured_interest_data.price_type = 2 THEN (
            accured_interest_data.facevalue * mtm_data.close / 100 + accured_interest_data.coupon_calc
          ) * full_portfolio.current_balance
          WHEN full_portfolio.position_type = 'money' THEN 1 * full_portfolio.current_balance
          ELSE mtm_data.close * full_portfolio.current_balance
        END, 2) AS mtm_positon,
      mtm_data.close AS mtm_rate,
      ROUND(
        CASE
          WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.facevalue * mtm_data.close / 100 + accured_interest_data.coupon_calc
          WHEN full_portfolio.position_type = 'money' THEN 0
          ELSE mtm_data.close
        END, 4) AS mtm_dirty_price,
      mtm_data.tradedate AS mtm_date,
      ROUND(
        CASE
          WHEN accured_interest_data.price_type = 2 THEN (
            accured_interest_data.facevalue * mtm_data.close / 100 + accured_interest_data.coupon_calc
          ) * full_portfolio.current_balance * cross_currency_quotes.cross_rate
          WHEN full_portfolio.position_type = 'money' THEN 1 * full_portfolio.current_balance * cross_currency_quotes.cross_rate
          ELSE mtm_data.close * full_portfolio.current_balance * cross_currency_quotes.cross_rate
        END, 2) AS mtm_positon_base_cur,
      mtm_data.boardid,
      accured_interest_data.coupon_calc,
      accured_interest_data.couponrate,
      ROUND(cross_currency_quotes.cross_rate, 6) AS cross_rate,
      cross_currency_quotes.rate_date,
      CASE
        WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.faceunit::NUMERIC
        WHEN full_portfolio.position_type = 'money' THEN full_portfolio.account_currency
        ELSE mtm_data.currency_code
      END AS main_currency_code,
      "account_no"
    FROM
      full_portfolio
      LEFT JOIN mtm_data ON mtm_data.secid = full_portfolio.secid
      LEFT JOIN accured_interest_data ON accured_interest_data.secid = full_portfolio.secid
      LEFT JOIN cross_currency_quotes ON cross_currency_quotes.base_code = (
        CASE
          WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.faceunit::NUMERIC
          WHEN full_portfolio.position_type = 'money' THEN full_portfolio.account_currency
          ELSE mtm_data.currency_code
        END
      )
  ),
  npv_portfolios AS (
    SELECT full_portfolio_with_mtm_data.idportfolio, SUM(full_portfolio_with_mtm_data.mtm_positon_base_cur)+0.00001 AS npv FROM full_portfolio_with_mtm_data 
	  GROUP BY full_portfolio_with_mtm_data.idportfolio
  )
SELECT
  full_portfolio_with_mtm_data.idportfolio,
  full_portfolio_with_mtm_data.portfolio_code,
  full_portfolio_with_mtm_data.secid,
  ROUND(full_portfolio_with_mtm_data.mtm_positon / npv_portfolios.npv * 100, 2) AS fact_weight,
  full_portfolio_with_mtm_data.current_balance,
  full_portfolio_with_mtm_data.mtm_positon,
  full_portfolio_with_mtm_data.weight,
  ROUND(npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100, 2) AS planned_position,
  CASE
    WHEN full_portfolio_with_mtm_data.mtm_dirty_price = 0 THEN 0
    ELSE ROUND((npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur), 2)
  END AS order_amount,
  CASE
    WHEN full_portfolio_with_mtm_data.secid = 'money' THEN NULL
    WHEN (npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur) > 0 THEN 'BUY'
    ELSE 'SELL'
  END AS order_type,
  CASE
    WHEN full_portfolio_with_mtm_data.mtm_dirty_price = 0 THEN 0
    ELSE ABS(DIV((npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur), full_portfolio_with_mtm_data.mtm_dirty_price*full_portfolio_with_mtm_data.cross_rate))
  END AS order_qty,
  full_portfolio_with_mtm_data.mtm_rate,
  full_portfolio_with_mtm_data.mtm_date,
  full_portfolio_with_mtm_data.mtm_dirty_price,
  full_portfolio_with_mtm_data.cross_rate,
  ROUND(npv_portfolios.npv,2) as npv,
  full_portfolio_with_mtm_data.rate_date,
  full_portfolio_with_mtm_data.main_currency_code
FROM
  full_portfolio_with_mtm_data
  LEFT JOIN npv_portfolios ON full_portfolio_with_mtm_data.idportfolio = npv_portfolios.idportfolio
ORDER BY
  full_portfolio_with_mtm_data.idportfolio, secid;