-- FUNCTION: public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, date, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, date, numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_cross_ratesfor_period_currencylist(
	p_currencies bigint[],
	p_date_start date,
	p_date_end date,
	p_quote_currency numeric)
    RETURNS TABLE(rate_date date, base_code numeric, quote_code numeric, rate numeric, cross_quote_rate numeric, cross_rate numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
IF (p_quote_currency = 810) THEN 
	RETURN QUERY
	WITH
	  base_set AS (
		SELECT
		  dcurrencies_rates.rate_date,
		  dcurrencies_rates.base_code,
		  dcurrencies_rates.quote_code,
		  dcurrencies_rates.rate
		FROM
		  dcurrencies_rates
		WHERE
		  dcurrencies_rates.rate_date <= p_date_end
		  AND dcurrencies_rates.rate_date >= p_date_start - '60 day'::INTERVAL
		  AND dcurrencies_rates.base_code = ANY (p_currencies)
	  ),
	  quote_set AS (
		SELECT DISTINCT
		  base_set.rate_date,
		  810 AS base_code,
		  810 AS quote_code,
		  1 AS rate
		FROM
		  base_set
	  )
	SELECT
	  base_set.rate_date,
	  base_set.base_code,
	  base_set.base_code AS quote_code,
	  base_set.rate,
	  base_set.rate,
	  base_set.rate AS cross_rate
	FROM
	  base_set
	UNION
	SELECT
	  quote_set.rate_date,
	  quote_set.base_code,
	  quote_set.base_code AS quote_code,
	  quote_set.rate,
	  quote_set.rate,
	  quote_set.rate AS cross_rate
	FROM
	  quote_set;

ELSE 
	RETURN QUERY
	WITH
	  cross_currency AS (
		SELECT
		  dcurrencies_rates.rate_date,
		  dcurrencies_rates.base_code,
		  dcurrencies_rates.quote_code,
		  dcurrencies_rates.rate
		FROM
		  dcurrencies_rates
		WHERE
		  dcurrencies_rates.rate_date <= p_date_end
		  AND dcurrencies_rates.rate_date >= p_date_start - '60 day'::INTERVAL
		  AND dcurrencies_rates.base_code = p_quote_currency
	  ),
	  quote_currency AS (
		SELECT
		  cross_currency.rate_date,
		  cross_currency.quote_code,
		  cross_currency.base_code,
		  1
		FROM
		  cross_currency
	  )
	SELECT
	  cross_currency.rate_date,
	  cross_rates_data.base_code,
	  cross_currency.base_code,
	  cross_rates_data.rate,
	  cross_currency.rate,
	  ROUND(cross_rates_data.rate / cross_currency.rate, 6) AS cross_rate
	FROM
	  cross_currency
	  LEFT JOIN LATERAL (
		SELECT
		  dcurrencies_rates.rate_date,
		  dcurrencies_rates.base_code,
		  dcurrencies_rates.rate
		FROM
		  dcurrencies_rates
		WHERE
		  dcurrencies_rates.rate_date = cross_currency.rate_date
		  AND dcurrencies_rates.base_code = ANY (p_currencies)
		UNION
		SELECT
		  quote_currency.rate_date,
		  810,
		  1
		FROM
		  quote_currency
		WHERE
		  quote_currency.rate_date = cross_currency.rate_date
	  ) AS cross_rates_data ON TRUE;
END IF;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, date, numeric)
    OWNER TO postgres;
	select * from f_i_get_cross_ratesfor_period_currencylist(array[840,978],'01/15/2024','01/15/2024',840)
