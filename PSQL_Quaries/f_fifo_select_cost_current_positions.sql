-- FUNCTION: public.f_fifo_select_current_positions_for_trade(numeric, text)

DROP FUNCTION IF EXISTS public.f_fifo_select_cost_current_positions(date, bigint[]);

CREATE OR REPLACE FUNCTION public.f_fifo_select_cost_current_positions(
	p_report_date date,
	p_idportfolios bigint[]
)
RETURNS TABLE(
	idportfolio numeric, 
	secid char varying,
	"position" numeric,
	cost_in_position numeric,
	pl numeric
 ) 
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
ROWS 1000

AS $BODY$
BEGIN
RETURN query
WITH pl_data AS (
	SELECT
	   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
	  SUM(profit_loss) AS pl
	FROM
	  dtrades_allocated_fifo
	  LEFT JOIN dtrades_allocated ON dtrades_allocated.id = dtrades_allocated_fifo.idtrade
	GROUP BY
	  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
),
position_cost_data AS (
SELECT
  positions.idportfolio,
  positions.secid,
  SUM(rest) AS POSITION,
  ROUND(SUM(cost_in),2) AS cost_in_position
FROM
  (
    SELECT DISTINCT
      ON (idtrade) idtrade,
      dtrades_allocated_fifo.idportfolio,
	  dtrades_allocated_fifo.secid,
      dtrades_allocated_fifo.qty,
      dtrades_allocated_fifo.qty_out,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out)*dtrades_allocated_fifo.tr_type AS rest,
      (dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out)*dtrades_allocated_fifo.tr_type*dtrades_allocated_fifo.price_in AS cost_in
	  
    FROM
      public.dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.out_date <= p_report_date
      AND 
	  id_buy_trade = 0
--       AND dtrades_allocated_fifo.idportfolio = 2
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out
  ) AS positions
WHERE
  rest != 0
GROUP BY
  positions.idportfolio,positions.secid
)
SELECT 
COALESCE(  position_cost_data.idportfolio,pl_data.idportfolio) AS idportfolio,
COALESCE(  position_cost_data.secid,pl_data.secid) AS secid,
position_cost_data.position,
position_cost_data.cost_in_position,
pl_data.pl
FROM position_cost_data
FULL JOIN pl_data ON pl_data.secid=position_cost_data.secid AND pl_data.idportfolio=position_cost_data.idportfolio;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_cost_current_positions(date,bigint[])
    OWNER TO postgres;
