const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  database: 'AAM_DB',
  password: "5236",
  port: 5432,
  parseJSON:true
}
const dbConfig_aam_middile_officer = {
  user: 'aam_middile_officer',
  host: 'localhost',
  database: 'AAM_DB',
  password: "aam_middile_officer",
  port: 5432,
  parseJSON:true
}
const dbConfig_aam_back_officer = {
  user: 'aam_back_officer',
  host: 'localhost',
  database: 'AAM_DB',
  password: "aam_back_officer",
  port: 5432,
  parseJSON:true
}
const dbConfig_aam_portfolio_manager = {
  user: 'aam_portfolio_manager',
  host: 'localhost',
  database: 'AAM_DB',
  password: "aam_portfolio_manager",
  port: 5432,
  parseJSON:true
}
const dbConfig_aam_trader = {
  user: 'aam_trader',
  host: 'localhost',
  database: 'AAM_DB',
  password: "aam_trader",
  port: 5432,
  parseJSON:true
}
const dbConfig_aam_accountant = {
  user: 'aam_accountant',
  host: 'localhost',
  database: 'AAM_DB',
  password: "aam_accountant",
  port: 5432,
  parseJSON:true
}

module.exports = {
  dbConfig,
  dbConfig_aam_middile_officer,
  dbConfig_aam_back_officer,
  dbConfig_aam_portfolio_manager,
  dbConfig_aam_accountant,
  dbConfig_aam_trader
}