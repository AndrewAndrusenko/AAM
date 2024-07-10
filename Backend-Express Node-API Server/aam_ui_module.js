const db_common_api = require('./db_common_api');
var pgp = require('pg-promise')({capSQL: true });
async function TreeSQLQueryExc (RootNode, userId, nodeParentFavorite,response) {
  RootNode = RootNode.split('_')
  sql = {text:'', rowMode: "array" }
  switch (RootNode[0]) {
    case 'Clients':
      sql.text='SELECT dclients.clientname, dclients.idclient from public.dclients order by dclients.clientname ;'; 
    break;
    case 'Portfolios':
      sql.text='SELECT dportfolios.portfolioname, dportfolios.idportfolio from public.dportfolios order by dportfolios.portfolioname;'; 
    break;
    case 'Strategies':
      sql.text='select dstrategiesglobal.sname, dstrategiesglobal.id from public.dstrategiesglobal order by dstrategiesglobal.s_level_id, dstrategiesglobal.sname;'; 
    break; 
    case 'Instruments':
      sql.text='SELECT DISTINCT tidinstrument, tidinstrument as id FROM public.dtrades order by tidinstrument;'
    break;     
    case 'Instruments':
      sql.text='SELECT DISTINCT tidinstrument, tidinstrument as id FROM public.dtrades order by tidinstrument;'
    break;     
    case 'Non-Trade Operations':
      sql.text="SELECT name, id FROM public.dtree_menu_items where rootname='Non-Trade Operations' order by id;"
      break;    
    case 'Accounting':
      sql.text="SELECT name, id FROM public.dtree_menu_items where rootname='Accounting' order by id;"
    break;    
         
    case 'Favorites':
      sql.values = [userId, RootNode[1]]
      sql.rowMode="array"
      switch (RootNode[1]) {
        case 'Portfolios':
          sql.text = "SELECT dportfolios.portfolioname, dtree_menu_favorites.idelement FROM public.dtree_menu_favorites " + 
              "LEFT JOIN dportfolios on dtree_menu_favorites.idelement = dportfolios.idportfolio::text "
        break;   
        case 'Clients':
          sql.text = "SELECT dclients.clientname, dtree_menu_favorites.idelement  FROM public.dtree_menu_favorites " + 
          " LEFT JOIN dclients on dtree_menu_favorites.idelement = dclients.idclient::text "
        break;   
        case 'Strategies':
          sql.text = "SELECT dstrategiesglobal.sname, dtree_menu_favorites.idelement FROM public.dtree_menu_favorites " + 
          " LEFT JOIN dstrategiesglobal on dtree_menu_favorites.idelement = dstrategiesglobal.id::text "
        break;   
        case 'Instruments':
          sql.text = "SELECT dtree_menu_favorites.nodename, dtree_menu_favorites.idelement FROM public.dtree_menu_favorites " 
        break;  
        default:
          sql.text = "SELECT * FROM (SELECT 0 as userid, '0' as nodeparent) as t ";
        break;
      }
      sql.text = sql.text + " where (userid= $1) and (nodeparent = $2) "
    break;     
  }
  RootNode[1] ? RootNode = RootNode.join('_') : RootNode = RootNode[0]
  PromQty = new Promise(
    (resolve) => {
      db_common_api.queryExecute(sql,response,null,RootNode,false).then(result => {
        if (result === undefined) {resolve([RootNode,[]])} else {resolve([RootNode,result])} 
      })
    }
  ) 
  return PromQty;
}
async function FAmmGetTreeData(request,response) {
  Paramlist = request.query.paramList
  Paramlist.splice (Paramlist.indexOf('Favorites'),1)
  FavoritesList = Paramlist.filter(el=>!['Trades & Orders','Accounting','Non-Trade Operations'].includes(el)).map (element => 'Favorites_' + element);
  Treelist = [...Paramlist,...FavoritesList]
  await Promise.all (Treelist.map(RootNode => TreeSQLQueryExc(RootNode, request.query.userId,'',response)))
  .then((value) => {
    value.push (['Favorites',FavoritesList])
    return response.status(200).json(value)
  })
}
async function fGetPortfolioData(request,response) {
  switch (request.query.action) {
    case 'getPortfoliosHistory':
      sql='select * from public.f_i_h_get_dportfolios_history(${p_type},${p_idportfolio},${p_user_id},${p_tr_date}::daterange);';
    break;
  }
  sql=pgp.as.format(sql,request.query)
  sql=db_common_api.sqlReplace(sql);
  db_common_api.queryExecute(sql,response,null,request.query.action)
}
async function fGetportfolioTable (request,response) {
  const clientDataFields = ", dclients.clientname, dclients.isclientproffesional , dclients.address, dclients.contact_person, dclients.email, dclients.phone" ;
  const query = { text: "SELECT "+
    " dportfolios.idportfolio, dportfolios.idclient , dportfolios.idstategy, " + 
    " dstrategiesglobal.sname as stategy_name, dstrategiesglobal.s_description as description , "+
    " dportfolios.portfolioname, dportfolios.portleverage, 0 as action " 
  }
    request.query.accessToClientData!=='none'? query.text += clientDataFields: null;
    query.text += " FROM public.dportfolios "+
    " LEFT JOIN public.dstrategiesglobal ON dportfolios.idstategy = public.dstrategiesglobal.id " +
    " LEFT JOIN public.dclients ON dportfolios.idclient = public.dclients.idclient "
  switch (request.query.actionOnAccountTable) {
    case 'Get_Portfolio_By_idFee':
      query.text = 'SELECT * FROM f_f_get_portfolios_by_idfee($1);'
      query.values = [Number(request.query.idFeeMain)]
    break;
    case 'Get_Portfolios_By_CientId':
      query.text += ' WHERE (dportfolios.idclient = $1);'
      query.values = [request.query.clientId]
    break;
    case 'Get_Portfolios_By_StrategyId':
      query.text = 'SELECT idportfolio, portfolioname, strategy as stategy_name, strategy_name as description, 0 as action from f_i_get_portfolios_list_by_strategy($1);'
      query.values = [request.query.strategyMpName]
    break;
    case 'Get_Portfolio_By_idPortfolio':
      query.text += ' WHERE (public.dportfolios.idportfolio= $1);'
      query.values = [request.query.idportfolio]
    break;
    case 'calculateAccountCode':
      query.text += ' WHERE (LEFT(public.dportfolios.portfolioname,$2) = $1) '+
                    ' ORDER BY RIGHT(public.dportfolios.portfolioname,$2)::numeric DESC LIMIT 1; '
      query.values = [request.query.accountType, request.query.accountType.length ]
    break;  
    default:
      query.text += ' ORDER BY portfolioname DESC;'
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,request.query.actionOnAccountTable==='undefined'? 'fGetportfolioTable': request.query.actionOnAccountTable );
}
async function fPutNewFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.nodeparent, request.body.userId, request.body.idelement]
    const query = {
      text: "INSERT INTO public.dtree_menu_favorites(nodename, nodeparent, userid, idelement) VALUES ($1, $2, $3,$4) RETURNING *",
      values: paramArr,
      rowMode: 'array'
    }
    sql = pgp.as.format(query.text,query.values)
    db_common_api.queryExecute (sql, response,null,'fPutNewFavorite');
}
async function fRemoveFavorite (request, response) {
    paramArr = [request.body.nodename, request.body.userId, request.body.idelement]
    const query = {
      text: "DELETE FROM public.dtree_menu_favorites where (nodename = $1 and userid= $2 and idelement= $3) RETURNING *",
      values: paramArr,
    }
    sql = pgp.as.format(query.text,query.values)
    db_common_api.queryExecute (sql, response,null,'fRemoveFavorite');
}
async function fGetClientData(request,response) {
  const query = {text: ' SELECT dclients.*,cc."CountryName" AS idcountryname FROM public.dclients LEFT JOIN  public."dCountries" cc ON cc."IdCountry" = dclients.idcountrydomicile '}
  switch (request.query.action) {
    case 'Check_clientname':
      query.text += ' WHERE UPPER(clientname) = UPPER($1) AND idclient != $2;'
      query.values = [request.query.clientname, request.query.client]
    break;
    case 'Get_Client_Data':
      query.text += ' WHERE (idclient= $1);'
      query.values = [request.query.client]
    break;
    case 'getCounterPartyList':
      query.text = 'SELECT idclient, clientname, code 	FROM public.dclients;'
    default:
      query.text += ';'
    break;
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,request.query.action? request.query.action :'fGetClientDataALL');
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
	 'WHERE idclient=${idclient} RETURNING *;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,'fEditClientData');
}
async function fCreateClientData (request, response) {
  paramArr = request.body.data
  const query = {
  text: 'INSERT INTO public.dclients ' +
        '(clientname, idcountrydomicile, isclientproffesional, address, contact_person, email, phone, code)' +
        ' VALUES (' + 
        '${clientname}, ${idcountrydomicile}, ${isclientproffesional}, ${address}, ${contact_person}, ' +
        '${email}, ${phone}, ${code} ) RETURNING *;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,'fCreateClientData');
}
async function fClientDataDelete (request, response) {
  const query = {text: 'DELETE FROM public.dclients WHERE idclient=${idclient} RETURNING *;', values:  request.body}
  sql = pgp.as.format(query.text,query.values)
  db_common_api.queryExecute (sql, response,null,'fClientDataDelete'); 
}
async function getGeneralData (request,response) {
  let sql = '';
  switch (request.query.action) {
    case 'get_Countries_Data':
      sql = 'SELECT "IdCountry", "CountryName", "IsOffshore" 	FROM public."dCountries";'
      break;
  }
  db_common_api.queryExecute(sql,response,undefined,request.query.action)
}

module.exports = {
  FAmmGetTreeData,
  fGetportfolioTable,
  fPutNewFavorite,
  fRemoveFavorite,
  fGetClientData,
  fEditClientData,
  fClientDataDelete,
  fCreateClientData,
  fGetPortfolioData,
  getGeneralData
 }