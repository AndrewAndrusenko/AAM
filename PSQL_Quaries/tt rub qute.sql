  with base_set as (
  SELECT dcurrencies_rates.rate_date,dcurrencies_rates.base_code,dcurrencies_rates.quote_code, dcurrencies_rates.rate
	from dcurrencies_rates
	WHERE
      dcurrencies_rates.rate_date <= '11/28/23'
      AND dcurrencies_rates.rate_date >= '10/01/23'
-- 	  - '30 day'::interval
      AND dcurrencies_rates.base_code = ANY(array[840,978])
	  )
	  , quote_set as (
	  select distinct rate_date, 810,810, 1
		  from dcurrencies_rates
	  )
	  select * from base_set
	  union 
	  select * from quote_set