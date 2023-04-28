SELECT mmoexsecurities.id, secid, security_type_title, stock_type, security_type_name, shortname, mmoexbondscorpactions.date,mmoexbondscorpactions.couponrate, primary_boardid, board_title,
mmoexboardgroups.title,mmoexboardgroups.category, mmoexsecurities.name, mmoexsecurities.isin, emitent_title, emitent_inn, type, "group", marketprice_boardid
	FROM public.mmoexsecurities
	LEFT JOIN mmoexsecuritytypes ON mmoexsecurities.type=mmoexsecuritytypes.security_type_name
	LEFT JOIN mmoexboards ON mmoexboards.boardid = mmoexsecurities.primary_boardid
	LEFT JOIN mmoexboardgroups ON mmoexboardgroups.board_group_id = mmoexboards.board_group_id
	LEFT JOIN mmoexbondscorpactions ON mmoexbondscorpactions.isin = mmoexsecurities.secid
	where stock_type='3' and shortname='RUS-30'