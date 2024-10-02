const express = require ('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const appServer = new express()
const port = 3000
const jsPassport = require ('passport')
var LocalStrategy = require('passport-local').Strategy;
const uiAmmModule = require ('./aam_ui_module');
const uiAmmInvestmentsModule = require ('./aam_ui_investmentsData')
const uiAmmAccountingModule = require ('./aam_ui_accounting')
const uiAmmMarketData = require ('./aam_ui_market_data_load')
const uiAmmTradeData = require ('./aam_ui_trades')
const uiAmmCurrencyData = require ('./aam_currenciesData')
const uiAmmFeesData = require ('./aam_feesData')
const uiAmmRestricitionsData = require ('./aam_restricitionsData')
const RedisService = require ('./redis')
const auth_module = require('./auth_module');
const uiAmmAccoutingSchemes = require('./amm_accounting_schemes');
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
const cors = require('cors');
var session = require('express-session');

appServer.use(cors({credentials: true} ));
appServer.use(cookieParser());
appServer.use (express.static('public'));
appServer.use(express.json({limit: '25mb'}));
appServer.use(express.urlencoded({limit: '25mb', extended: true}));
appServer.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false } 
}));
appServer.use(jsPassport.initialize());
appServer.use(jsPassport.authenticate('session'));

jsPassport.use(new LocalStrategy(
  (username, password, cb)=> {
    pool.query ("SELECT id, accessrole, login, hashed_password FROM public.dusers WHERE login = '" + username + "';", (err, row) => {
      if (err) { return cb(err); }
      if (row.rowCount==0) { 
        var error = new Object;
        error = { message: 'User: Incorrect username or password.' }
        console.log ('row.rowCount==0', 'Incorrect Username or Password');
        return cb (error.message, false, { message: 'User: Incorrect username or password.' }) 
      }
      bcrypt.compare(password, row.rows[0].hashed_password, (err, isMatch) => {
        if (isMatch) {return cb(null, row.rows[0])}
        if (!isMatch) {  
          error = { message: 'Password: Incorrect username or password.' }
          console.log('Password: Incorrect username or password.');
          return cb(error.message, false, { message: 'Password: Incorrect username or password.' })
        }
      })
  });
}));
jsPassport.serializeUser((user, done) => {
  done(null, user);
});
 jsPassport.deserializeUser((userData, done) => {
  const user = userData;
  done(null, user);
});
function mustAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    console.log('NOT authorized. Session:', req.sessionID,'url:', req.originalUrl);
    // return res.status(401).send({});
  }
  next();
}
appServer.post ('/auth/', function (req, res, next) { 
  jsPassport.authenticate('local', function(err, user, info)  { 
    if (err) {return res.send(err)}
    if (!user) { return res.redirect('/login'); }
    userData=user;
    req.logIn(user, function(err) {
      if (err) return next(err);
      return res.json({
        success: true,
        message:"Success", 
        username: user,
        sessionID:req.sessionID
      });
    });
  })(req, res, next)
}) 
appServer.post ('/logout/', function(req, res, next){
  req.logout(function(err) {
    if (err) { 
      console.log('logout err', err);
      return next(err); 
    }
    req.session.destroy(function (err) {
      if(err) {
          console.log("error: " + err);
          res.status(500).json({message: "Error destroying session"});
      } else{
        res.clearCookie('connect.sid');
        res.status(200).json({message: "Logged out successfully"});
      }
  });
  });
});

appServer.get ('/auth/userRoles/', auth_module.getUserRoles)
appServer.get ('/auth/loginsArray/', auth_module.getLoginsArray)
appServer.get ('/accessRestriction/', auth_module.getAccessRestriction)
appServer.post ('/auth/newUser/',auth_module.addNewUser)
appServer.post('/Favorites/newItem/',uiAmmModule.fPutNewFavorite)
appServer.post('/Favorites/deleteItem/',uiAmmModule.fRemoveFavorite)
// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/treeMenu/',  mustAuthenticated ,  uiAmmModule.FAmmGetTreeData)
// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/portfolioTable/',  mustAuthenticated ,  uiAmmModule.fGetportfolioTable)
appServer.get ('/AAM/PortfolioData/',  mustAuthenticated ,  uiAmmModule.fGetPortfolioData)
appServer.get ('/AAM/ClientData/',  mustAuthenticated ,  uiAmmModule.fGetClientData)
appServer.post('/AAM/ClientDataEdit/',mustAuthenticated , uiAmmModule.fEditClientData)
appServer.post('/AAM/ClientDataDelete/',mustAuthenticated , uiAmmModule.fClientDataDelete)
appServer.post('/AAM/ClientDataCreate/',mustAuthenticated , uiAmmModule.fCreateClientData)
appServer.get('/AAM/GetStrategiesList/',mustAuthenticated , uiAmmInvestmentsModule.fGetStrategiesList)
appServer.get('/AAM/GetStrategyStructure/',mustAuthenticated , uiAmmInvestmentsModule.fGetStrategyStructure)
appServer.post('/AAM/StrategyDataUpdate/',mustAuthenticated , uiAmmInvestmentsModule.fStrategyDataUpdate)
appServer.post('/AAM/updateStrategyStructure/',mustAuthenticated , uiAmmInvestmentsModule.fStrategyStructureUpdate)
/*----------------------PortofoliosData----------------------------------------------------*/

