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
const auth_module = require('./auth_module');
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

appServer.post ('/logout/', function (req, res){
 // console.log('req', req.session)
  req.session.destroy();
});


appServer.get ('/auth/userRoles/', auth_module.getUserRoles)

appServer.get ('/accessRestriction/', auth_module.getAccessRestriction)

appServer.post ('/auth/newUser/',auth_module.addNewUser)

appServer.post('/Favorites/newItem/',uiAmmModule.fPutNewFavorite)

appServer.post('/Favorites/deleteItem/',uiAmmModule.fRemoveFavorite)

// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/treeMenu/',  jsPassport.authenticate('session') ,  uiAmmModule.FAmmGetTreeData)

// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/portfolioTable/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetportfolioTable)

appServer.get ('/AAM/InstrumentData/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetInstrumentData)

appServer.get ('/AAM/ClientData/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetClientData)

appServer.post('/AAM/ClientDataEdit/',jsPassport.authenticate('session') , uiAmmModule.fEditClientData)

appServer.post('/AAM/ClientDataDelete/',jsPassport.authenticate('session') , uiAmmModule.fClientDataDelete)

appServer.post('/AAM/ClientDataCreate/',jsPassport.authenticate('session') , uiAmmModule.fCreateClientData)

appServer.get('/AAM/GetStrategiesList/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetStrategiesList)

appServer.get('/AAM/GetStrategyStructure/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fGetStrategyStructure)

appServer.post('/AAM/StrategyGlobalDataCreate/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyGlobalDataCreate)
appServer.post('/AAM/StrategyGlobalDataDelete/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyGlobalDataDelete)
appServer.post('/AAM/StrategyDataEdit/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fEditStrategyData)

appServer.post('/AAM/StrategyStructureCreate/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyStructureCreate)
appServer.post('/AAM/StrategyStructureDelete/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyStructureDelete)
appServer.post('/AAM/StrategyStructureEdit/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fStrategyStructureEdit)

appServer.post('/AAM/AccountCreate/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountCreate)
appServer.post('/AAM/AccountDelete/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountDelete)
appServer.post('/AAM/AccountEdit/',jsPassport.authenticate('session') , uiAmmInvestmentsModule.fAccountEdit)

/* -----------------------Accountting ----------------------------------------------------- */
appServer.get('/DEA/fGetMT950Transactions/',jsPassport.authenticate('session') , uiAmmAccountingModule.fGetMT950Transactions)
appServer.get('/DEA/fGetAccountingData/',jsPassport.authenticate('session') , uiAmmAccountingModule.fGetAccountingData)
appServer.get('/DEA/GetEntryScheme/',jsPassport.authenticate('session') , uiAmmAccountingModule.GetEntryScheme)
appServer.post('/DEA/fCreateEntryAccountingInsertRow/',jsPassport.authenticate('session') , uiAmmAccountingModule.fCreateEntryAccountingInsertRow)

/*----------------------AccountsUI---------------------------------------------------------*/
appServer.post('/DEA/updateAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fupdateAccountAccounting)
appServer.post('/DEA/deleteAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fdeleteAccountAccounting)
appServer.post('/DEA/createAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fcreateAccountAccounting)
/*----------------------LedgerAccountsUI----------------------------------------------------*/
appServer.post('/DEA/updateLedgerAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fupdateLedgerAccountAccounting)
appServer.post('/DEA/deleteLedgerAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fdeleteLedgerAccountAccounting)
appServer.post('/DEA/createLedgerAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fcreateLedgerAccountAccounting)
/*----------------------EntryUI----------------------------------------------------*/
appServer.post('/DEA/updateEntryAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fupdateEntryAccountAccounting)
appServer.post('/DEA/deleteEntryrAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fdeleteEntryrAccountAccounting)
appServer.post('/DEA/createEntryAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fcreateEntryAccounting)

appServer.post('/DEA/updateLLEntryAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fupdateLLEntryAccountAccounting)
appServer.post('/DEA/deleteLLEntryrAccountAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fdeleteLLEntryrAccountAccounting)
appServer.post('/DEA/createLLEntryAccounting/',jsPassport.authenticate('session') , uiAmmAccountingModule.fcreateLLEntryAccounting)

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

appServer.post('/AAM/MD/deleteMarketData/',jsPassport.authenticate('session') , uiAmmMarketData.fdeleteMarketData)

appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})

