-- FUNCTION: public.trg_f_fees_objects_create_new_link()

-- DROP FUNCTION IF EXISTS public.trg_f_fees_objects_create_new_link();

CREATE OR REPLACE FUNCTION public.trg_f_fees_objects_create_new_link()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE last_claculation_date date;

BEGIN
SELECT
  dfees_transactions.fee_date INTO last_claculation_date
FROM
  public.dfees_transactions
WHERE
  dfees_transactions.id_fee_main = OLD.id_fee_main
  AND dfees_transactions.id_object = OLD.object_id
  AND dfees_transactions.fee_date >= OLD.period_start
ORDER BY
  fee_date DESC
LIMIT 1;

IF (
  (TO_JSONB(OLD.*) - 'period_end') != (TO_JSONB(NEW.*) - 'period_end')
  AND last_claculation_date != NULL
)
OR last_claculation_date >= LEAST(NEW.period_end, OLD.period_end) THEN RAISE EXCEPTION USING MESSAGE = 'There are created fees calculations with fee id ' || NEW.id_fee_main || ' and portfolio id ' || NEW.object_id;

END IF;

IF EXISTS (
  SELECT
    dfees_objects.id
  FROM
    public.dfees_objects
    LEFT JOIN dfees_main ON dfees_main.id = dfees_objects.id_fee_main
    LEFT JOIN dfees_main AS mf2 ON mf2.id = NEW.id_fee_main
  WHERE
    dfees_objects.id != NEW.id
    AND dfees_objects.object_id = NEW.object_id
    AND dfees_main.fee_type = mf2.fee_type
    AND daterange (
      dfees_objects.period_start,
      dfees_objects.period_end
    ) && daterange (NEW.period_start, NEW.period_end)
  LIMIT 1
) THEN RAISE EXCEPTION USING MESSAGE = 'There is a fees schedule overlaping a new one for portfolio id ' || NEW.object_id;

END IF;

RETURN NEW;

END
$BODY$;

ALTER FUNCTION public.trg_f_fees_objects_create_new_link()
    OWNER TO postgres;
