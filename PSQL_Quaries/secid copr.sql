SELECT mmoexsecuritygroups.id,security_group_name, mmoexsecurities.type,mmoexsecuritytypes.security_type_name , mmoexcorpactions.secid,mmoexcorpactions.isin, issuevolume, secname, notinal, notinalcurrency, unredemeedvalue,
couponrate, couponamount, actiontype, couponamountrur, to_date(date,'DD.MM.YYYY')::timestamp without time zone as date, 
0 as action FROM public.mmoexcorpactions 
LEFT JOIN mmoexsecurities ON mmoexsecurities.secid=mmoexcorpactions.secid 

LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name 
LEFT JOIN mmoexsecuritygroups ON mmoexsecuritygroups.name=mmoexsecuritytypes.security_group_name 
