const Module = require('module')
const bcrypt = require('bcryptjs');
const config = require('./db_config');
const Pool = require('pg').Pool;
const Client = require('pg').Client;

const pool = new Pool(config.dbConfig);
const client = new Client (config.dbConfig);

async function encryptPsw (accessRole, login , password) {
  console.log('encryptPsw', password)
  // password = request.params.psw
  var hashedPassword;
  bcrypt.genSalt(10, (err,Salt) => {
    bcrypt.hash(password, Salt, (err, hash) => {
      if (err) {return console.log ('Cannot encrypt');}
      console.log(hash);
      hashedPassword=hash;

      return new Promise ((resolve) => { 
        respArr =[accessRole, login, hashedPassword]
        resolve (respArr)
        console.log(respArr)      
        const query = {
          text: "INSERT INTO public.dusers( accessrole, login, hashed_password) VALUES ($1, $2, $3) RETURNING *",
          values: respArr,
          rowMode: 'array'
        }
     
        pool.query (query, (err, res) => {
          if (err) {console.log (err.stack) 
          } else {
            console.log (res.rows[0])
          }
        })
      })

    })

  })
}

async function addNewUser (request,response) {

console.log (request.body)
response =  await encryptPsw (request.body.accessrole, request.body.username, request.body.password)
}

module.exports = {
  encryptPsw,
  addNewUser
}