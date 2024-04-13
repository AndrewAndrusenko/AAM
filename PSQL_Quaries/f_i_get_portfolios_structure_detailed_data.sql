-- FUNCTION: public.f_i_get_portfolios_structure_detailed_data(text[], date, integer)

-- DROP FUNCTION IF EXISTS public.f_i_get_portfolios_structure_detailed_data(text[], date, integer);

CREATE OR REPLACE FUNCTION public.f_i_get_portfolios_structure_detailed_data(
	p_idportfolio_codes text[],
	p_report_date date,
	p_report_currency integer)
    RETURNS TABLE(report_currency integer, mp_id integer, notnull_npv numeric, mtm_positon_base_cur numeric, roi numeric, pl numeric, cost_in_position numeric, cost_full_position numeric, unrealizedpl numeric, total_pl numeric, idportfolio integer, portfolio_code character varying, secid character varying, strategy_name character varying, mp_name character varying, fact_weight numeric, current_balance numeric, mtm_positon numeric, weight numeric, planned_position numeric, order_amount numeric, order_type text, order_qty numeric, mtm_rate numeric, mtm_date date, mtm_dirty_price numeric, cross_rate numeric, npv numeric, rate_date date, main_currency_code numeric, orders_unaccounted_qty numeric, orders_unaccounted numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE 
p_idportfolios int[];
BEGIN
IF p_idportfolio_codes  ISNULL THEN
	SELECT ARRAY_AGG(dportfolios.idportfolio) INTO p_idportfolios FROM dportfolios; 
ELSE
	SELECT ARRAY_AGG(dportfolios.idportfolio) INTO p_idportfolios FROM dportfolios
	WHERE LOWER(portfolioname)=ANY(p_idportfolio_codes); 
END IF;
RETURN QUERY
WITH
  current_position AS (
    SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios (p_idportfolios,p_report_date)
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
          f_i_model_portfolios_select_mp_structure_for_accounts (p_idportfolios)
      ) AS modelportfolio_structure ON (
        modelportfolio_structure.id = current_position.idportfolio
        AND current_position.instrument = COALESCE(modelportfolio_structure.instrument,modelportfolio_structure.total_type)
      )
	  FULL OUTER JOIN (
	  select * from f_fifo_get_pl_positions_by_portfolio(p_report_date,p_idportfolios,p_report_currency)) AS pl_data ON (
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
	  FROM f_i_get_market_quotes_for_portfolios1 ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list),p_report_date)
    ORDER BY secid, is_primary DESC
  ),
  accured_interest_data AS (
    SELECT * FROM f_i_get_accured_interests_for_portfolios ((SELECT ARRAY_AGG(instrument_list.secid) FROM instrument_list), p_report_date::date)
  ),
  curerncies_list AS(
	  SELECT DISTINCT accured_interest_data.faceunit::NUMERIC AS code FROM accured_interest_data
	  UNION 
	  SELECT DISTINCT full_portfolio.account_currency FROM full_portfolio WHERE  full_portfolio.position_type = 'MONEY'
	  UNION 
	  SELECT DISTINCT mtm_data.currency_code FROM mtm_data
	  UNION 
	  SELECT 810
  ),
  cross_currency_quotes AS (
	SELECT * FROM curerncies_list as cl_main
	  LEFT JOIN LATERAL (
		SELECT * FROM f_i_get_cross_ratesfor_period_currencylist (
			ARRAY(SELECT code::bigint FROM curerncies_list),
			p_report_date::date, 
			p_report_date::date, 
			p_report_currency::numeric)
		WHERE cl_main.code = f_i_get_cross_ratesfor_period_currencylist.base_code
		ORDER BY rate_date DESC
	    LIMIT 1
	  ) AS cl_joined ON TRUE
  ),
  full_portfolio_with_mtm_data AS (
    SELECT
	  full_portfolio.mp_id,
	  full_portfolio.pl,
	  full_portfolio.strategy_name,
	  full_portfolio.mp_name,
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
          WHEN full_portfolio.position_type = 'MONEY' THEN 1 * full_portfolio.current_balance
          ELSE mtm_data.close * full_portfolio.current_balance
        END, 2) AS mtm_positon,
      mtm_data.close AS mtm_rate,
      ROUND(
        CASE
          WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.facevalue * mtm_data.close / 100 + accured_interest_data.coupon_calc
          WHEN full_portfolio.position_type = 'MONEY' THEN 0
          ELSE mtm_data.close
        END, 4) AS mtm_dirty_price,
      mtm_data.tradedate AS mtm_date,
      ROUND(
        CASE
          WHEN accured_interest_data.price_type = 2 THEN (
            accured_interest_data.facevalue * mtm_data.close / 100 + accured_interest_data.coupon_calc
          ) * full_portfolio.current_balance * cross_currency_quotes.cross_rate
          WHEN full_portfolio.position_type = 'MONEY' THEN 1 * full_portfolio.current_balance * cross_currency_quotes.cross_rate
          ELSE mtm_data.close * full_portfolio.current_balance * cross_currency_quotes.cross_rate
        END, 2) AS mtm_positon_base_cur,
      mtm_data.boardid,
      accured_interest_data.coupon_calc,
      accured_interest_data.couponrate,
      ROUND(cross_currency_quotes.cross_rate, 6) AS cross_rate,
      cross_currency_quotes.rate_date,
	  positions_cost.cost_in_position,
	  positions_cost.cost_full_position,
      CASE
        WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.faceunit::NUMERIC
        WHEN full_portfolio.position_type = 'MONEY' THEN full_portfolio.account_currency
        ELSE mtm_data.currency_code
      END AS main_currency_code,
      "account_no"
    FROM
      full_portfolio
      LEFT JOIN mtm_data ON mtm_data.secid = full_portfolio.secid
	  LEFT JOIN (SELECT * FROM f_fifo_get_cost_current_positions(p_report_date,	p_idportfolios,p_report_currency)) AS positions_cost 
		 ON (positions_cost.secid= full_portfolio.secid and positions_cost.idportfolio= full_portfolio.idportfolio)
      LEFT JOIN accured_interest_data ON accured_interest_data.secid = full_portfolio.secid

      LEFT JOIN cross_currency_quotes ON cross_currency_quotes.base_code = (
        CASE
          WHEN accured_interest_data.price_type = 2 THEN accured_interest_data.faceunit::NUMERIC
          WHEN full_portfolio.position_type = 'MONEY' THEN full_portfolio.account_currency
          ELSE mtm_data.currency_code
        END
      )
  ),
  npv_portfolios AS (
    SELECT full_portfolio_with_mtm_data.idportfolio, SUM(full_portfolio_with_mtm_data.mtm_positon_base_cur)+0.00001 AS npv FROM full_portfolio_with_mtm_data 
	  GROUP BY full_portfolio_with_mtm_data.idportfolio
  )
