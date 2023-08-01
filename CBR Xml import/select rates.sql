SELECT id, base_code, base_currency."CurrencyCode", quote_code,quote_currency."CurrencyCode", rate, rate_date, rate_type, nominal
	FROM public.dcurrencies_rates
	left join "dCurrencies" AS base_currency ON base_currency."CurrencyCodeNum"=dcurrencies_rates.base_code
	left join "dCurrencies" AS quote_currency ON quote_currency."CurrencyCodeNum"=dcurrencies_rates.quote_code	