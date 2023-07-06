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
        let rows = [];
        res.length? res.map(el => rows.push(...el.rows) ): rows = res.rows;
        result = responseType === 'rowCount'? rowsCount : rows;
        console.log('db_common_api ------------------- QTY rows', rows.length)
        resolve (response? response.status(200).json(result):result)
        // let rowsCount = res.length? res.reduce((acc,el) => acc+el.rowCount,0) : res.rowCount;
        // console.log('db_common_api ------------------- QTY rows', rows)
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