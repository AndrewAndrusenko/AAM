const Module = require('module')
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require('pg-promise')({
  capSQL: true // to capitalize all generated SQL
});
var loginUser;
async function encryptPsw (accessRole, login , password, response) {
  var hashedPassword;
  loginUser=login;
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
  let sql;
  switch (request.query.action) {
    case 'getAccessRestriction':
    sql = 'SELECT id, accessrole, elementid, tsmodule, htmltemplate, elementtype, elementvalue FROM public."aAccessConstraints"' + 
    ' WHERE accessrole = ${accessRole};' 
    break;
    case 'getObjectStatuses':
    sql = 'SELECT id_object, status_code, step 	FROM public."aObjectsStatuses" ORDER BY id_object, step  ;' 
    break;
   }
  sql = pgp.as.format(sql,request.query)
  pool.query ({text:sql,values:""}, (err, res) => {if (err) {console.log (err.stack)} else  return  response.status(200).json(res.rows)})
}
module.exports = {
  encryptPsw,
  addNewUser,
  getUserRoles,
  getLoginsArray,
  getAccessRestriction
}