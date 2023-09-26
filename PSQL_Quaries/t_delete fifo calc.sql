WITH deleted_fifo as 
	(DELETE FROM dtrades_allocated_fifo WHERE idtrade = ANY(ARRAY[557 ]) RETURNING *) 
UPDATE dtrades_allocated_fifo fifo 
	SET 
	qty_out=fifo.qty_out-deleted_grouped_by_trade.qty_out,
	closed = CASE WHEN fifo.qty=fifo.qty_out-deleted_grouped_by_trade.qty_out THEN true ELSE false END
FROM 
dtrades_allocated_fifo fifo1
INNER JOIN (select id_buy_trade, sum(qty_out) as qty_out  FROM deleted_fifo group by id_buy_trade) deleted_grouped_by_trade 
ON deleted_grouped_by_trade.id_buy_trade=fifo1.idtrade
WHERE fifo.id=fifo1.id 
RETURNING *