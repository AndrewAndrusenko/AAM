select count (statements.id),statements."dateAcc" from (
select "bAccountStatement".id,"bAccountStatement"."dateAcc" from "bAccountStatement"
UNION
select "bLedgerStatement".id,"bLedgerStatement"."dateAcc" FROM "bLedgerStatement") as statements
group by statements."dateAcc"
order by statements."dateAcc" desc
