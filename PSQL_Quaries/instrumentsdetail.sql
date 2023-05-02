SELECT secid, boardid, shortname, lotsize, facevalue, status, boardname, decimals, matdate, secname,  couponperiod, issuesize,  
remarks, marketcode, instrid, sectorid, minstep, faceunit, isin, latname, regnumber, currencyid, sectype, listlevel, issuesizeplaced,  couponpercent, 
lotvalue, nextcoupon
FROM public.mmoexbondsdetails
	UNION
SELECT secid, boardid, shortname, lotsize, facevalue, status, boardname, decimals,'2050-01-01' as matdate, secname, null as couponperiod,issuesize,
remarks, marketcode, instrid, sectorid, minstep,  faceunit,  isin, latname, regnumber, currencyid, sectype, listlevel, null as issuesizeplaced,
null as couponpercent, null as lotvalue, null as nextcoupon
FROM public.mmoexsharesdetails;
	