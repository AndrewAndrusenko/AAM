select string_agg(quote_ident(key) || ' ' ||  (value->>'type')::regtype, ', ') as cols from json_each(
		'{
		"id": {"type": "numeric"},
		"trade_engine_id": {"type": "numeric"},
		"trade_engine_name": {"type": "text", "bytes": 45, "max_size": 0},
		"trade_engine_title": {"type": "text", "bytes": 765, "max_size": 0},
		"market_name": {"type": "text", "bytes": 45, "max_size": 0},
		"market_title": {"type": "text", "bytes": 765, "max_size": 0},
		"market_id": {"type": "numeric"},
		"marketplace": {"type": "text", "bytes": 48, "max_size": 0},
		"is_otc": {"type": "numeric"},
		"has_history_files": {"type": "numeric"},
		"has_history_trades_files": {"type": "numeric"},
		"has_trades": {"type": "numeric"},
		"has_history": {"type": "numeric"},
		"has_candles": {"type": "numeric"},
		"has_orderbook": {"type": "numeric"},
		"has_tradingsession": {"type": "numeric"},
		"has_extra_yields": {"type": "numeric"},
		"has_delay": {"type": "numeric"}
	}'
)