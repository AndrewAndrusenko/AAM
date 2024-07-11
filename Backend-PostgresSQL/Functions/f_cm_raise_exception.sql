-- FUNCTION: public.f_delete_bulk_orders(bigint[])

DROP FUNCTION IF EXISTS public.f_cm_raise_exception(text,boolean);

CREATE OR REPLACE FUNCTION public.f_cm_raise_exception(
	p_message_text text,p_condition boolean)
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
BEGIN
IF p_condition=TRUE THEN
RAISE EXCEPTION '%',p_message_text;
ELSE RETURN '';
END IF;
END;
$BODY$;

ALTER FUNCTION public.f_cm_raise_exception(text, boolean)
    OWNER TO postgres;
