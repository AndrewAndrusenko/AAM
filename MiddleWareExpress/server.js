const express = require ('express')
const bodyParser = require('body-parser')
const appServer = express()
const port = 3000

const uiAmmModule = require ('./aam_ui_module')

appServer.use (express.static('public'));
appServer.use(bodyParser.json());
appServer.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
appServer.use((req, res, next) => {
  res.append('Access-Control-Allow-Methods', 'GET, PUT, POST,DELETE');
  res.append ('Access-Control-Allow-Origin', '*')
  next();
})


appServer.get ('/AAM/Accounts/', uiAmmModule.FAmmGetAccountsList)

appServer.listen (port,'localhost', () => {console.log (`AAM Server is running on port ${port}`)})