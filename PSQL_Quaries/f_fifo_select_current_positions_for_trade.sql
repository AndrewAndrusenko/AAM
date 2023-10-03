-- FUNCTION: public.f_fifo_select_current_positions_for_trade(text)

DROP FUNCTION IF EXISTS public.f_fifo_select_current_positions_for_trade(numeric);

CREATE OR REPLACE FUNCTION public.f_fifo_select_current_positions_for_trade(
	p_idtrade numeric)
    RETURNS TABLE(idportfolio numeric, "position" numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
RETURN query
SELECT
  positions.idportfolio,
  SUM(rest) AS POSITION
FROM
  (
    SELECT DISTINCT
      ON (idtrade) idtrade,
      dtrades_allocated_fifo.idportfolio,
      qty,
      qty_out,
      qty - qty_out AS rest
    FROM
      public.dtrades_allocated_fifo
    WHERE
      dtrades_allocated_fifo.secid = 'GOOG-RM'
      AND id_buy_trade = 0
      AND dtrades_allocated_fifo.idportfolio = ANY (
        SELECT
          dtrades_allocated_fifo.idportfolio
        FROM
          dtrades_allocated
        WHERE
          idtrade = p_idtrade
      )
    ORDER BY
      idtrade,
      dtrades_allocated_fifo.trade_date,
      qty - qty_out
  ) AS positions
WHERE
  rest > 0
GROUP BY
  positions.idportfolio;
END;
$BODY$;

ALTER FUNCTION public.f_fifo_select_current_positions_for_trade(numeric)
    OWNER TO postgres;
