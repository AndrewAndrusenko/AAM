SELECT 1 as set_number, round(order_amount/notnull_npv*100,2) AS deviation_percent,(npv!=0) AS not_zero_npv, * 
FROM f_i_get_portfolios_structure_detailed_data(array['icm011'],'09/30/2023',840) 
UNION
SELECT 2 as set_number, 
0,true,account_currency,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,
fee_amount AS total_pl,
idportfolio,
portfolioname,
CASE
WHEN transaction_type=14 THEN 'Management Fess'
ELSE 'Other Fees'
END
,NULL,NULL,NULL,0,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL
FROM f_i_get_deducted_fees_per_portfolios_on_date(array['ICM011'],'09/30/2023')
WHERE "accountNo" isnull AND transaction_type notnull
ORDER BY set_number,secid,portfolio_code