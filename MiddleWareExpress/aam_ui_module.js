const Module = require('module');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require('pg-promise')({
  capSQL: true // to capitalize all generated SQL
});

async function TreeSQLQueryExc (RootNode, userId, nodeParentFavorite) {
  RootNode = RootNode.split('_')
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
      pool.QueryArrayConfig.rowMode="array"
      switch (RootNode[1]) {
        case 'Accounts':
        sql = "SELECT dportfolios.portfolioname, dtree_menu_favorites.idelement FROM public.dtree_menu_favorites " + 
              "LEFT JOIN dportfolios on dtree_menu_favorites.idelement = dportfolios.idportfolio::text "
        break;   
        case 'Clients':
          sql = "SELECT dclients.clientname, dtree_menu_favorites.idelement  FROM public.dtree_menu_favorites " + 
          " LEFT JOIN dclients on dtree_menu_favorites.idelement = dclients.idclient::text "
        break;   
        case 'Strategies':
          sql = "SELECT dstrategiesglobal.sname, dtree_menu_favorites.idelement FROM public.dtree_menu_favorites " + 
          " LEFT JOIN dstrategiesglobal on dtree_menu_favorites.idelement = dstrategiesglobal.id::text "
        break;   
        case 'Instruments':
          sql = "SELECT dtree_menu_favorites.nodename, dtree_menu_favorites.idelement  FROM public.dtree_menu_favorites " 
        break;   
      }
      pool.QueryArrayConfig.text = sql + " where (userid= $1) and (nodeparent = $2) "
    break;     
  }
  RootNode[1] ? RootNode = RootNode.join('_') : RootNode = RootNode[0]
  PromQty = new Promise((resolve, reject) => {pool.query(pool.QueryArrayConfig, (error,result) => resolve([RootNode,result.rows]))}) 
  return PromQty;
 }
 
async function FAmmGetTreeData(request,response) {
  Paramlist = request.query.paramList
  Paramlist.splice (Paramlist.indexOf('Trades & Orders'),1)
  Paramlist.splice (Paramlist.indexOf('Favorites'),1)
  FavoritesList = Paramlist.map (element => 'Favorites_' + element);
  Treelist = [...Paramlist,...FavoritesList]

  await Promise.all(
    Treelist.map(RootNode => TreeSQLQueryExc(RootNode, request.query.userId,''))
  ).then((value) => {
    value.push (['Favorites',FavoritesList])
    return response.status(200).json(value)
  })
}

async function fGetportfolioTable (request,response) {
  let sql="SELECT "+
  " dportfolios.idportfolio as Account_ID, dportfolios.idclient as Client_ID, dportfolios.idstategy, " + 
  " dstrategiesglobal.sname as Strategy ,dportfolios.portfolioname as Account_Name, dportfolios.portleverage as Leverage, " +
  " dclients.clientname as client_name, dclients.isclientproffesional as proffesional , dclients.address, " +
  " dclients.contact_person, dclients.email, dclients.phone" +
  " FROM public.dportfolios "+
  " LEFT JOIN public.dstrategiesglobal ON dportfolios.idstategy = public.dstrategiesglobal.id " +
  " LEFT JOIN public.dclients ON dportfolios.idclient = public.dclients.idclient; "
  pool.query ({text : sql}, (err, res) => {
    if (err) {console.log (err.stack) 
    } else {
      console.log('res.rows',res.rows);
      return response.status(200).json((res.rows))
    }
  })
}

async function fGetInstrumentData(request,response) {
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
  pool.query (query, (err, res) => {
    if (err) {console.log (err.stack)} else {return response.status(200).json((res.rows))}
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
      if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows[0])}
    })
}
async function fRemoveFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.userId, request.body.idelement]
    const query = {
      text: "DELETE FROM public.dtree_menu_favorites where (nodename = $1 and userid= $2 and idelement= $3) RETURNING *",
      values: paramArr,
      rowMode: 'array'
    }
    pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows[0])}
    })
}

async function fGetClientData(request,response) {
  console.log('request.query',request.query);
  const query = {text: ' SELECT * FROM public.dclients'}
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


async function fEditClientData (request, response) {
  paramArr = request.body.data
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
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack

    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  
}


async function fCreateClientData (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dclients ' +
        '(clientname, idcountrydomicile, isclientproffesional, address, contact_person, email, phone, code)' +
        ' VALUES (' + 
        '${clientname}, ${idcountrydomicile}, ${isclientproffesional}, ${address}, ${contact_person}, ' +
        '${email}, ${phone}, ${code} );',
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

async function fClientDataDelete (request, response) {
  console.log('rq', request.body)
  const query = {text: 'DELETE FROM public.dclients WHERE idclient=${idclient};', values:  request.body}
  sql = pgp.as.format(query.text,query.values)
  console.log('sql',sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log ('hi',err.stack)
    return response.send(err)
  } else {
    console.log('res.rowCount',res.rowCount); 
    return response.status(200).json(res.rowCount)}
  })  
}

module.exports = {
  FAmmGetTreeData,
  fGetportfolioTable,
  fPutNewFavorite,
  fRemoveFavorite,
  fGetInstrumentData,
  fGetClientData,
  fEditClientData,
  fClientDataDelete,
  fCreateClientData
 }