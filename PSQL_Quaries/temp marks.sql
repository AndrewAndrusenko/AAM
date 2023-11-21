SELECT distinct 
SUM(COALESCE(t2.close,1)*"OutGoingBalance") AS MTM,
"accountNo","dateBalance","OutGoingBalance", f_a_b_balancesheet_total_closed_and_notclosed.secid,t2.close, t2.tradedate, t2.secid 
 FROM public.f_a_b_balancesheet_total_closed_and_notclosed()
 LEFT   JOIN LATERAL (
   SELECT tradedate,close,secid
   FROM   t_moexdata_foreignshares
   WHERE  
		secid = f_a_b_balancesheet_total_closed_and_notclosed.secid
-- 	 AND    tradedate >'2023-09-05 00:00:00'
		AND    tradedate   < "dateBalance"
		AND close notnull
   ORDER  BY tradedate DESC
   LIMIT  1
   ) t2 ON TRUE
WHERE portfolioname='ACM002'
   
   group by
grouping sets ((
"accountNo","dateBalance","OutGoingBalance", f_a_b_balancesheet_total_closed_and_notclosed.secid,t2.close, t2.tradedate, t2.secid ),
			   ("dateBalance"))
--     AND    "dateBalance" >'09/01/2023'::date
order by "dateBalance" desc;
