SELECT corrected_qty,1,id_portfolio,id,parent_order 
FROM f_i_allocation_orders(50,ARRAY[412])  WHERE corrected_qty!=0
