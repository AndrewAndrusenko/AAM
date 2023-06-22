const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});

async function queryExecute (sql, response, responseType) {//General query to postgres execution via pool
  return new Promise ((resolve) => {
    pool.query (sql,  (err, res) => {
      console.log('sql',sql);
      if (err) {
        console.log (err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        resolve (response? response.send(err):err)
      } else {
        console.log('InvestmentModule**********************QTY rows',responseType==='rowCount'? res.rowCount:res.rows.length)
        let result = responseType==='rowCount'? res.rowCount : res.rows;
        resolve (response? response.status(200).json(result):result)
      }
    })
  })
}
async function fGetStrategiesList (request,response) {
  const query = {text: 'SELECT id, sname as Name, s_level_id as Level, s_description as Description, s_benchmark_account, dportfolios.portfolioname as "Benchmark Account"' +
	' FROM public.dstrategiesglobal LEFT JOIN public.dportfolios ' + 
  ' ON dportfolios.idportfolio = dstrategiesglobal.s_benchmark_account'}
  switch (request.query.action) {
    case 'Check_Name':
      request.query.id = (request.query.id == '') ? 0 : request.query.id 
      query.text += ' WHERE UPPER(sname) = UPPER($1) AND id != $2;'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text += ' WHERE (id= $1); '
      query.values = [request.query.id]
    break;
    case 'Get_ModelPortfolios_List' :
      query.text += ' WHERE (s_level_id = 1) ORDER BY sname;'
    break;
    case 'Get_Strategies_List' :
      query.text += ' WHERE (s_level_id = 2) ORDER BY sname;'
    break;
    case 'Get_AccountTypes_List' :
      query.text = 'SELECT "typeCode", "typeValue", "typeDescription" ' + 
                   'FROM public."dGeneralTypes" '+ 
                   'WHERE ("typeCode" = $1) ORDER BY  "typeValue"'
      query.values = ['account_type']
    break;
    default:
      query.text += ' ORDER BY s_level_id, sname ;'
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql, response);
}
async function fGetStrategyStructure (request,response) {
  const query = {text: 'SELECT '+
    ' id_strategy_parent, id_strategy_child as id, dstrategiesglobal.sname, dstrategiesglobal.s_description as description,  ' +
    ' public."aMoexInstruments".isin, public."aMoexInstruments".shortname, '+ 
    ' weight_of_child, dstrategies_global_structure.id as id_item ' + 
    ' FROM public.dstrategies_global_structure LEFT JOIN	dstrategiesglobal ' +
    ' ON dstrategiesglobal.id::text = dstrategies_global_structure.id_strategy_child	' +
    ' LEFT JOIN public."aMoexInstruments"  ' +
    ' ON public."aMoexInstruments".secid = dstrategies_global_structure.id_strategy_child '+
    ' WHERE id_strategy_parent = $1'}
    query.values = [Number(request.query.id)] 
  switch (request.query.action) {
    case 'Check_Name':
      query.text += ' WHERE ((sname) = $1) AND ((id) != $2);'
      query.values = [request.query.Name, request.query.id]
    break;
    case 'Get_Strategy_Data':
      query.text += ' WHERE (id= $1) ORDER BY secid, sname ;'
      query.values = [request.query.id]
    break;
    default:
      query.text += ';'
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql, response);
}
async function fEditStrategyData (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public.dstrategiesglobal ' +
	'SET  ' +
   'sname=${name}, ' +
   's_level_id=${level}, '+
   's_description=${description}, '+
   's_benchmark_account=${s_benchmark_account} ' +
	 'WHERE id=${id} RETURNING *;',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql, response);
}
async function fStrategyGlobalDataDelete (request, response) {
  const query = {text: 'DELETE FROM public.dstrategiesglobal WHERE id=${id} RETURNING *;', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('DELETE--------------------------------------------------------------',sql);
  queryExecute (sql, response);
}
async function fStrategyGlobalDataCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dstrategiesglobal ' +
        '(sname, s_level_id, s_description, s_benchmark_account)' +
        ' VALUES (${name}, ${level}, ${description}, ${s_benchmark_account}) RETURNING *;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql, response);
}
async function fStrategyStructureCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dstrategies_global_structure ' +
        '(id_strategy_parent, id_strategy_child, weight_of_child, id_strategy_child_integer)' +
        ' VALUES (${id_strategy_parent}, ${id}, ${weight_of_child},${id_strategy_child_integer}) RETURNING *;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values);
  queryExecute (sql,response);
}
async function fStrategyStructureDelete (request, response) {
  const query = {text: 'DELETE FROM public.dstrategies_global_structure WHERE id=${id} RETURNING *;', values: request.body}
  sql = pgp.as.format(query.text,query.values);
  queryExecute (sql,response);
}
async function fStrategyStructureEdit (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public.dstrategies_global_structure ' +
	'SET  ' +
   'id_strategy_parent=${id_strategy_parent}, ' +
   'id_strategy_child=${id}, '+
   'weight_of_child=${weight_of_child}, '+
   'id_strategy_child_integer=${id_strategy_child_integer} '+
	 'WHERE id=${id_item} RETURNING *;',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql,response);
}
async function fAccountCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dportfolios ' +
        '(idclient, idstategy, portfolioname, portleverage)' +
        ' VALUES (${idclient}, ${idstategy}, ${portfolioname}, ${portleverage}) RETURNING *;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql,response);
}
async function fAccountDelete (request, response) {
  const query = {text: 'DELETE FROM public.dportfolios WHERE idportfolio=${id} RETURNING *;', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql,response);
}
async function fAccountEdit (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public.dportfolios ' +
	'SET  ' +
   'idclient=${idclient}, ' +
   'idstategy=${idstategy}, '+
   'portfolioname=${portfolioname}, '+
   'portleverage=${portleverage} '+
	 'WHERE idportfolio=${idportfolio} RETURNING *; ',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
  queryExecute (sql,response);
}

module.exports = {
  fGetStrategiesList,
  fEditStrategyData,
  fGetStrategyStructure,
  fStrategyGlobalDataDelete,
  fStrategyGlobalDataCreate,
  fStrategyStructureCreate,
  fStrategyStructureDelete,
  fStrategyStructureEdit,
  fAccountCreate,
  fAccountDelete,
  fAccountEdit
}