const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});

async function fGetStrategiesList (request,response) {
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
    case 'Get_ModelPortfolios_List' :
      query.text += ' WHERE (s_level_id = 1);'
    break;
    case 'Get_Strategies_List' :
      query.text += ' WHERE (s_level_id = 2);'
    break;
    case 'Get_AccountTypes_List' :
      query.text = 'SELECT "typeCode", "typeValue", "typeDescription" ' + 
                   'FROM public."dGeneralTypes" '+ 
                   'WHERE ("typeCode" = $1) '
      query.values = ['account_type']
    break;
    default:
      query.text += ';'
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    return response.status(200).json((res.rows))}
  })
}

async function fGetStrategyStructure (request,response) {
  const query = {text: 'SELECT '+
    ' id_strategy_parent, id_strategy_child as id, dstrategiesglobal.sname, dstrategiesglobal.s_description as description,  ' + 
    ' weight_of_child, dstrategies_global_structure.id as id_item ' + 
    ' FROM public.dstrategies_global_structure LEFT JOIN	dstrategiesglobal ' +
    ' ON dstrategiesglobal.id::text = dstrategies_global_structure.id_strategy_child	' +
    ' WHERE id_strategy_parent = $1'}
    query.values = [Number(request.query.id)] 
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
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    return response.status(200).json((res.rows))}
  })
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
	 'WHERE id=${id};',
    values: paramArr
  } 

  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack

    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

async function fStrategyGlobalDataDelete (request, response) {
  const query = {text: 'DELETE FROM public.dstrategiesglobal WHERE id=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}

async function fStrategyGlobalDataCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dstrategiesglobal ' +
        '(sname, s_level_id, s_description, s_benchmark_account)' +
        ' VALUES (${name}, ${level}, ${description}, ${s_benchmark_account}) ;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {return response.status(200).json(res.rowCount)}
  })  
}

async function fStrategyStructureCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dstrategies_global_structure ' +
        '(id_strategy_parent, id_strategy_child, weight_of_child)' +
        ' VALUES (${id_strategy_parent}, ${id}, ${weight_of_child}) ;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {return response.status(200).json(res.rowCount)}
  })  
}

async function fStrategyStructureDelete (request, response) {
  const query = {text: 'DELETE FROM public.dstrategies_global_structure WHERE id=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}

async function fStrategyStructureEdit (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public.dstrategies_global_structure ' +
	'SET  ' +
   'id_strategy_parent=${id_strategy_parent}, ' +
   'id_strategy_child=${id}, '+
   'weight_of_child=${weight_of_child} '+
	 'WHERE id=${id_item};',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
   pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

async function fAccountCreate (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dportfolios ' +
        '(idclient, idstategy, portfolioname, portleverage)' +
        ' VALUES (${idclient}, ${idstategy}, ${portfolioname}, ${portleverage}) ;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)

  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}

async function fAccountDelete (request, response) {
  const query = {text: 'DELETE FROM public.dportfolios WHERE idportfolio=${id};', values: request.body}
  sql = pgp.as.format(query.text,query.values)
  pool.query (sql,  (err, res) => {if (err) { return response.send(err)} else { return response.status(200).json(res.rowCount) }
  }) 
}

async function fAccountEdit (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'UPDATE public.dportfolios ' +
	'SET  ' +
   'idclient=${idclient}, ' +
   'idstategy=${idstategy}, '+
   'portfolioname=${portfolioname} '+
   'portleverage=${portleverage} '+
	 'WHERE idportfolio=${idportfolio};',
    values: paramArr
  } 
  sql = pgp.as.format(query.text,query.values)
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