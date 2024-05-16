SELECT *
-- tp.id, transaction_type_id,tt.description, tt."xActTypeCode_Ext",tp.role,tt.code2,
-- tt.*,tp.*
	FROM public."bcTransactionType_Ext_Privileges" tp
-- 	LEFT JOIN public."bcTransactionType_Ext" tt 
-- 	ON tp.transaction_type_id=tt.id
-- 	ORDER BY tp.role, tt."xActTypeCode_Ext"

	