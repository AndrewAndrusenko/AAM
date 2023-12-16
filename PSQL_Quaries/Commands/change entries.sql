select "bAccountTransaction".* from "bAccountTransaction"
left join "bAccounts" using("accountId")
where (idportfolio=33 and "XactTypeCode"=2)
or id=13303
order by "dataTime" asc