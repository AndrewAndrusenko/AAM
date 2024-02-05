-- FUNCTION: public.f_fifo_get_cost_detailed_data(date, character varying[], character varying[])

DROP FUNCTION IF EXISTS public.f_i_h_get_dstrategies_global_structure_history(date, int, character varying,int);

CREATE OR REPLACE FUNCTION public.f_i_h_get_dstrategies_global_structure_history(
	p_report_date date,
	p_id_strategy_parent int,
	p_id_strategy_child character varying,
	p_id_strategy_child_integer int)
    RETURNS TABLE(
		id bigint,
		id_strategy_parent int,
		weight_of_child numeric,
		id_strategy_child char varying,
		id_strategy_child_integer int,
		"user" numeric,
		login text,
		accessrole text,
		tr_date timestamp without time zone,
		"type" smallint,
		type_trans text
	)	
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT
  stt.id,
  stt.id_strategy_parent,
  stt.weight_of_child,
  stt.id_strategy_child,
  stt.id_strategy_child_integer,
  stt."user",
  dusers.login,
  dusers.accessrole,
  stt.tr_date,
  stt."type",
  CASE
    WHEN stt."type" = 1 THEN 'New'
    WHEN stt."type" = 2 THEN 'Old'
    WHEN stt."type" = 3 THEN 'Delete'
  END AS type_trans
FROM
  public.dstrategies_global_structure_history stt
  LEFT JOIN dusers ON stt."user" = dusers.id
WHERE
	(p_report_date ISNULL OR stt.tr_date <= p_report_date) 
	AND (p_id_strategy_parent ISNULL OR (stt.id_strategy_parent = p_id_strategy_parent))
	AND (p_id_strategy_child ISNULL OR (stt.id_strategy_child = p_id_strategy_child))
	AND (p_id_strategy_child_integer ISNULL OR (stt.id_strategy_child_integer = p_id_strategy_child_integer))
ORDER BY
  stt.tr_date DESC,
  stt."type" DESC;
END
$BODY$;

ALTER FUNCTION public.f_i_h_get_dstrategies_global_structure_history(date,int, character varying, int)
    OWNER TO postgres;
select * from f_i_h_get_dstrategies_global_structure_history(null,null,null,null)