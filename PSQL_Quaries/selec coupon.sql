SELECT couponrate,actiontype,currency, date
FROM public.mmoexcorpactions where secid='RU000A0JXTS9' and 
date < (select min(date) FROM public.mmoexcorpactions where date > '2023/06/23' and secid='RU000A0JXTS9')
order by date desc LIMIT 2