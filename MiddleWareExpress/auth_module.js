const Module = require('module')
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require('pg-promise')({
  capSQL: true // to capitalize all generated SQL
});

async function encryptPsw (accessRole, login , password) {
  var hashedPassword;
  bcrypt.genSalt(10, (err,Salt) => {
    bcrypt.hash(password, Salt, (err, hash) => {
      if (err) {return console.log ('Cannot encrypt');}
      hashedPassword=hash;
      return new Promise ((resolve) => { 
        respArr =[accessRole, login, hashedPassword]
        resolve (respArr)
        const query = {
          text: "INSERT INTO public.dusers(accessrole, login, hashed_password) VALUES ($1, $2, $3) RETURNING *",
          values: respArr,
          rowMode: 'array'
        }
        pool.query (query, (err, res) => {if (err) {console.log (err.stack)}})
      })
    })
  })
}

async function addNewUser (request,response) {
response =  await encryptPsw (request.body.accessrole, request.body.username, request.body.password)
}

async function getUserRoles (request,response) {
  pool.query ({text : 'SELECT "roleName" from  public."aAccesRoles"; ',rowMode: "array"}, (err, res) => {
    if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows.flat())}
  })
}

async function getAccessRestriction (request,response) {
  const query = {
    text: ' SELECT id, accessrole, elementid, tsmodule, htmltemplate, elementtype, elementvalue ' +
    ' FROM public."aAccessConstraints"' + 
    ' WHERE accessrole=$1',
    values : [request.query.accessRole]
  }
  sql = pgp.as.format(query.text,query.values)
  pool.query ({text:sql,values:""}, (err, res) => {if (err) {console.log (err.stack)} else {return response.status(200).json(res.rows[0])}
  })
}

module.exports = {
  encryptPsw,
  addNewUser,
  getUserRoles,
  getAccessRestriction
}