DO $$DECLARE cross_rate numeric;
BEGIN

select * from dcurrencies_rates
where rate_date='10/03/2023'
and base_code=ANY(ARRAY[978,826,756,156]);
-- select * from dcurrencies_pairs
END$$;