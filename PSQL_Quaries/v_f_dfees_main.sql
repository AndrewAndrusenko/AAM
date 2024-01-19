-- View: public.entriesAllocated

-- DROP VIEW public."v_f_dfees_main";

CREATE OR REPLACE VIEW public."v_f_dfees_main"
 AS
SELECT
  dfees_main.id,
  fee_code,
  ft."typeDescription" AS fee_type_desc,
  ot."typeDescription" AS fee_object_desc,
  fee_description,
  pt."typeDescription" AS period_desc,
  fee_type,
  fee_object_type,
  id_fee_period
FROM
  public.dfees_main
  LEFT JOIN "dGeneralTypes" AS ft ON ft."typeCode" = 'fee_type'
  AND dfees_main.fee_type = ft."typeValue"::INT
  LEFT JOIN "dGeneralTypes" AS ot ON ot."typeCode" = 'fee_object_type'
  AND dfees_main.fee_object_type = ot."typeValue"::INT
  LEFT JOIN "dGeneralTypes" AS pt ON pt."typeCode" = 'id_fee_period'
  AND dfees_main.id_fee_period = ot."typeValue"::INT

ALTER TABLE public."v_f_dfees_main"
    OWNER TO postgres;

