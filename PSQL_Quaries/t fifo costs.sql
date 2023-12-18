WITH 
 profit_loss_data_set AS (
	SELECT out_date::date,
	   dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,
	  SUM(profit_loss) OVER (
		  PARTITION BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid
		  ORDER BY  dtrades_allocated_fifo.idportfolio,dtrades_allocated_fifo.secid,out_date::date asc
		  ROWS BETWEEN UNBOUNDED PRECEDING
		  AND CURRENT ROW) AS PL
	FROM
	  dtrades_allocated_fifo
	WHERE
	  dtrades_allocated_fifo.out_date <= now()
	  AND profit_loss NOTNULL
 ), fifo_changed_dates AS (
	SELECT 
		out_date,
		dtrades_allocated_fifo.idportfolio,
		dtrades_allocated_fifo.secid
	FROM public.dtrades_allocated_fifo 
	 WHERE
		dtrades_allocated_fifo.out_date <= now()
		AND id_buy_trade = 0
		AND dtrades_allocated_fifo.idportfolio = ANY (array(select idportfolio from dportfolios))
	GROUP BY 
		dtrades_allocated_fifo.out_date,
		dtrades_allocated_fifo.idportfolio,
		dtrades_allocated_fifo.secid
 ), costs_full_set AS (
	SELECT 
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date,
		SUM(rest) as rest,
		SUM(cost_in) AS cost_in,
		SUM(qty) AS qty,
		SUM(qty_out) AS qty_out
	FROM fifo_changed_dates  AS af_main
	LEFT JOIN LATERAL (
		SELECT
			DISTINCT  ON (idtrade) 
			idtrade,
			dtrades_allocated_fifo.idportfolio,
			dtrades_allocated_fifo.profit_loss,
			dtrades_allocated_fifo.secid,
			dtrades_allocated_fifo.qty,
			dtrades_allocated_fifo.qty_out,
			(dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type AS rest,
			(dtrades_allocated_fifo.qty - dtrades_allocated_fifo.qty_out) * dtrades_allocated_fifo.tr_type * dtrades_allocated_fifo.price_in AS cost_in
		FROM
		  public.dtrades_allocated_fifo
		WHERE
		  dtrades_allocated_fifo.out_date <= af_main.out_date
		  AND id_buy_trade = 0
		  AND dtrades_allocated_fifo.idportfolio = af_main.idportfolio
		  AND dtrades_allocated_fifo.secid = af_main.secid
		ORDER BY
		  idtrade,
		  dtrades_allocated_fifo.trade_date,
		  qty - qty_out
	) AS af_joined ON TRUE
	GROUP BY 
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date
	ORDER BY
		af_main.idportfolio,
		af_main.secid,
		af_main.out_date
)
SELECT 
	costs_full_set.idportfolio,
	costs_full_set.secid,
	costs_full_set.out_date AS fifo_change_date,
	costs_full_set.rest AS current_fifo_position_qty,
	ROUND(costs_full_set.cost_in,2) AS current_fifo_position_cost,
	COALESCE(pl_joined.pl,0) as profit_loss
FROM costs_full_set 
LEFT JOIN LATERAL (
	SELECT 
		profit_loss_data_set.out_date::date, 
		profit_loss_data_set.idportfolio, 
		profit_loss_data_set.secid, 
		profit_loss_data_set.pl
	FROM profit_loss_data_set
	WHERE 		
		profit_loss_data_set.idportfolio = costs_full_set.idportfolio
		AND profit_loss_data_set.secid = costs_full_set.secid
	    AND profit_loss_data_set.out_date<=costs_full_set.out_date
	ORDER BY profit_loss_data_set.out_date desc, profit_loss_data_set.pl desc
	LIMIT 1
) AS pl_joined ON TRUE