INSERT INTO PUBLIC."bAccounts"("accountNo",
								"accountTypeExt",
								"Information",
								"clientId",
								"currencyCode",
								"entityTypeCode",
								idportfolio,
								"dateOpening",
								secid)
	(SELECT "accountNo" || '_' || 'SU26223RMFS6' AS "accountNo",
			15 AS "accountTypeExt",
			'Depo account for ' || 'SU26223RMFS6' AS "Information",
			"clientId",
			"currencyCode",
			"entityTypeCode",
			idportfolio,
			NOW()::TIMESTAMP WITHOUT TIME ZONE AS "dateOpening",
			'SU26223RMFS6' AS SECID
		FROM "bAccounts"
		WHERE "accountTypeExt" = 13
			AND idportfolio = ANY(ARRAY[2,7])
			AND secid ISNULL)