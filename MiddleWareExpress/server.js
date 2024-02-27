const express = require ('express')
const bodyParser = require('body-parser')
const appServer = new express()
const port = 3000
const userId=0
const jsPassport = require ('passport')
var LocalStrategy = require('passport-local');
const uiAmmModule = require ('./aam_ui_module');
const uiAmmInvestmentsModule = require ('./aam_ui_investmentsData')
const uiAmmAccountingModule = require ('./aam_ui_accounting')
const uiAmmMarketData = require ('./aam_ui_market_data_load')
const uiAmmTradeData = require ('./aam_ui_trades')
const uiAmmCurrencyData = require ('./aam_currenciesData')
const uiAmmFeesData = require ('./aam_feesData')
const RedisService = require ('./redis')
const auth_module = require('./auth_module');
const uiAmmAccoutingSchemes = require('./amm_accounting_schemes');
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
const cors = require('cors');

appServer.use(cors());
appServer.use (express.static('public'));
appServer.use(bodyParser.json());
appServer.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
var session = require('express-session');

appServer.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true }
}));
appServer.use(jsPassport.initialize());
appServer.use(jsPassport.session());
jsPassport.serializeUser(function(user, cb) {
 // console.log('serializeUser')
  process.nextTick(function() {
 //  console.log('serializeUser', user)
   userId=user.id;
    return cb(null, {
      id: user.id,
      username: user.login
    });
  });
});

jsPassport.deserializeUser(function(user, cb) {
  console.log('deserializeUser')
  process.nextTick(function() {
    return cb(null, user);
  });
});
jsPassport.use(new LocalStrategy(function verify(username, password, cb) {
//  console.log('Select')
  pool.query ("SELECT id, accessrole, login, hashed_password FROM public.dusers WHERE login = '" + username + "';", (err, row) => {
  // console.log('verify')
    if (err) { return cb(err); }
    if (row.rowCount==0) { 
      var error = new Object;
      error = { message: 'User: Incorrect username or password.' }
      console.log ('row.rowCount==0', 'Incorrect Username or Password');
      return cb (error.message, false, { message: 'User: Incorrect username or password.' }) }


    bcrypt.compare(password, row.rows[0].hashed_password,
      async function (err, isMatch) {
        
      if (isMatch) {return cb(null, row.rows[0])}
      if (!isMatch) {  
        error = { message: 'Password: Incorrect username or password.' }
        console.log('Password: Incorrect username or password.');
        return cb(error.message, false, { message: 'Password: Incorrect username or password.' })
      }
      })
  });
}));
appServer.post ('/auth/', function (req, res, next) { 
  jsPassport.authenticate('local', function(err, user, info)  { 
  console.log('err', err) 
  if (err) {return res.send(err)}
  if (!user) { return res.redirect('/login'); }
 // console.log('user', user) 
 // console.log('info', info) 
  return res.json({message:"Success", username: user});
})(req, res, next)
}) 
function NodeCls () {
  process.stdout.write('\x1b')
  console.log('AA');
}
appServer.post ('/logout/', function (req, res){
 // console.log('req', req.session)
  req.session.destroy();
});
appServer.get('/nodecls/', function (req, res){
  process.stdout.write('\x1b')
  console.log('\x1b')
  console.log('\x1Bc');
  console.log('Terminal cleared');
  
  res.status(200).json('Terminal cleared')
 } )

