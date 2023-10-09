SELECT
  dportfolios.idportfolio,
  "bAccounts"."accountNo",
  dportfolios.portfolioname,
  CASE
    WHEN "bAccounts".secid NOTNULL THEN "bAccounts".secid
    ELSE "bAccounts"."currencyCode"::TEXT
  END AS "instrument",
    CASE
    WHEN "bAccounts".secid NOTNULL THEN 'investment'
    ELSE 'money'
  END AS "positon_type",
  "bAccountStatement"."dateAcc" AS last_closed_day_with_transactions,
  turnovers.signed_turnover,
  COALESCE("bAccountStatement"."closingBalance", 0) AS last_closed_balance,
  COALESCE(turnovers.signed_turnover, 0) + COALESCE("bAccountStatement"."closingBalance", 0) AS current_balance
FROM
  "bAccounts"
  LEFT JOIN (
    SELECT DISTINCT
      ON ("accountId") "accountId",
      "closingBalance",
      "dateAcc"
    FROM
      "bAccountStatement"
    ORDER BY
      "accountId",
      "dateAcc" DESC
  ) "bAccountStatement" ON "bAccounts"."accountId" = "bAccountStatement"."accountId"
  LEFT JOIN dportfolios ON dportfolios.idportfolio = "bAccounts".idportfolio
  LEFT JOIN (
    SELECT * FROM f_a_b_positions_current_turnovers_not_closed_by_date (NOW()::date)
  ) AS turnovers ON turnovers."accountId" = "bAccounts"."accountId"
WHERE
  "bAccounts"."accountTypeExt" != 13
  AND "dportfolios".idportfolio = ANY (p_idportfolios)
