-- FUNCTION: public.f_i_h_get_dportfolios_history(date, integer, character varying, integer)

-- DROP FUNCTION IF EXISTS public.f_i_h_get_dportfolios_history(numeric[], intereger, character varying, daterange);

CREATE OR REPLACE FUNCTION public.f_i_h_get_dportfolios_history(
	p_type numeric[],
	p_idportfolio integer,
	p_user_id character varying,
	p_tr_date daterange)
    RETURNS TABLE(
		id bigint,
		idportfolio bigint, idclient bigint, idstategy bigint, portfolioname char varying, portleverage numeric,
		"user" numeric, login text, accessrole text, tr_date timestamp without time zone, type smallint, type_trans text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
-- SELECT idportfolio, idclient, idstategy, portfolioname, portleverage, "user", tr_date, type, id
-- 	FROM public.dportfolios_history
-- 	order by id desc
AS $BODY$
BEGIN
RETURN QUERY
SELECT
	idportfolio, idclient, idstategy, portfolioname, portleverage,
  stt."user",
  dusers.login,
  dusers.accessrole,
  stt.tr_date,
  stt."type",
  CASE
    WHEN stt."type" = 1 THEN 'New'
    WHEN stt."type" = 2 THEN 'Old'
    WHEN stt."type" = 3 THEN 'Delete'
  END AS type_trans,
     dclients.isin, 
   mmoexsecurities.name as sec_name
FROM
  public.dportfolios_history stt
  LEFT JOIN dusers ON stt."user" = dusers.id
  LEFT JOIN dclients ON dclients.idclient = stt.idclient 
  LEFT JOIN dclients ON dclients.idclient = stt.idclient 
  
WHERE
	(p_report_date ISNULL OR stt.tr_date <= p_report_date) 
	AND (p_id_strategy_parent ISNULL OR (stt.id_strategy_parent = p_id_strategy_parent))
	AND (p_id_strategy_child ISNULL OR (stt.id_strategy_child = p_id_strategy_child))
	AND (p_id_strategy_child_integer ISNULL OR (stt.id_strategy_child_integer = p_id_strategy_child_integer))
ORDER BY
  stt.tr_date DESC,
  stt."type";
END
$BODY$;

ALTER FUNCTION public.f_i_h_get_dstrategies_global_structure_history(date, integer, character varying, integer)
    OWNER TO postgres;
