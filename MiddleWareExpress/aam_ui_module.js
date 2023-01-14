const { param } = require('jquery');
const Module = require('module');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);

async function TreeSQLQueryExc (RootNode, userId) {
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

    case 'Instruments':
      pool.QueryArrayConfig.text='SELECT "InstrumentName" FROM public."dFInstruments"'
    break;     

    case 'Favorites':
      pool.QueryArrayConfig.values = [userId]
      pool.QueryArrayConfig.text="SELECT nodename || ',' || nodeparent as nodeF FROM public.dtree_menu_favorites where (userid= $1) "
      pool.QueryArrayConfig.rowMode="array"
    break;     
  }
  console.log(pool.QueryArrayConfig)
  PromQty = new Promise((resolve, reject) => {
    pool.query(pool.QueryArrayConfig, (error,result) => { 
      resolve( 
      [RootNode,result.rows.flat()]) })
  })
  return PromQty;
 }
 
async function FAmmGetAccountsList (request,response) {
  Treelist = ['Clients','Accounts','Strategies','Favorites', 'Instruments'];  
  await Promise.all(
    Treelist.map(RootNode => TreeSQLQueryExc(RootNode, request.query.userId))
  ).then((value) => {
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
      console.log(res.rows)
      return response.status(200).json((res.rows))
    }
  })
}

async function fPutNewFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.nodeparent, request.body.userId]
    const query = {
      text: "INSERT INTO public.dtree_menu_favorites(nodename, nodeparent, userid) VALUES ($1, $2, $3) RETURNING *",
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
    console.log ('fRemoveFavorite')
    paramArr = [request.body.nodename, request.body.userId]
    const query = {
      text: "DELETE FROM public.dtree_menu_favorites where (nodename = $1 and userid= $2) RETURNING *",
      values: paramArr,
      rowMode: 'array'
    }
    pool.query (query, (err, res) => {
      if (err) {console.log (err.stack) 
      } else {
        console.log(query)
        return response.status(200).json(res.rows[0])
      }
    })
}

 module.exports = {
  FAmmGetAccountsList,
  fGetportfolioTable,
  fPutNewFavorite,
  fRemoveFavorite
 }