appServer.get ('/auth/userRoles/', auth_module.getUserRoles)
appServer.get ('/auth/loginsArray/', auth_module.getLoginsArray)
appServer.get ('/accessRestriction/', auth_module.getAccessRestriction)
appServer.post ('/auth/newUser/',auth_module.addNewUser)
appServer.post('/Favorites/newItem/',uiAmmModule.fPutNewFavorite)
appServer.post('/Favorites/deleteItem/',uiAmmModule.fRemoveFavorite)
// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/treeMenu/',  jsPassport.authenticate('session') ,  uiAmmModule.FAmmGetTreeData)
// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/portfolioTable/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetportfolioTable)
appServer.get ('/AAM/ClientData/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetClientData)
appServer.post('/AAM/ClientDataEdit/',jsPassport.authenticate('session') , uiAmmModule.fEditClientData)
appServer.post('/AAM/ClientDataDelete/',jsPassport.authenticate('session') , uiAmmModule.fClientDataDelete)
appServer.post('/AAM/ClientDataCreate/',jsPassport.authenticate('session') , uiAmmModule.fCreateClientData)
appServer.get('/AAM/GetStrategiesList/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetStrategiesList)
appServer.get('/AAM/GetStrategyStructure/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetStrategyStructure)
appServer.post('/AAM/StrategyDataUpdate/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyDataUpdate)
appServer.post('/AAM/updateStrategyStructure/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyStructureUpdate)
/*----------------------PortofoliosData----------------------------------------------------*/

appServer.post('/AAM/AccountCreate/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountCreate)
appServer.post('/AAM/AccountDelete/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountDelete)
appServer.post('/AAM/AccountEdit/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountEdit)
appServer.post('/AAM/GetPortfolioPositions/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetPortfolioPositions)
appServer.post('/AAM/GetPortfolioAnalytics/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetPortfolioAnalytics)

/* -----------------------Accountting ----------------------------------------------------- */
appServer.get('/DEA/fGetMT950Transactions/',jsPassport.authenticate('session') , uiAmmAccountingModule.fGetMT950Transactions)
appServer.get('/DEA/fGetAccountingData/',jsPassport.authenticate('session') , uiAmmAccountingModule.fGetAccountingData)
appServer.get('/DEA/GetEntryScheme/',jsPassport.authenticate('session') , uiAmmAccountingModule.GetEntryScheme)
appServer.post('/DEA/fCreateEntryAccountingInsertRow/',jsPassport.authenticate('session') , uiAmmAccountingModule.fCreateEntryAccountingInsertRow)

/*----------------------FIFO---------------------------------------------------------*/
appServer.get('/DEA/getFIFOtransactions/',jsPassport.authenticate('session') , uiAmmTradeData.fGetFIFOtransactions)
appServer.get('/DEA/getFIFOPositions/',jsPassport.authenticate('session') , uiAmmTradeData.fGetFIFOPositions)
/*----------------------AccountsUI---------------------------------------------------------*/
appServer.post('/DEA/updateAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fUpdateAccountAccounting)
/*----------------------LedgerAccountsUI----------------------------------------------------*/
appServer.post('/DEA/updateLedgerAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fUpdateLedgerAccountAccounting)
/*----------------------EntryUI----------------------------------------------------*/
appServer.post('/DEA/updateEntryAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fUpdateEntryAccountAccounting)
appServer.post('/DEA/updateLLEntryAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fUpdateLLEntryAccounting)
appServer.post('/DEA/createDepoSubAccounts/',jsPassport.authenticate('session') , uiAmmAccountingModule.fCreateDepoSubAccounts)
appServer.post('/DEA/createFIFOtransactions/',jsPassport.authenticate('session') , uiAmmAccountingModule.fcreateFIFOtransactions)
appServer.post('/DEA/deleteAccountingFIFOtransactions/',jsPassport.authenticate('session') , uiAmmAccountingModule.fdeleteAccountingFIFOtransactions)
/*----------------------OverdraftValidators----------------------------------------------------*/
appServer.get('/DEA/accountingOverdraftAccountCheck/',jsPassport.authenticate('session') , uiAmmAccountingModule.faccountingOverdraftAccountCheck)
appServer.get('/DEA/accountingOverdraftLedgerAccountCheck/',jsPassport.authenticate('session') , uiAmmAccountingModule.faccountingOverdraftLedgerAccountCheck)

/* >>>>>>>>>>>>>>>>>>>>>>>>Accounting Closing>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */
appServer.post('/DEA/accountingBalanceCloseInsert/',jsPassport.authenticate('session') , uiAmmAccountingModule.faccountingBalanceCloseInsert)
appServer.post('/DEA/accountingBalanceDayOpen/',jsPassport.authenticate('session') , uiAmmAccountingModule.faccountingBalanceDayOpen)

/*----------------------MarketData----------------------------------------------------*/
appServer.post('/AAM/MD/importData/',jsPassport.authenticate('session') , uiAmmMarketData.finsertMarketData)
appServer.get('/AAM/MD/getMarketData/',jsPassport.authenticate('session') , uiAmmMarketData.fgetMarketData)
appServer.get('/AAM/MD/getMarketDataSources/',jsPassport.authenticate('session') , uiAmmMarketData.fgetMarketDataSources)
appServer.get('/AAM/MD/getInstrumentsCodes/',jsPassport.authenticate('session') , uiAmmMarketData.fgetInstrumentsCodes)

appServer.post('/AAM/MD/deleteMarketData/',jsPassport.authenticate('session') , uiAmmMarketData.fdeleteMarketData)

appServer.get('/AAM/MD/getMoexInstrumentsList/',jsPassport.authenticate('session') , uiAmmMarketData.fimportMoexInstrumentsList)
appServer.get('/AAM/MD/getMoexInstruments/',jsPassport.authenticate('session') , uiAmmMarketData.fGetMoexInstruments)
appServer.get('/AAM/MD/getInstrumentDataGeneral/',jsPassport.authenticate('session') , uiAmmMarketData.fgetInstrumentDataGeneral)
appServer.get('/AAM/MD/getInstrumentDetails/',jsPassport.authenticate('session') , uiAmmMarketData.fgetInstrumentDetails)
appServer.get('/AAM/MD/getInstrumentDataCorpActions/',jsPassport.authenticate('session') , uiAmmMarketData.fgetInstrumentDataCorpActions)

appServer.post('/AAM/MD/InstrumentCreate/',jsPassport.authenticate('session') , uiAmmMarketData.fInstrumentCreate)
appServer.post('/AAM/MD/InstrumentDelete/',jsPassport.authenticate('session') , uiAmmMarketData.fInstrumentDelete)
appServer.post('/AAM/MD/InstrumentEdit/',jsPassport.authenticate('session') , uiAmmMarketData.fInstrumentEdit)

appServer.post('/AAM/MD/UpdateInstrumentDetails/',jsPassport.authenticate('session') , uiAmmMarketData.fUpdateInstrumentDetails)
appServer.post('/AAM/MD/UpdateInstrumentDataCorpActions/',jsPassport.authenticate('session') , uiAmmMarketData.fUpdateInstrumentDataCorpActions)
/*----------------------TradeData----------------------------------------------------*/
appServer.get('/AAM/MD/getTradeData/',jsPassport.authenticate('session'), uiAmmTradeData.fGetTradesData)
appServer.get('/AAM/MD/getcouponPeriodInfo/',jsPassport.authenticate('session'), uiAmmTradeData.fGetAccuredInterest)
appServer.post('/AAM/MD/UpdateTradeData/',jsPassport.authenticate('session'), uiAmmTradeData.fUpdateTradeData)
/*----------------------OrderData----------------------------------------------------*/
appServer.get('/AAM/MD/getOrderData/',jsPassport.authenticate('session'), uiAmmTradeData.fGetOrderData)
appServer.post('/AAM/MD/UpdateOrderData/',jsPassport.authenticate('session'), uiAmmTradeData.fUpdateOrderData)
appServer.post('/AAM/MD/ModifyBulkOrder/',jsPassport.authenticate('session'), uiAmmTradeData.fModifyBulkOrder)
appServer.post('/AAM/MD/Allocation/',jsPassport.authenticate('session'), uiAmmTradeData.fAllocation)
appServer.post('/AAM/MD/createOrderbyMP/',jsPassport.authenticate('session'), uiAmmTradeData.fCreateOrderbyMP)

/*----------------------CurrencyData----------------------------------------------------*/
appServer.get('/AAM/getCurrencyData/',jsPassport.authenticate('session'), uiAmmCurrencyData.getCurrencyData)
appServer.get('/AAM/getCbrRateDaily/',jsPassport.authenticate('session'), uiAmmCurrencyData.getCbrRateDaily)
appServer.post('/AAM/modifyRatesData/',jsPassport.authenticate('session'), uiAmmCurrencyData.modifyRatesData)

/*----------------------FeesData----------------------------------------------------*/
appServer.get('/AAM/getFeesData/',jsPassport.authenticate('session'), uiAmmFeesData.geFeesData)
appServer.post('/AAM/updateFeesData/',jsPassport.authenticate('session'), uiAmmFeesData.fupdateFeesData)
appServer.post('/AAM/updateFeesTransactionsData/',jsPassport.authenticate('session'), uiAmmFeesData.fupdateFeesTransactionsData)
appServer.post('/AAM/updatePortfoliosFeesData/',jsPassport.authenticate('session'), uiAmmFeesData.fupdatePortfoliosFeesData)
appServer.post('/AAM/updateFeesScheduleData/',jsPassport.authenticate('session'), uiAmmFeesData.fupdateFeesScheduleData)
appServer.post('/AAM/updateFeesEntryInfo/',jsPassport.authenticate('session'), uiAmmFeesData.fupdateFeesEntryInfo)

appServer.get('/AAM/getTaxesData/',jsPassport.authenticate('session'), uiAmmFeesData.fgetTaxes)
/*----------------------AccountingSchemesData----------------------------------------------------*/
appServer.get('/DEA/getAccountingSchemes/',jsPassport.authenticate('session'), uiAmmAccoutingSchemes.getAccountingSchemes)
appServer.post('/DEA/updateSchemeTransaction/',jsPassport.authenticate('session'), uiAmmAccoutingSchemes.updateSchemeTransaction)
appServer.post('/DEA/updateTransactionTypes/',jsPassport.authenticate('session'), uiAmmAccoutingSchemes.updateTransactionTypes)


// RedisService.TestRedis();
// RedisService.redisSetInstrumentList();
appServer.get('/AAM/Redis/getMoexInstrumentsList/',jsPassport.authenticate('session'), RedisService.redisGetInstrumentList)
appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})
appServer.on('error', (e) =>  console.log('AAAAAAA in use, retrying...'))
