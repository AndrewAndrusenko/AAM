CREATE FUNCTION trg_b_close_period_check()
  RETURNS trigger AS
$func$
BEGIN
   IF (NEW."dataTime")
    < (SELECT "firstOpenedDate" FROM public."gAppMainParams" LIMIT 1) THEN
      RAISE EXCEPTION 'Date is in closed period.Entry has been blocked';
   END IF;
   RETURN NEW;
END
$func$  LANGUAGE plpgsql;