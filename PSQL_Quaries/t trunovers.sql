SELECT
  "bAccounts"."accountId",
  "bAccounts"."accountNo",
  SUM(
    CASE (
        "bAccountTransaction"."XactTypeCode" + "bcAccountType_Ext"."xActTypeCode"
      )
      WHEN 3 THEN "amountTransaction"
      ELSE "amountTransaction" * -1
    END
  ) AS sign_amount
FROM
  "bAccountTransaction"
  LEFT JOIN "bAccounts" ON "bAccounts"."accountId" = "bAccountTransaction"."accountId"
  LEFT JOIN "bcAccountType_Ext" ON "bcAccountType_Ext"."accountType_Ext" = "bAccounts"."accountTypeExt"
WHERE
  "dataTime" > (
    SELECT
      "FirstOpenedDate"
    FROM
      "gAppMainParams"
  )
GROUP BY
  "bAccounts"."accountId"