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
    case 'Check_Name':
      request.query.id = (request.query.id == '') ? 0 : request.query.id 
      query.text += ' WHERE ((sname) = $1) AND ((id) != $2);'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text += ' WHERE (id= $1);'
      query.values = [request.query.id]
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

async function fGetStrategyStructure (request,response) {
  console.log('request.query',request.query);
  const query = {text: 'SELECT '+
    ' id_strategy_parent, id_strategy_child as id, dstrategiesglobal.sname, dstrategiesglobal.s_description as description,  ' + 
    ' weight_of_child ' + 
    ' FROM public.dstrategies_global_structure LEFT JOIN	dstrategiesglobal ' +
    ' ON dstrategiesglobal.id = dstrategies_global_structure.id_strategy_child	' +
    ' WHERE id_strategy_parent = $1'}
    query.values = [request.query.id] 
  switch (request.query.action) {
    case 'Check_Name':
      query.text += ' WHERE ((sname) = $1) AND ((id) != $2);'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text += ' WHERE (id= $1);'
      query.values = [request.query.id]
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

async function fEditStrategyData (request, response) {
  paramArr = request.body.data
  console.log('paramArr',paramArr );
  const query = {
  text: 'UPDATE public.dstrategiesglobal ' +
	'SET  ' +
   'sname=${name}, ' +
   's_level_id=${level}, '+
   's_description=${description}, '+
   's_benchmark_account=${s_benchmark_account} ' +
	 'WHERE id=${id};',
    values: paramArr
  } 

  sql = pgp.as.format(query.text,query.values)
  console.log('sql', sql);
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack

    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

module.exports = {
  fGetStrategiesList,
  fEditStrategyData,
  fGetStrategyStructure
}