const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});

async function fGetStrategiesList (request,response) {
  console.log('request.query',request.query);
  const query = {text: 'SELECT id, sname as Name, s_level_id as Level, s_description as Description, s_benchmark_account, dportfolios.portfolioname as "Benchmark Account"' +
	' FROM public.dstrategiesglobal LEFT JOIN public.dportfolios ' + 
  ' ON dportfolios.idportfolio = dstrategiesglobal.s_benchmark_account'}
  switch (request.query.action) {
    case 'Check_clientname':
      query.text += ' WHERE ((clientname) = $1) AND ((idclient) != $2);'
      query.values = [request.query.clientname, request.query.client]
    break;
    case 'Get_Client_Data':
      query.text += ' WHERE (idclient= $1);'
      query.values = [request.query.client]
    break;
    default:
      query.text += ';'
    break;
  }
  console.log('query',query);
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    console.log('res.rows',res.rows);
    return response.status(200).json((res.rows))}
  })
}

module.exports = {
  fGetStrategiesList
}