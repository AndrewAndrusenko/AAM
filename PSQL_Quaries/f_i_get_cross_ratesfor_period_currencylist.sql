-- FUNCTION: public.f_i_get_cross_rates(bigint[], date, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_cross_ratesfor_period_currencylist(
	p_currencies bigint[],
	p_date date,
	p_quote_currency numeric)
    RETURNS TABLE(rate_date date, base_code numeric, quote_code numeric, rate numeric, cross_quote_rate numeric, cross_rate numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE quote_currency_record record;

BEGIN
SELECT
  * INTO quote_currency_record
FROM
  dcurrencies_rates
WHERE
  dcurrencies_rates.rate_date <= p_date
  AND dcurrencies_rates.base_code = p_quote_currency
ORDER BY rate_date desc limit 1;

RETURN QUERY
SELECT
  quote_currency_record.rate_date,
  dcurrencies_rates.base_code,
  p_quote_currency,
  dcurrencies_rates.rate,
  quote_currency_record.rate,
  ROUND(dcurrencies_rates.rate / quote_currency_record.rate, 6) AS cross_rate
FROM
  dcurrencies_rates
WHERE
  dcurrencies_rates.rate_date = quote_currency_record.rate_date
  AND dcurrencies_rates.base_code = ANY (p_currencies)
UNION
SELECT --base currency data
  quote_currency_record.rate_date,
  p_quote_currency,
  p_quote_currency,
  quote_currency_record.rate,
  quote_currency_record.rate,
  1
UNION
SELECT --quote currency data
  quote_currency_record.rate_date,
  quote_currency_record.quote_code,
  p_quote_currency,
  1,
  quote_currency_record.rate,
  1/quote_currency_record.rate;

END;
$BODY$;

ALTER FUNCTION public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, numeric)
    OWNER TO postgres;
