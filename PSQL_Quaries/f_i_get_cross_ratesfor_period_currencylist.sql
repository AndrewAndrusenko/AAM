-- FUNCTION: public.f_i_get_cross_rates(bigint[], date, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, numeric);

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
RETURN QUERY
WITH
  cross_currency AS (
    SELECT * FROM 
      dcurrencies_rates
    WHERE
      dcurrencies_rates.rate_date <= p_date_end
      AND dcurrencies_rates.rate_date >= p_date_start - '30 day'::interval
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
END;
$BODY$;

ALTER FUNCTION public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date,date, numeric)
    OWNER TO postgres;
select * from 
f_i_get_cross_ratesfor_period_currencylist (array[978,840,826,756,156,810],'10/29/2023','11/05/2023',840)
order by rate_date asc