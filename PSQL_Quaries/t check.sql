 SELECT * FROM f_i_portfolios_balances_by_account_for_idportfolios (ARRAY[23],now()::date);
--  select * from f_a_b_positions_current_turnovers_not_closed_by_date(ARRAY[29],now()::Date)
select * from f_i_model_portfolios_select_mp_structure_for_accounts (ARRAY[23])