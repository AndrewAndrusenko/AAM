Update public.mmoexsecurities
set facevalue = t1.unredemeedvalue, faceunit=t1.currency
from (
	SELECT DISTINCT ON (mmoexcorpactions.secid) mmoexcorpactions.secid, date, mmoexcorpactions.unredemeedvalue, mmoexcorpactions.currency
	FROM public.mmoexsecurities
	left join mmoexcorpactions on mmoexcorpactions.secid = mmoexsecurities.secid
	where faceunit is null and "type" = any(ARRAY['exchange_bond','subfederal_bond','corporate_bond','ofz_bond'])
	order by mmoexcorpactions.secid, date desc
   ) as t1
where mmoexsecurities.secid=t1.secid