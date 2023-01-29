const { param } = require('jquery');
const { CONSOLE_APPENDER } = require('karma/lib/constants');
const Module = require('module');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require('pg-promise')({
  capSQL: true // to capitalize all generated SQL
});

async function TreeSQLQueryExc (RootNode, userId, nodeParentFavorite) {
  RootNode = RootNode.split('_')
  console.log('roo',RootNode);
  pool.QueryArrayConfig = {values: [], rowMode: "array" }
  switch (RootNode[0]) {
    case 'Clients':
      pool.QueryArrayConfig.text='SELECT dclients.clientname, dclients.idclient from public.dclients '; 
    break;

    case 'Accounts':
      pool.QueryArrayConfig.text='SELECT  dportfolios.portfolioname, dportfolios.idportfolio from public.dportfolios'; 
    break;

    case 'Strategies':
      pool.QueryArrayConfig.text='select dstrategiesglobal.sname, dstrategiesglobal.id from public.dstrategiesglobal'; 
    break; 

    case 'Instruments':
      pool.QueryArrayConfig.text='SELECT DISTINCT tidinstrument, tidinstrument as id FROM public.dtrades;'
    break;     

    case 'Favorites':
      pool.QueryArrayConfig.values = [userId, RootNode[1]]
      pool.QueryArrayConfig.text="SELECT nodename, idelement FROM public.dtree_menu_favorites " +
      " where (userid= $1) and (nodeparent = $2) "
      pool.QueryArrayConfig.rowMode="array"
    break;     
  }
  RootNode[1] ? RootNode = RootNode.join('_') : RootNode = RootNode[0]

  PromQty = new Promise((resolve, reject) => {
    pool.query(pool.QueryArrayConfig, (error,result) => { 
      console.log('result.rows.flat()',result.rows);
      resolve( 
      [RootNode,result.rows]) })
  }) 
  return PromQty;
 }
 
async function FAmmGetTreeData(request,response) {
  console.log('querty',request.query.paramList);
  /* Treelist = ['Clients','Accounts','Strategies', 'Instruments','Favorites_Clients', 'Favorites_Accounts','Favorites_Strategies','Favorites_Instruments'];   */
  Paramlist = request.query.paramList
  Paramlist.splice (Paramlist.indexOf('Trades & Orders'),1)
  Paramlist.splice (Paramlist.indexOf('Favorites'),1)
  FavoritesList = Paramlist.map (element => 'Favorites_' + element);
  Treelist = [...Paramlist,...FavoritesList]

  console.log('Treelist',Treelist);
  await Promise.all(
    Treelist.map(RootNode => TreeSQLQueryExc(RootNode, request.query.userId,''))
  ).then((value) => {
    value.push (['Favorites',FavoritesList])
    console.log('value',value);

    return response.status(200).json(value)
   
  })
}

async function fGetportfolioTable (request,response) {
  let sql="SELECT "+
  " dportfolios.idportfolio, dportfolios.idclient, dportfolios.idstategy, " + 
  " dstrategiesglobal.sname,dportfolios.portfolioname, dportfolios.portleverage " +
  " FROM public.dportfolios LEFT JOIN public.dstrategiesglobal ON dportfolios.idstategy=public.dstrategiesglobal.id; "
  pool.query ({text : sql}, (err, res) => {
    if (err) {console.log (err.stack) 
    } else {
      return response.status(200).json((res.rows))
    }
  })
}

async function fGetInstrumentData(request,response) {
  console.log(request)
  const query = {
    text: ' SELECT ' +
    ' secid, shortname, name,  isin,  listlevel, facevalue, faceunit,  primary_board_title, ' +
    ' is_qualified_investors,  registryclosedate,  lotsize, price, discountl0, discounth0, fullcovered, ' +
    ' typename, issuesize, is_external, rtl1, rtl2 '+
    ' FROM public."aMoexInstruments"',
  }


  if (request.query.secid !== undefined) {
    paramArr = [request.query.secid]
    query.text += ' WHERE (secid= $1);'
    query.values = paramArr;
    } else
    { 
      query.text += ';'}
    console.log(request.query.secid)
    console.log(request.query)
    console.log(query)

  pool.query (query, (err, res) => {
    if (err) {console.log (err.stack)} else {
      console.log(res.rows)
      return response.status(200).json((res.rows))}
  })
}

async function fPutNewFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.nodeparent, request.body.userId, request.body.idelement]
    const query = {
      text: "INSERT INTO public.dtree_menu_favorites(nodename, nodeparent, userid, idelement) VALUES ($1, $2, $3,$4) RETURNING *",
      values: paramArr,
      rowMode: 'array'
    }
    pool.query (query, (err, res) => {
      if (err) {console.log (err.stack) 
      } else {
        return response.status(200).json(res.rows[0])
      }
    })
}
async function fRemoveFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.userId, request.body.idelement]
    const query = {
      text: "DELETE FROM public.dtree_menu_favorites where (nodename = $1 and userid= $2 and idelement= $3) RETURNING *",
      values: paramArr,
      rowMode: 'array'
    }
    console.log('query',query);
    pool.query (query, (err, res) => {
      if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows[0])}
    })
}


async function fGetClientData(request,response) {
  const query = {text: ' SELECT * FROM public.dclients'}
  if (request.query.client !== undefined) {
    paramArr = [request.query.client]
    query.text += ' WHERE (clientname= $1);'
    query.values = paramArr;
    } else {query.text += ';'
  }
  console.log('query',query);
  pool.query (query, (err, res) => {
    if (err) {console.log (err.stack)} else {
      return response.status(200).json((res.rows))}
  })
}


async function fEditClientData (request, response) {
  paramArr = request.body.data
  console.log('request.body.data',request.body.data);
  const query = {
  text: 'UPDATE public.dclients ' +
	'SET clientname=${clientname}, ' +
   'idcountrydomicile=${idcountrydomicile}, ' +
   'isclientproffesional=${isclientproffesional}, '+
   'address=${address}, '+
   'contact_person=${contact_person}, ' +
   'email=${email}, '+
   'phone=${phone}, '+
   'code=${code} '+
	 'WHERE idclient=${idclient};',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)

  pool.query (sql,  (err, res) => {
    if (err) {console.log (err.stack) 
    } else {
      return response.status(200).json(res.rows[0])
    }
  })  
}

 module.exports = {
  FAmmGetTreeData,
  fGetportfolioTable,
  fPutNewFavorite,
  fRemoveFavorite,
  fGetInstrumentData,
  fGetClientData,
  fEditClientData
 }