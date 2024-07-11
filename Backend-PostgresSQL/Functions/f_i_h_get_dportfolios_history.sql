-- FUNCTION: public.f_i_h_get_dportfolios_history(date, integer, character varying, integer)

DROP FUNCTION IF EXISTS public.f_i_h_get_dportfolios_history(numeric[], integer, char varying, daterange);

CREATE OR REPLACE FUNCTION public.f_i_h_get_dportfolios_history(
	p_type numeric[],
	p_idportfolio integer,
	p_user_id numeric,
	p_tr_date daterange)
    RETURNS TABLE(
		clientname char varying,
		strategy_name char varying,
		id bigint,
		idportfolio integer , idclient numeric, idstategy integer, portfolioname char varying, portleverage numeric,
		"user" numeric, login text, accessrole text, transaction_date timestamp without time zone, type smallint, type_trans text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN QUERY
SELECT 	
	dclients.clientname,
	dstrategiesglobal.sname as strategy_name, history.id,
	history.idportfolio, history.idclient, history.idstategy, history.portfolioname, history.portleverage,
	history."user",
	dusers.login,
	dusers.accessrole,
	history.tr_date as transaction_date,
	history."type",
  CASE
    WHEN history."type" = 1 THEN 'New'
    WHEN history."type" = 2 THEN 'Old'
    WHEN history."type" = 3 THEN 'Delete'
  END AS type_trans
FROM
  public.dportfolios_history history
  LEFT JOIN dusers ON history."user" = dusers.id
  LEFT JOIN dclients ON dclients.idclient = history.idclient 
  LEFT JOIN dstrategiesglobal ON dstrategiesglobal.id = history.idstategy 
  
WHERE
	(p_tr_date ISNULL OR p_tr_date @> history.tr_date::date) 

AND (p_idportfolio ISNULL OR p_idportfolio = history.idportfolio)
	AND (p_type ISNULL OR history.type = ANY(p_type))
	AND (p_user_id ISNULL OR p_user_id = history."user")
ORDER BY
  history.tr_date DESC,
  history."type";
END
$BODY$;

ALTER FUNCTION public.f_i_h_get_dportfolios_history(numeric[], integer, numeric, daterange)
    OWNER TO postgres;
	select * from public.f_i_h_get_dportfolios_history(array[1],null,null,'[03/25/2024,03/25/2024]'::daterange)
