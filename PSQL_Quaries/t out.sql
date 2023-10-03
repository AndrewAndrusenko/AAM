    SELECT
      f_fifo_select_open_position.trade_date,
      333,
      f_fifo_select_open_position.tr_type,
      f_fifo_select_open_position.qty,
      f_fifo_select_open_position.qty_out,
      f_fifo_select_open_position.price_in,
      f_fifo_select_open_position.price_out,
      f_fifo_select_open_position.idportfolio,
      f_fifo_select_open_position.secid,
      f_fifo_select_open_position.generated,
      f_fifo_select_open_position.profit_loss,
      f_fifo_select_open_position.id_sell_trade,
      f_fifo_select_open_position.idtrade,
	  null as closed
    FROM
      f_fifo_select_open_position (2, 'GOOG-RM', 10, 1, 333,1)
UNION
    SELECT
      f_fifo_select_open_position.trade_date,
      f_fifo_select_open_position.idtrade,
      f_fifo_select_open_position.tr_type*-1,
      f_fifo_select_open_position.qty,
      f_fifo_select_open_position.qty_out,
      f_fifo_select_open_position.price_in,
      f_fifo_select_open_position.price_out,
      f_fifo_select_open_position.idportfolio,
      f_fifo_select_open_position.secid,
      f_fifo_select_open_position.generated,
      f_fifo_select_open_position.profit_loss,
	  f_fifo_select_open_position.id_sell_trade,
      null,
	  false
    FROM
      f_fifo_select_open_position (2, 'GOOG-RM', 10, 1, 333,1)
order by tr_type,trade_date::date desc ,qty asc