appServer.post('/AAM/AccountEdit/',mustAuthenticated , uiAmmInvestmentsModule.fAccountEdit)
appServer.post('/AAM/GetPortfolioPositions/',mustAuthenticated , uiAmmInvestmentsModule.fGetPortfolioPositions)
appServer.post('/AAM/GetPortfolioAnalytics/',mustAuthenticated , uiAmmInvestmentsModule.fGetPortfolioAnalytics)

/* -----------------------Accountting ----------------------------------------------------- */
appServer.get('/DEA/fGetMT950Transactions/',mustAuthenticated , uiAmmAccountingModule.fGetMT950Transactions)
appServer.get('/DEA/fGetAccountingData/',mustAuthenticated , uiAmmAccountingModule.fGetAccountingData)
appServer.get('/DEA/GetEntryScheme/',mustAuthenticated , uiAmmAccountingModule.GetEntryScheme)

/*----------------------FIFO---------------------------------------------------------*/
appServer.get('/DEA/getFIFOtransactions/',mustAuthenticated , uiAmmTradeData.fGetFIFOtransactions)
appServer.get('/DEA/getFIFOPositions/',mustAuthenticated , uiAmmTradeData.fGetFIFOPositions)
/*----------------------AccountsUI---------------------------------------------------------*/
appServer.post('/DEA/updateAccountAccounting/',mustAuthenticated , uiAmmAccountingModule.fUpdateAccountAccounting)
/*----------------------LedgerAccountsUI----------------------------------------------------*/
appServer.post('/DEA/updateLedgerAccountAccounting/',mustAuthenticated , uiAmmAccountingModule.fUpdateLedgerAccountAccounting)
/*----------------------EntryUI----------------------------------------------------*/
appServer.post('/DEA/updateEntryAccountAccounting/',mustAuthenticated , uiAmmAccountingModule.fUpdateEntryAccountAccounting)
appServer.post('/DEA/updateLLEntryAccountAccounting/',mustAuthenticated , uiAmmAccountingModule.fUpdateLLEntryAccounting)
appServer.post('/DEA/createDepoSubAccounts/',mustAuthenticated , uiAmmAccountingModule.fCreateDepoSubAccounts)
appServer.post('/DEA/createFIFOtransactions/',mustAuthenticated , uiAmmAccountingModule.fcreateFIFOtransactions)
appServer.post('/DEA/deleteAccountingFIFOtransactions/',mustAuthenticated , uiAmmAccountingModule.fdeleteAccountingFIFOtransactions)
/*----------------------OverdraftValidators----------------------------------------------------*/
appServer.get('/DEA/accountingOverdraftAccountCheck/',mustAuthenticated , uiAmmAccountingModule.faccountingOverdraftAccountCheck)
appServer.get('/DEA/accountingOverdraftLedgerAccountCheck/',mustAuthenticated , uiAmmAccountingModule.faccountingOverdraftLedgerAccountCheck)

/* >>>>>>>>>>>>>>>>>>>>>>>>Accounting Closing>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */
appServer.post('/DEA/accountingBalanceCloseInsert/',mustAuthenticated , uiAmmAccountingModule.faccountingBalanceCloseInsert)
appServer.post('/DEA/accountingBalanceDayOpen/',mustAuthenticated , uiAmmAccountingModule.faccountingBalanceDayOpen)

/*----------------------MarketData----------------------------------------------------*/
appServer.post('/AAM/MD/importData/',mustAuthenticated , uiAmmMarketData.finsertMarketData)
appServer.post('/AAM/MD/updateMarketQuote/',mustAuthenticated , uiAmmMarketData.fupdateMarketQuote)
appServer.get('/AAM/MD/getMarketData/',mustAuthenticated , uiAmmMarketData.fgetMarketData)
appServer.get('/AAM/MD/getMarketDataSources/',mustAuthenticated , uiAmmMarketData.fgetMarketDataSources)
appServer.get('/AAM/MD/getInstrumentsCodes/',mustAuthenticated , uiAmmMarketData.fgetInstrumentsCodes)

appServer.post('/AAM/MD/deleteMarketData/',mustAuthenticated , uiAmmMarketData.fdeleteMarketData)

appServer.get('/AAM/MD/getMoexInstrumentsList/',mustAuthenticated , uiAmmMarketData.fimportMoexInstrumentsList)
appServer.get('/AAM/MD/getMoexInstruments/',mustAuthenticated , uiAmmMarketData.fGetMoexInstruments)
appServer.get('/AAM/MD/getInstrumentDataGeneral/',mustAuthenticated , uiAmmMarketData.fgetInstrumentDataGeneral)
appServer.get('/AAM/MD/getInstrumentDetails/',mustAuthenticated , uiAmmMarketData.fgetInstrumentDetails)
appServer.get('/AAM/MD/getInstrumentDataCorpActions/',mustAuthenticated , uiAmmMarketData.fgetInstrumentDataCorpActions)

