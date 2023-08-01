SELECT quote_currency."CurrencyCode"||'/'||base_currency."CurrencyCode" as pair, id, base_code, base_currency."CurrencyCode" as base_iso, quote_code,quote_currency."CurrencyCode" as quote_iso , rate, rate_date::timestamp without time zone, rate_type, nominal FROM public.dcurrencies_rates left join "dCurrencies" AS base_currency ON base_currency."CurrencyCodeNum"=dcurrencies_rates.base_code
left join "dCurrencies" AS quote_currency ON quote_currency."CurrencyCodeNum"=dcurrencies_rates.quote_code 
where quote_currency."CurrencyCode"||'/'||base_currency."CurrencyCode"= ANY(ARRAY['RUB/USD','RUB/EUR'])
ORDER BY id DESC