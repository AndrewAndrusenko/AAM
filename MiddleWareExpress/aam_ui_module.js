const Module = require('module');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);

async function TreeSQLQueryExc (RootNode) {
  pool.QueryArrayConfig = {values: [], rowMode: "array" }
  switch (RootNode) {
    case 'Clients':
      pool.QueryArrayConfig.text='SELECT dclients.clientname from public.dclients '; 
    break;
    case 'Accounts':
      pool.QueryArrayConfig.text='SELECT  dportfolios.portfolioname from public.dportfolios'; 
    break;
    case 'Strategies':
      pool.QueryArrayConfig.text='select dstrategiesglobal.sname from public.dstrategiesglobal'; 
    break; 
  }
  PromQty = new Promise((resolve, reject) => {
    pool.query(pool.QueryArrayConfig, (error,result) => { resolve( [RootNode,result.rows.flat()]) })
  })
  return PromQty;
 }
 
async function FAmmGetAccountsList (request,response) {
  Treelist = ['Clients','Accounts','Strategies'];  
  await Promise.all(
    Treelist.map(RootNode => TreeSQLQueryExc(RootNode))
  ).then((value) => {
    return response.status(200).json(value)
   
  })
}
async function fPutNewFavorite () {
console.log ('fPutNewFavorite')
}
 module.exports = {
  FAmmGetAccountsList,
  fPutNewFavorite
 }