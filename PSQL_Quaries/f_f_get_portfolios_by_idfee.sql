-- FUNCTION: public.f_f_get_portfolios_with_schedules(numeric)

-- DROP FUNCTION IF EXISTS public.f_f_get_portfolios_by_idfee(numeric);

CREATE OR REPLACE FUNCTION public.f_f_get_portfolios_by_idfee(p_id_fee_main numeric)
    RETURNS TABLE(  
		idportfolio int,
		idclient numeric,
		idstategy int,
		stategy_name char varying,
		description char varying,
		portfolioname  char varying) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  dportfolios.idportfolio,
  dportfolios.idclient,
  dportfolios.idstategy,
  dstrategiesglobal.sname AS stategy_name,
  dstrategiesglobal.s_description AS description,
  dportfolios.portfolioname
FROM
  dportfolios
  LEFT JOIN public.dstrategiesglobal ON dportfolios.idstategy = public.dstrategiesglobal.id
  LEFT JOIN public.dclients ON dportfolios.idclient = public.dclients.idclient
  LEFT JOIN dfees_objects ON dportfolios.idportfolio = dfees_objects.object_id
WHERE
  (p_id_fee_main ISNULL OR  dfees_objects.id_fee_main = p_id_fee_main) AND dfees_objects.period_end>=NOW()
ORDER BY dportfolios.portfolioname;
END;
$BODY$;

ALTER FUNCTION public.f_f_get_portfolios_by_idfee(numeric)
    OWNER TO postgres;
select * from f_f_get_portfolios_by_idfee(8)