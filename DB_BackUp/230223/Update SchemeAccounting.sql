UPDATE public."bcSchemeAccountTransaction"
SET
 "accountNo"='${pAccountNo}', 
 "entryDetails"='Incoming payment ${pSenderBIC:raw} to with ref: ${pRef:raw}  ', 
 "cSchemeGroupId"='DP_CR_NOSTRO'
 where id =1 