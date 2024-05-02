SELECT tt.*, tp.role
FROM public."bcTransactionType_Ext" tt
LEFT JOIN 
(SELECT * FROM public."bcTransactionType_Ext_Privileges" WHERE role='aam_back_officer')tp ON tp.transaction_type_id=tt.id
order by tt.id 
