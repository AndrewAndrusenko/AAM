SELECT idtrade, qty, price, tdate, vdate, tidorder, allocatedqty, idportfolio, trtype, tidinstrument, id_broker, id_price_currency, id_settlement_currency, id_buyer_instructions, id_seller_instructions, accured_interest, fee_trade, fee_settlement, fee_exchange, price_type, id_cpty, details, trade_amount, settlement_amount, settlement_rate
	FROM public.dtrades;