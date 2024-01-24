
-- DROP FUNCTION IF EXISTS public.f_a_b_get_all_entries_transaction(numeric);

CREATE OR REPLACE FUNCTION public.f_f_get_portfolios_with_schedules(
	p_object_id numeric)
    RETURNS TABLE(
    id_fee int,
    fee_code character varying,
    fee_type_desc character varying,
    fee_object_desc character varying,
    fee_description character varying,
    period_desc character varying,
    fee_type numeric,
    main_fee_object_type smallint ,
    id_fee_period numeric,
   id int, fee_object_type smallint, object_id bigint, id_fee_main numeric, period_start date, period_end date, created time without time zone , modified time without time zone )
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
  SELECT dfees_main.id as id_fee,
    dfees_main.fee_code,
    ft."typeDescription" AS fee_type_desc,
    ot."typeDescription" AS fee_object_desc,
    dfees_main.fee_description,
    pt."typeDescription" AS period_desc,
    dfees_main.fee_type,
    dfees_main.fee_object_type as main_fee_object_type,
    dfees_main.id_fee_period,
	dfees_objects.id, dfees_objects.fee_object_type, dfees_objects.object_id, dfees_objects.id_fee_main, dfees_objects.period_start, dfees_objects.period_end, 
	dfees_objects.created, 
	dfees_objects.modified
   FROM dfees_main
     LEFT JOIN "dGeneralTypes" ft ON ft."typeCode"::text = 'fee_type'::text AND dfees_main.fee_type = ft."typeValue"::integer::numeric
     LEFT JOIN "dGeneralTypes" ot ON ot."typeCode"::text = 'fee_object_type'::text AND dfees_main.fee_object_type = ot."typeValue"::integer
     LEFT JOIN "dGeneralTypes" pt ON pt."typeCode"::text = 'id_fee_period'::text AND dfees_main.id_fee_period = ot."typeValue"::integer::numeric
	 LEFT JOIN dfees_objects ON dfees_objects.id_fee_main = dfees_main.id
	  WHERE (p_object_id ISNULL OR  dfees_objects.object_id = p_object_id)
	
  ORDER BY dfees_main.id DESC;
	
END;
$BODY$;

ALTER FUNCTION public.f_f_get_portfolios_with_schedules(numeric)
    OWNER TO postgres;
	select * from f_f_get_portfolios_with_schedules(7)
