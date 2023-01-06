const express = require ('express')
const bodyParser = require('body-parser')
const appServer = new express()
const port = 3000
const jsPassport = require ('passport')
var LocalStrategy = require('passport-local');
const uiAmmModule = require ('./aam_ui_module');
const auth_module = require('./auth_module');

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

appServer.use((req, res, next) => {
  res.append('Access-Control-Allow-Methods', 'GET, PUT, POST,DELETE');
  res.append ('Access-Control-Allow-Origin', '*');
  res.append ("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

//appServer.use(session({ secret: 'SECRET' }));

appServer.use(jsPassport.initialize());
appServer.use(jsPassport.session());


/* const isLoggedIn = (req, res, next) => {
 console.log('isLoggedIn',  req.username, req.isAuthenticated())
  if (req.isAuthenticated()) {return next()}
  return res.status(400).json({"statusCode" : 400, "message" : "not authenticated"})    
}
// http://localhost:3000/authenticate/{"username":"mofficer","password":"middle"}

const authFunc = () => {
  console.log('authFunc')
  return (req, res, next) => {
  
    jsPassport.authenticate('local',(error, user, info) => {
      console.log('authenticate')
      if (error) res.status(400).json({"statusCode" : 200, "message" : error});
      req.login (user, function (error) {
        console.log('login')
        console.log(user)
        if (error) return next(error);
        next();
      });
    })(req, res, next);
  }
} 
 */
jsPassport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    console.log('serializeUser')
    return cb(null, {
      id: user.id,
      username: user.username
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
  
  pool.query ("SELECT accessrole, login, hashed_password FROM public.dusers WHERE login = '" + username + "';", (err, row) => {
    console.log(row)
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    crypto.pbkdf2(password, 'bf', 310000, 32, 'sha256', function(err, hashedPassword) {
      console.log(hashedPassword,'  ', password)
      console.log(row.rows[0].hashed_password ,'  ', password)
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(row.rows[0].hashed_password, hashedPassword)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row);
    });
  });
}));


appServer.post ('/auth/', jsPassport.authenticate('local', {
  successRedirect: '/general',
  failureRedirect: '/login'
}));
appServer.get ('/AAM/Accounts/',  jsPassport.authenticate('session') ,  uiAmmModule.FAmmGetAccountsList)

 appServer.get ('/auth/newUserP/:psw', auth_module.encryptPsw)

 appServer.post ('/auth/newUser/',auth_module.addNewUser)

appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})