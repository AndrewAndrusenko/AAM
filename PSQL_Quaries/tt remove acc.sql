with fees_set as (
	select id,id_b_entry from
  public.dfees_transactions 
-- SET
--   id_b_entry=p_entry_id
WHERE dfees_transactions.id = ANY(array[5824,5825,5823])
), 
fees_with_empty_ref as (
select * from fees_set
left join (
select id as id_entry from "bAccountTransaction" where id = ANY(select id_b_entry from fees_set)
) as ttt on ttt.id_entry=fees_set.id_b_entry
where 	id_entry isnull
)
update dfees_transactions
set id_b_entry = null
where id = ANY (select id from fees_with_empty_ref) returning *
;