appServer.post('/AAM/MD/InstrumentCreate/',mustAuthenticated , uiAmmMarketData.fInstrumentCreate)
appServer.post('/AAM/MD/InstrumentDelete/',mustAuthenticated , uiAmmMarketData.fInstrumentDelete)
appServer.post('/AAM/MD/InstrumentEdit/',mustAuthenticated , uiAmmMarketData.fInstrumentEdit)

appServer.post('/AAM/MD/UpdateInstrumentDetails/',mustAuthenticated , uiAmmMarketData.fUpdateInstrumentDetails)
appServer.post('/AAM/MD/UpdateInstrumentDataCorpActions/',mustAuthenticated , uiAmmMarketData.fUpdateInstrumentDataCorpActions)
/*----------------------TradeData----------------------------------------------------*/
appServer.get('/AAM/MD/getTradeData/',mustAuthenticated, uiAmmTradeData.fGetTradesData)
appServer.get('/AAM/MD/getcouponPeriodInfo/',mustAuthenticated, uiAmmTradeData.fGetAccuredInterest)
appServer.post('/AAM/MD/UpdateTradeData/',mustAuthenticated, uiAmmTradeData.fUpdateTradeData)
/*----------------------OrderData----------------------------------------------------*/
appServer.get('/AAM/MD/getOrderData/',mustAuthenticated, uiAmmTradeData.fGetOrderData)
appServer.post('/AAM/MD/UpdateOrderData/',mustAuthenticated, uiAmmTradeData.fUpdateOrderData)
appServer.post('/AAM/MD/ModifyBulkOrder/',mustAuthenticated, uiAmmTradeData.fModifyBulkOrder)
appServer.post('/AAM/MD/Allocation/',mustAuthenticated, uiAmmTradeData.fAllocation)
appServer.post('/AAM/MD/createOrderbyMP/',mustAuthenticated, uiAmmTradeData.fCreateOrderbyMP)

/*----------------------CurrencyData----------------------------------------------------*/
appServer.get('/AAM/getCurrencyData/',mustAuthenticated, uiAmmCurrencyData.getCurrencyData)
appServer.get('/AAM/getCbrRateDaily/',mustAuthenticated, uiAmmCurrencyData.getCbrRateDaily)
appServer.post('/AAM/modifyRatesData/',mustAuthenticated, uiAmmCurrencyData.modifyRatesData)

/*----------------------FeesData----------------------------------------------------*/
appServer.get('/AAM/getFeesData/',mustAuthenticated, uiAmmFeesData.geFeesData)
appServer.post('/AAM/updateFeesData/',mustAuthenticated, uiAmmFeesData.fupdateFeesData)
appServer.post('/AAM/updateFeesTransactionsData/',mustAuthenticated, uiAmmFeesData.fupdateFeesTransactionsData)
appServer.post('/AAM/updatePortfoliosFeesData/',mustAuthenticated, uiAmmFeesData.fupdatePortfoliosFeesData)
appServer.post('/AAM/updateFeesScheduleData/',mustAuthenticated, uiAmmFeesData.fupdateFeesScheduleData)
appServer.post('/AAM/updateFeesEntryInfo/',mustAuthenticated, uiAmmFeesData.fupdateFeesEntryInfo)

appServer.get('/AAM/getTaxesData/',mustAuthenticated, uiAmmFeesData.fgetTaxes)
/*----------------------AccountingSchemesData----------------------------------------------------*/
appServer.get('/DEA/getAccountingSchemes/',mustAuthenticated,  uiAmmAccoutingSchemes.getAccountingSchemes)

appServer.post('/DEA/updateSchemeTransaction/',mustAuthenticated, uiAmmAccoutingSchemes.updateSchemeTransaction)
appServer.post('/DEA/updateTransactionTypes/',mustAuthenticated, uiAmmAccoutingSchemes.updateTransactionTypes)
appServer.post('/DEA/updateAcessTransactionTypes/',mustAuthenticated, uiAmmAccoutingSchemes.updateAccessTransactionTypes)
/*----------------------RestrictionsData----------------------------------------------------*/
appServer.get('/AAM/getRestrictionsData/',mustAuthenticated, uiAmmRestricitionsData.geRestrictionsData)
appServer.post('/AAM/updateRestrictionsData/',mustAuthenticated, uiAmmRestricitionsData.fupdateRestrictionMainData)
/*----------------------GeneralData----------------------------------------------------*/
appServer.get('/AAM/getGeneralData/',mustAuthenticated, uiAmmModule.getGeneralData)

appServer.get('/AAM/Redis/getMoexInstrumentsList/',mustAuthenticated, RedisService.redisGetInstrumentList)
appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})
appServer.on('error', (e) =>  console.log('AAAAAAA in use, retrying...'))

appServer.get('/nodecls/', function (req, res){
  process.stdout.write('\x1b')
  console.log('\x1b')
  console.log('\x1Bc');
  console.log('Terminal cleared');
  res.status(200).json('Terminal cleared')
 })