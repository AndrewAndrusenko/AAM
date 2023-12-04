-- FUNCTION: public.trg_b_close_period_check()

-- DROP FUNCTION IF EXISTS public.trg_b_close_period_check();

CREATE OR REPLACE FUNCTION public.trg_b_close_period_check()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE NOT LEAKPROOF
AS $BODY$
DECLARE
first_opened_date date;
BEGIN
SELECT "FirstOpenedDate" FROM public."gAppMainParams" LIMIT 1 INTO first_opened_date;
   IF (NEW."dataTime"<first_opened_date) OR (OLD."dataTime"<first_opened_date) THEN
      RAISE EXCEPTION 'Date is in closed period.Entry has been blocked';
   END IF;
   RETURN NEW;
END
$BODY$;

ALTER FUNCTION public.trg_b_close_period_check()
    OWNER TO postgres;