SELECT
 p_report_currency,
 full_portfolio_with_mtm_data.mp_id,
 npv_portfolios.npv as notnull_npv,
 full_portfolio_with_mtm_data.mtm_positon_base_cur,
 ROUND((full_portfolio_with_mtm_data.mtm_positon*full_portfolio_with_mtm_data.cross_rate - full_portfolio_with_mtm_data.cost_in_position+full_portfolio_with_mtm_data.pl)
	   /ABS(
		   COALESCE(full_portfolio_with_mtm_data.cost_full_position,1) ---- change coalesce
	   )*100,2) AS roi,
  full_portfolio_with_mtm_data.pl,
  full_portfolio_with_mtm_data.cost_in_position,
  full_portfolio_with_mtm_data.cost_full_position,
  ROUND((full_portfolio_with_mtm_data.mtm_positon*full_portfolio_with_mtm_data.cross_rate - full_portfolio_with_mtm_data.cost_in_position),2) 
  AS unrealizedpl,
  ROUND(
	  (full_portfolio_with_mtm_data.mtm_positon*full_portfolio_with_mtm_data.cross_rate - 
		 full_portfolio_with_mtm_data.cost_in_position+full_portfolio_with_mtm_data.pl)
	,2) 
  AS total_pl,
  full_portfolio_with_mtm_data.idportfolio,
  full_portfolio_with_mtm_data.portfolio_code,
  CASE 
	  WHEN full_portfolio_with_mtm_data.secid='MONEY' THEN full_portfolio_with_mtm_data.secid||' ('||full_portfolio_with_mtm_data.main_currency_code||')'
	  ELSE full_portfolio_with_mtm_data.secid
  END AS secid,
  full_portfolio_with_mtm_data.strategy_name,
  full_portfolio_with_mtm_data.mp_name,
  ROUND(full_portfolio_with_mtm_data.mtm_positon_base_cur / npv_portfolios.npv * 100, 2) AS fact_weight,
  full_portfolio_with_mtm_data.current_balance,
  ROUND(full_portfolio_with_mtm_data.mtm_positon * full_portfolio_with_mtm_data.cross_rate,2) AS mtm_positon,
  full_portfolio_with_mtm_data.weight,
  ROUND(npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100, 2) AS planned_position,
  CASE
    WHEN full_portfolio_with_mtm_data.mtm_dirty_price = 0 THEN 0
    ELSE ROUND(
			(ABS(
			 TRUNC((npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur)/ 
					   (full_portfolio_with_mtm_data.mtm_dirty_price*full_portfolio_with_mtm_data.cross_rate)
			 ,0)) 
			 -  COALESCE(unaccounted_orders.unaccounted_qty, 0))
		   *full_portfolio_with_mtm_data.mtm_dirty_price*full_portfolio_with_mtm_data.cross_rate
		 ,2)
  END AS order_amount,
  CASE
    WHEN full_portfolio_with_mtm_data.secid = 'MONEY' THEN NULL
    WHEN (npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur) > 0 THEN 'BUY'
    ELSE 'SELL'
  END AS order_type,
  CASE
    WHEN full_portfolio_with_mtm_data.mtm_dirty_price = 0 THEN 0
    ELSE ABS(
		TRUNC((npv_portfolios.npv * full_portfolio_with_mtm_data.weight / 100 - full_portfolio_with_mtm_data.mtm_positon_base_cur)/ 
				   (full_portfolio_with_mtm_data.mtm_dirty_price*full_portfolio_with_mtm_data.cross_rate),0)
	) -  COALESCE(unaccounted_orders.unaccounted_qty, 0)
  END AS order_qty,
  full_portfolio_with_mtm_data.mtm_rate,
  full_portfolio_with_mtm_data.mtm_date,
  ROUND(full_portfolio_with_mtm_data.mtm_dirty_price * full_portfolio_with_mtm_data.cross_rate,6) AS mtm_dirty_price,
  full_portfolio_with_mtm_data.cross_rate,
  ROUND(npv_portfolios.npv,2) as npv,
  full_portfolio_with_mtm_data.rate_date,
  full_portfolio_with_mtm_data.main_currency_code,
  COALESCE(unaccounted_orders.unaccounted_qty, 0) as orders_unaccounted_qty,
  ROUND(
	  COALESCE(unaccounted_orders.unaccounted_qty, 0)
	  *full_portfolio_with_mtm_data.mtm_dirty_price*full_portfolio_with_mtm_data.cross_rate
  ,2) as orders_unaccounted
FROM
  full_portfolio_with_mtm_data
  LEFT JOIN npv_portfolios ON full_portfolio_with_mtm_data.idportfolio = npv_portfolios.idportfolio
  LEFT JOIN 
		(SELECT un_or.id_portfolio, un_or.secid, SUM(un_or.unaccounted_qty) AS unaccounted_qty 
		 FROM f_i_o_get_orders_unaccounted_qty(p_idportfolios,ARRAY(SELECT instrument_list.secid FROM instrument_list)) un_or
		 GROUP BY un_or.id_portfolio, un_or.secid) AS unaccounted_orders
	ON (unaccounted_orders.secid = full_portfolio_with_mtm_data.secid	AND unaccounted_orders.id_portfolio = full_portfolio_with_mtm_data.idportfolio);

-- ORDER BY
--   full_portfolio_with_mtm_data.idportfolio,mp_id, secid;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_portfolios_structure_detailed_data(text[], date, integer)
    OWNER TO postgres;
SELECT 	* FROM f_i_get_portfolios_structure_detailed_data(
	ARRAY['acm002'],
	now()::date,840)
	where secid=ANY(ARRAY['RI100000BF4','TSLA-RM'])