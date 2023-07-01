const Module = require('module')
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const { log } = require('console');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require('pg-promise')({
  capSQL: true // to capitalize all generated SQL
});
async function encryptPsw (accessRole, login , password, response) {
  var hashedPassword;
  bcrypt.genSalt(10, (err,Salt) => {
    bcrypt.hash(password, Salt, (err, hash) => {
      if (err) {return console.log ('Cannot encrypt');}
      hashedPassword=hash;
      return new Promise ((resolve) => {  
        respArr =[accessRole, login, hashedPassword]
        const query = {
          text: "INSERT INTO public.dusers(accessrole, login, hashed_password) VALUES ($1, $2, $3) RETURNING *",
          values: respArr,
        }
         pool.query (query, (err, res) => {if (err) {response.status(403).json(err.stack)} else {
          console.log(' query encryptPsw',res.rows[0]);
          response.status(200).json(res.rows[0])
          resolve ( res.rows[0])
        }})
      })
    })
  })
}
async function addNewUser (request,response) {
  encryptPsw (request.body.accessrole, request.body.username, request.body.password,response)
}
async function getUserRoles (request,response) {
  pool.query ({text : 'SELECT "roleName" from  public."aAccesRoles"; ',rowMode: "array"}, (err, res) => {
    if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows.flat())}
  })
}
async function getLoginsArray (request,response) {
  pool.query ({text : 'SELECT "login" from  public."dusers"; ',rowMode: "array"}, (err, res) => {
    if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows.flat())}
  })
}
async function getAccessRestriction (request,response) {
  const query = {
    text: ' SELECT id, accessrole, elementid, tsmodule, htmltemplate, elementtype, elementvalue ' +
    ' FROM public."aAccessConstraints"' + 
    ' WHERE accessrole = $1',
    values : [request.query.accessRole]
  }
  if (request.query.elementid) {
    query.text +=' AND elementid=$2';
    query.values.push(request.query.elementid)
  }
  sql = pgp.as.format(query.text,query.values)
  console.log('getAccessRestriction------------',sql );
  pool.query ({text:sql,values:""}, (err, res) => {if (err) {console.log (err.stack)} else {
    return request.query.elementid?  response.status(200).json(res.rows[0]) : response.status(200).json(res.rows)
  }
  })
}
module.exports = {
  encryptPsw,
  addNewUser,
  getUserRoles,
  getLoginsArray,
  getAccessRestriction
}