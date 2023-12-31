-- FUNCTION: public.f_f_update_accounted_management_fees(numeric[], numeric)

DROP FUNCTION IF EXISTS public.f_f_update_accounted_management_fees(numeric[], numeric[]);

CREATE OR REPLACE FUNCTION public.f_f_update_accounted_management_fees(
	p_fees_id numeric[],
	p_entry_id numeric[])
    RETURNS numeric
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
o_inserted_qty numeric;
BEGIN
UPDATE
  public.dfees_transactions 
SET
  id_b_entry=p_entry_id1
WHERE dfees_transactions.id = ANY(p_fees_id);
GET DIAGNOSTICS o_inserted_qty = ROW_COUNT;
RETURN o_inserted_qty;
END
$BODY$;

ALTER FUNCTION public.f_f_update_accounted_management_fees(numeric[], numeric[])
    OWNER TO postgres;
