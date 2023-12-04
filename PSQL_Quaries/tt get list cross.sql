WITH cross_currency AS (
	SELECT * FROM  dcurrencies_rates
		WHERE  
			dcurrencies_rates.rate_date <= '11/24/2023' 
			AND dcurrencies_rates.rate_date >= '10/01/2023' 
			AND dcurrencies_rates.base_code = 840
), quote_currency AS (
	SELECT 
		rate_date,
		810,
		cross_currency.base_code,
		1
	FROM cross_currency
)
SELECT 
  cross_currency.rate_date,
  cross_rates_data.base_code,
  cross_currency.base_code,
  cross_rates_data.rate,
  cross_currency.rate,
  ROUND(cross_rates_data.rate / cross_currency.rate, 6) AS cross_rate
FROM cross_currency
LEFT JOIN LATERAL (
  SELECT 
	  dcurrencies_rates.rate_date,
	  dcurrencies_rates.base_code,
	  dcurrencies_rates.rate
  FROM dcurrencies_rates
	WHERE
		dcurrencies_rates.rate_date = cross_currency.rate_date
		AND dcurrencies_rates.base_code = ANY (ARRAY[978,156,756,826,810,840])
  UNION 
  SELECT 
	  quote_currency.rate_date,
	  810,
	  1
  FROM quote_currency
	WHERE
		quote_currency.rate_date = cross_currency.rate_date
) AS cross_rates_data ON TRUE
