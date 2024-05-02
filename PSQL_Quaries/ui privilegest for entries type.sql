SELECT 
tp.*
-- ,tt.*
	FROM public."bcTransactionType_Ext_Privileges" tp
-- 	LEFT JOIN public."bcTransactionType_Ext" tt 
-- 	ON tp.transaction_type_id=tt.id
	where role='aam_back_officer'

	