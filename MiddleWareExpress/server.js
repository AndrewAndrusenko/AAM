const express = require ('express')
const bodyParser = require('body-parser')
const appServer = new express()
const port = 3000
const userId=0
const jsPassport = require ('passport')
var LocalStrategy = require('passport-local');
const uiAmmModule = require ('./aam_ui_module');
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

appServer.post ('/auth/newUser/',auth_module.addNewUser)

appServer.post('/Favorites/newItem/',uiAmmModule.fPutNewFavorite)

appServer.post('/Favorites/deleteItem/',uiAmmModule.fRemoveFavorite)

// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/treeMenu/',  jsPassport.authenticate('session') ,  uiAmmModule.FAmmGetAccountsList)

// -------------Get Tree for Tree Menu UI----------------------
appServer.get ('/AAM/portfolioTable/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetportfolioTable)

appServer.get ('/AAM/InstrumentData/',  jsPassport.authenticate('session') ,  uiAmmModule.fGetInstrumentData)

appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})