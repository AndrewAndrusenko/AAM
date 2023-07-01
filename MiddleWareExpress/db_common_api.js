const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');

async function queryExecute (sql, response, responseType) {
  return new Promise ((resolve) => {
    console.log('sql',sql);
    pool.query (sql,  (err, res) => {
      if (err) {
        console.log (err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        resolve (response? response.send(err):err)
      } else {
        console.log('db_common_api ------------------- QTY rows',responseType==='rowCount'? res.rowCount:res.rows.length)
        let result = responseType === 'rowCount'? res.rowCount : res.rows;
        resolve (response? response.status(200).json(result):result)
      }
    })
  })
} 
async function fUpdateTableDB (table, fields,idfieldName, request, response) {
  return new Promise ((resolve) => {
    let fieldsWithQuetes =  fields.join('","')
    let values = fields.map(el=>'${'+el+'}');
    let updatePairs = fields.map(el=> '"'+el+'"'+'=${'+el+'}');
    switch (request.body.action) {
      case 'Create':
        sqlText = 'INSERT INTO public."'+ table +'" ("'+ fieldsWithQuetes +'") VALUES ('+ values + ') RETURNING *;'
        break;
        case 'Edit':
          sqlText = 'UPDATE public."'+ table +'" SET ' + updatePairs + ' WHERE "'+ idfieldName +'"=${'+ idfieldName +'} RETURNING *'
          break;
          case 'Delete':
            sqlText = 'DELETE FROM public."'+ table +'" WHERE "'+ idfieldName +'"=${'+ idfieldName +'} RETURNING *;'
            break;
          }
          console.log(request.body.data);
          console.log(sqlText);
          sql = pgp.as.format(sqlText,request.body.data);
          console.log('pgp - sql',sql);
    resolve(queryExecute (sql, response))
  })
}
module.exports = {
  queryExecute,
  fUpdateTableDB,
}