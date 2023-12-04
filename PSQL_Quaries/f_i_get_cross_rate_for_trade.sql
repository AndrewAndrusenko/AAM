-- FUNCTION: public.f_i_get_cross_ratesfor_period_currencylist(bigint[], date, date, numeric)

-- DROP FUNCTION IF EXISTS public.f_i_get_cross_rate_for_trade(numeric, numeric, date, numeric);

CREATE OR REPLACE FUNCTION public.f_i_get_cross_rate_for_trade(
	p_base_code numeric,
	p_quote_code numeric,
	p_rate_data date,
	p_cross_code numeric)
    RETURNS TABLE(base_code numeric, quote_code numeric, rate_date date, rate numeric ) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
WITH
cross_currency AS (
  SELECT
    dcurrencies_rates.base_code,
    dcurrencies_rates.quote_code,
    dcurrencies_rates.rate,
    dcurrencies_rates.rate_date
  FROM
    dcurrencies_rates
  WHERE
    dcurrencies_rates.rate_date <= p_rate_data
    AND (dcurrencies_rates.base_code = p_base_code
    OR dcurrencies_rates.base_code = p_quote_code)
  ORDER BY
    dcurrencies_rates.rate_date DESC
  LIMIT
    2
),
quote_currency AS (
  SELECT
    810,
    810,
    1,
    cross_currency.rate_date
  FROM
    cross_currency
),
full_set AS (
  SELECT
    *
  FROM
    cross_currency
  UNION
  SELECT
    *
  FROM
    quote_currency
)
SELECT
  p_base_code,
  p_quote_code,
  (SELECT full_set.rate_date FROM full_set ORDER BY full_set.rate_date DESC LIMIT 1
  ) AS r_date,
 ROUND(
 (SELECT full_set.rate FROM full_set WHERE full_set.base_code = p_base_code ORDER BY full_set.rate_date DESC LIMIT 1) 
  / 
  (SELECT full_set.rate FROM full_set WHERE full_set.base_code = p_quote_code ORDER BY full_set.rate_date DESC LIMIT 1) 
 ,6)
  AS rate;
END;
$BODY$;

ALTER FUNCTION public.f_i_get_cross_rate_for_trade(numeric, numeric, date, numeric)
    OWNER TO postgres;
select * from f_i_get_cross_rate_for_trade('978','840','11/01/2023','810');
