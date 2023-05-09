iNSERT INTO public.mmoexinstrumentdetails 
(secid, boardid, shortname, lotsize, facevalue, status, boardname, decimals, matdate, secname, couponperiod, issuesize, remarks, marketcode, instrid, sectorid, minstep, faceunit, isin, latname, regnumber, currencyid, sectype, listlevel, issuesizeplaced, couponpercent, lotvalue, nextcoupon) 
VALUES ('SU26212RMFS9','TQDB','OFZ-PD 26212','1','2','A','Dark pool: bonds - order-driven','4','2028-01-19 00:00:00','OFZ-PD 26212',null,'358927588',null,'FNDT','GOFZ',null,'0.001','SUR','RU000A0JTK38','OFZ-PD 26212','26212RMFS','SUR','3','1','350000000',null,'1000',null) 
ON CONFLICT ON CONSTRAINT c_uniquesecid_boardid
DO UPDATE SET  

boardid='TQDB', shortname='OFZ-PD 26212', lotsize='1', facevalue='2', status='A', boardname='Dark pool: bonds - order-driven', decimals='4', matdate='2028-01-19 00:00:00', secname='OFZ-PD 26212', couponperiod=null, issuesize='358927588', remarks=null, marketcode='FNDT', instrid='GOFZ', sectorid=null, minstep='0.001', faceunit='SUR', isin='RU000A0JTK38', latname='OFZ-PD 26212', regnumber='26212RMFS', currencyid='SUR', sectype='3', listlevel='1', issuesizeplaced='350000000', couponpercent=null, lotvalue='1000', nextcoupon=null 
WHERE mmoexinstrumentdetails.secid='SU26212RMFS9' and mmoexinstrumentdetails.boardid='TQDB' RETURNING *;