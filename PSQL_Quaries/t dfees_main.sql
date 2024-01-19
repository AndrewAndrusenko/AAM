SELECT ft."typeDescription" as fee_type_desc,fee_type,
ot."typeDescription" as fee_object_desc,fee_object_type,

fee_code, fee_description, id_fee_period, dfees_main.id
	FROM public.dfees_main
	left join "dGeneralTypes" as ft ON ft."typeCode"='fee_type' and dfees_main.fee_type=ft."typeValue"::int
	left join "dGeneralTypes" as ot ON ot."typeCode"='fee_object_type' and dfees_main.fee_object_type=ot."typeValue"::int	