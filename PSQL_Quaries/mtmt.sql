    SELECT DISTINCT ON (secid) * 
	  FROM f_i_get_market_quotes_for_portfolios ((select array_agg(distinct  (tidinstrument)) from dtrades),now()::date)
    ORDER BY secid, is_primary DESC