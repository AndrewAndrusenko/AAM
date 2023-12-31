WITH
  fees_set AS (
    SELECT
      id,
      id_b_entry
    FROM
      public.dfees_transactions
    WHERE
      dfees_transactions.id = ANY (p_fees_id)
      AND id_b_entry NOTNULL
  ),
  fees_with_empty_ref AS (
    SELECT
      *
    FROM
      fees_set
      LEFT JOIN (
        SELECT
          id AS id_entry
        FROM
          "bAccountTransaction"
        WHERE
          id = ANY (SELECT id_b_entry FROM fees_set)
      ) AS entries ON entries.id_entry = fees_set.id_b_entry
    WHERE
      id_entry ISNULL
  )
UPDATE dfees_transactions
SET
  id_b_entry = NULL
WHERE
  id = ANY (SELECT id FROM fees_with_empty_ref);