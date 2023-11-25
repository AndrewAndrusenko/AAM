select distinct sec_list.secid, now()::date, last_quotes.close from dorders as sec_list
  LEFT JOIN LATERAL (
  SELECT t_moexdata_foreignshares.secid,t_moexdata_foreignshares.tradedate,close
    FROM
      t_moexdata_foreignshares
    WHERE
      t_moexdata_foreignshares.tradedate::date <= now()::date
      AND t_moexdata_foreignshares.secid = sec_list.secid
      AND t_moexdata_foreignshares.close NOTNULL
	     ORDER  BY tradedate DESC
   LIMIT  1
  ) last_quotes ON TRUE
