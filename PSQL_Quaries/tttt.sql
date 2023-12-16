-- SELECT * FROM v2f_fifo_get_cost_current_positions(now()::date,	array[11]);
-- select * from f_i_get_portfolios_structure_detailed_data(array['acm002'],now()::date,840)
  SELECT *
    FROM
      f_i_get_cross_ratesfor_period_currencylist (
      ARRAY [840],
        now()::date,
        now()::date,
        810
      )
	  order by rate_date