const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');

async function queryExecute (sql, response, responseType, sqlID) {
  return new Promise ((resolve) => {
    pool.query (sql,  (err, res) => {
      if (err) {
        console.log('sql',sql);
        console.log (sqlID,err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        resolve (response? response.send(err):err)
      } else {
        let rows = [];
        res.length? res.map(el => rows.push(...el.rows) ): rows = res.rows;
        result = responseType === 'rowCount'? rowsCount : rows;
        console.log('N:',new Date().getSeconds()+10, 'db_api; ', sqlID, ';  QTY rows ;', rows.length)
        resolve (response? response.status(200).json(result):result)
      }
    })
  })
} 
async function fUpdateTableDB (table, fields,idfieldName, request, response,dates) {
  return new Promise ((resolve) => {
    let fieldsWithQuetes =  fields.join('","')
    let values = fields.map(el=>{dates.includes(el)? '${'+el+'}::timestamptz':'${'+el+'}'});
    let updatePairs = fields.map(el=> dates.includes(el)? '"'+el+'"'+'=${'+el+'}::timestamptz': '"'+el+'"'+'=${'+el+'}');
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
          sql = pgp.as.format(sqlText,request.body.data);
    resolve(queryExecute (sql, response,undefined,'fUpdateTableDB '+request.body.action+' ',table))
  })
}
module.exports = {
  queryExecute,
  fUpdateTableDB,
}