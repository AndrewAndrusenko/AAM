SELECT "dateBalance","accountNo",sum("OutGoingBalance")::money from public.f_a_b_balancesheet_total_closed_and_notclosed()
where portfolioname='ACM002' 
group by
grouping sets (("dateBalance","accountNo","OutGoingBalance"),("dateBalance"))
order by "dateBalance" desc