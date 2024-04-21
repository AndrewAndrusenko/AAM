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

module.exports = {
  dbConfig,
  dbConfig_aam_middile_officer
}