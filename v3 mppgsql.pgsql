WITH
  current_position AS (
    SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios (ARRAY[2, 7, 11, 25, 29])
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
          f_i_model_portfolios_select_mp_structure_for_accounts (ARRAY[7, 2, 11, 25, 29])
      ) AS modelportfolio_structure ON (
        modelportfolio_structure.id = current_position.idportfolio
        AND current_position.instrument = COALESCE(modelportfolio_structure.instrument,modelportfolio_structure.total_type)
      )
  ),
  instrument_list AS (
    SELECT DISTINCT secid FROM full_portfolio
  ),
  mtm_data AS (
    SELECT DISTINCT ON (secid) * FROM f_i_get_market_quotes_for_portfolios ((SELECT ARRAY_AGG(secid) FROM instrument_list))
    ORDER BY secid, is_primary DESC
  ),
  accured_interest_data AS (
    SELECT * FROM f_i_get_accured_interests_for_portfolios ((SELECT ARRAY_AGG(secid) FROM instrument_list), NOW()::date)
  ),
  cross_currency_quotes AS (
    SELECT * FROM f_i_get_cross_rates (ARRAY[840, 978, 756, 826], NOW()::date, 840)
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
    SELECT idportfolio, SUM(mtm_positon) AS npv FROM full_portfolio_with_mtm_data GROUP BY idportfolio
  )
SELECT
  full_portfolio_with_mtm_data.idportfolio,
  full_portfolio_with_mtm_data.portfolio_code,
  full_portfolio_with_mtm_data.secid,
  ROUND(mtm_positon / npv * 100, 2) AS fact_weight,
  full_portfolio_with_mtm_data.current_balance,
  full_portfolio_with_mtm_data.mtm_positon,
  full_portfolio_with_mtm_data.weight,
  ROUND(npv * weight / 100, 2)::money AS planned_position,
  CASE
    WHEN mtm_dirty_price = 0 THEN 0::money
    ELSE ROUND((npv * weight / 100 - mtm_positon), 2)::money
  END AS order_amount,
  CASE
    WHEN secid = 'money' THEN NULL
    WHEN (npv * weight / 100 - mtm_positon) > 0 THEN 'BUY'
    ELSE 'SELL'
  END AS order_type,
  CASE
    WHEN mtm_dirty_price = 0 THEN 0
    ELSE ABS(DIV((npv * weight / 100 - mtm_positon), mtm_dirty_price
      )
    )
  END AS order_qty,
  full_portfolio_with_mtm_data.mtm_rate,
  full_portfolio_with_mtm_data.mtm_date,
  full_portfolio_with_mtm_data.mtm_dirty_price,
  full_portfolio_with_mtm_data.cross_rate,
  npv_portfolios.npv,
  full_portfolio_with_mtm_data.rate_date
FROM
  full_portfolio_with_mtm_data
  LEFT JOIN npv_portfolios ON full_portfolio_with_mtm_data.idportfolio = npv_portfolios.idportfolio
ORDER BY
  full_portfolio_with_mtm_data.idportfolio, secid

  