WITH quote_currency AS (
SELECT * FROM  dcurrencies_rates
WHERE   dcurrencies_rates.rate_date <= '11/24/2023' AND dcurrencies_rates.rate_date >= '10/01/2023' AND dcurrencies_rates.base_code = 840
)
SELECT 
 
  quote_currency.rate_date,
  cross_rates_data.base_code,
  quote_currency.base_code,
  cross_rates_data.rate,
  quote_currency.rate,
  ROUND(cross_rates_data.rate / quote_currency.rate, 6) AS cross_rate
FROM
  quote_currency
LEFT JOIN LATERAL (
  SELECT 
	  dcurrencies_rates.rate_date,
	  dcurrencies_rates.base_code,
	  dcurrencies_rates.rate
  FROM dcurrencies_rates
	WHERE
		dcurrencies_rates.rate_date = quote_currency.rate_date
		AND dcurrencies_rates.base_code = ANY (ARRAY[978,156,756,826,810])
) AS cross_rates_data ON TRUE
-- WHERE
--   dcurrencies_rates.rate_date = quote_currency_record.rate_date
--   AND dcurrencies_rates.base_code = ANY (p_currencies)