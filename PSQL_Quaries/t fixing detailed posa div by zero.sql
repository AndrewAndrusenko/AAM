WITH 
current_position AS (
    SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios (array[25],now()::date)
  ),
  full_portfolio AS (
    SELECT
      COALESCE(modelportfolio_structure.id, current_position.idportfolio) AS idportfolio,
      COALESCE(modelportfolio_structure.instrument,current_position.instrument) AS secid,
      COALESCE(modelportfolio_structure.code,current_position.portfolioname) AS portfolio_code,
      CASE
        WHEN current_position.instrument = 'MONEY' THEN modelportfolio_structure.total_weight
        ELSE COALESCE(modelportfolio_structure.instrument_corrected_weight,0)
      END AS weight,
      COALESCE(current_position.current_balance, 0) AS current_balance,
      COALESCE(current_position.positon_type, 'investment') AS position_type,
      COALESCE(current_position."accountNo", 'new') AS account_no,
      current_position.account_currency,
	  modelportfolio_structure.strategy_name,
	  modelportfolio_structure.mp_name,
	  modelportfolio_structure.mp_id,
	  COALESCE(pl_data.pl,0) AS pl
    FROM
      current_position
      FULL OUTER JOIN (
        SELECT
		  f_i_model_portfolios_select_mp_structure_for_accounts.mp_id,
          id,
          instrument,
          code,
          instrument_corrected_weight,
          total_type,
          total_weight,
		  f_i_model_portfolios_select_mp_structure_for_accounts.strategy_name,
		  f_i_model_portfolios_select_mp_structure_for_accounts.mp_name
        FROM
          f_i_model_portfolios_select_mp_structure_for_accounts (array[25])
      ) AS modelportfolio_structure ON (
        modelportfolio_structure.id = current_position.idportfolio
        AND current_position.instrument = COALESCE(modelportfolio_structure.instrument,modelportfolio_structure.total_type)
      )
	  FULL OUTER JOIN (
	  select * from f_fifo_get_pl_positions_by_portfolio(now()::date,array[25],840)) AS pl_data ON (
        pl_data.idportfolio = current_position.idportfolio
        AND current_position.instrument =pl_data.secid
      )
	  WHERE modelportfolio_structure.instrument NOTNULL OR current_position.instrument NOTNULL OR pl_data.secid NOTNULL
	  ),
	  
	  instrument_list AS (
    SELECT DISTINCT full_portfolio.secid FROM full_portfolio
  ),
  mtm_data AS (
    SELECT  * 
	  FROM f_i_get_market_quotes_for_portfolios1 ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list),now()::date)
    ORDER BY secid, is_primary DESC
  ),
  accured_interest_data AS (
    SELECT * FROM f_i_get_accured_interests_for_portfolios ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list), now()::date::date)
  ),
  curerncies_list AS(
	  SELECT DISTINCT accured_interest_data.faceunit::NUMERIC AS code FROM accured_interest_data
	  UNION 
	  SELECT DISTINCT full_portfolio.account_currency FROM full_portfolio WHERE  full_portfolio.position_type = 'MONEY'
	  UNION 
	  SELECT DISTINCT mtm_data.currency_code FROM mtm_data
	  UNION 
	  SELECT 810
  )
--   ,
--   cross_currency_quotes AS (
	SELECT cl_main.* FROM curerncies_list as cl_main
	  LEFT JOIN LATERAL (
		SELECT * FROM f_i_get_cross_ratesfor_period_currencylist (
			ARRAY(SELECT code::bigint FROM curerncies_list),
			now()::date::date, 
			now()::date::date, 
			840::numeric)
		WHERE cl_main.code = f_i_get_cross_ratesfor_period_currencylist.base_code
		ORDER BY rate_date DESC
	    LIMIT 1
	  ) AS cl_joined ON TRUE
	  where rate_date notnull
--   ),