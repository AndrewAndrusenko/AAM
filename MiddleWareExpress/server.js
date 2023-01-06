const express = require ('express')
const bodyParser = require('body-parser')
const appServer = new express()
const port = 3000
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
  process.nextTick(function() {
    console.log('serializeUser', user.id, user.login)
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
  
  pool.query ("SELECT id, accessrole, login, hashed_password FROM public.dusers WHERE login = '" + username + "';", (err, row) => {
  
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }


    bcrypt.compare(password, row.rows[0].hashed_password,
      async function (err, isMatch) {
        
      if (isMatch) {
      return cb(null, row.rows[0]) 
      console.log('Encrypted password is: ', password);
      console.log('Decrypted password is: ', hashedPassword);
      }
      if (!isMatch) {  
      return cb(null, false, { message: 'Incorrect username or password.' })
      console.log(hashedPassword + ' is not encryption of '+ password);
      }
      })
  });
}));


appServer.post ('/auth/', jsPassport.authenticate('local'), function(req, res) {  
  console.log ('req', req.user)
  res.json({message:"Success", username: req.user});
});


appServer.get ('/AAM/Accounts/',  jsPassport.authenticate('session') ,  uiAmmModule.FAmmGetAccountsList)

 appServer.get ('/auth/newUserP/:psw', auth_module.encryptPsw)

 appServer.post ('/auth/newUser/',auth_module.addNewUser)

appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})