const config = require ('./db_config');
const Pool = require('pg').Pool;
const pool = new Pool(config.dbConfig);
var pgp = require ('pg-promise')({capSQL:true});
const pg = require('pg');
pg.types.setTypeParser(1114, function(stringValue) {
  return stringValue;  //1114 for time without timezone type
});
async function fGetAccountingData (request,response) {
  const query = {text: ''}
  switch (request.query.Action) {
    case 'bcTransactionType_Ext':
      query.text = 'SELECT id, TRIM("xActTypeCode_Ext") as "xActTypeCode_Ext", description, code2 FROM public."bcTransactionType_Ext" ORDER BY "xActTypeCode_Ext"; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId" '+
                  'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {
    return response.status(200).json((res.rows))}
  })
}


async function fGetMT950Transactions (request,response) {
  const query = {text: ''}
  switch (request.query.Action) {
    case 'GetSWIFTsList':
      query.text = 'SELECT ' + 
      ' id, "msgId", "senderBIC", "DateMsg", "typeMsg", "accountNo", "bLedger"."ledgerNo" '+ 
      ' FROM public."bGlobalMsgSwift" ' +
      ' LEFT JOIN public."bLedger" ON "bGlobalMsgSwift"."accountNo" = "bLedger"."externalAccountNo" '+
      ' ORDER BY id; '
    break;
    case 'GetMT950Transactions':
      query.text ='SELECT '+
                  'id, "msgId", "amountTransaction", "typeTransaction", "valueDate", comment, "entryAllocatedId", "refTransaction" '+
                  'FROM public."bStatementSWIFT" WHERE ("msgId"= $1) ORDER BY "msgId", id; '
      query.values = [request.query.id]
    break;
  }
  pool.query (query, (err, res) => {if (err) {console.log (err.stack)} else {return response.status(200).json((res.rows))}
  })
}


async function GetEntryScheme (request, response) {
  console.log('request.GetEntryScheme', request.query);

  const query = {
    text:'SELECT '+
         '"ledgerNo", "dataTine", quote_literal ("XactTypeCode") as "XactTypeCode", ' +
         'quote_literal ("XactTypeCode_Ext") as "XactTypeCode_Ext" , "accountID", "amountTransaction", '+
         '"accountNo", quote_literal ("entryDetails") as "entryDetails" '+
         'FROM public."bcSchemeAccountTransaction" '+
         'WHERE '+
         '("cxActTypeCode_Ext" = ${cxActTypeCode_Ext} AND "cxActTypeCode" = ${cxActTypeCode} AND "cLedgerType" = ${cLedgerType});'
  }

  sql = pgp.as.format(query.text,request.query)
  console.log('sql', sql);
  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    if (res.rows.length !== 0) {
      console.log('res',res.rows[0]);
      let fields =  Object.keys(res.rows[0]);
      let values = Object.values(res.rows[0]);
      fieldsInQuotes =  fields.map (field => `"${field}"`).join() 
      // valuesInQuotes =  values.map (value => `'${value}'`).join() 
      valuesInQuotes = values.join ()
      // console.log('fields', fieldsInQuotes);
      console.log('valuesInQuotes',valuesInQuotes);
      query.text = 'INSERT INTO  public."bTestAccountTransaction" (' + fieldsInQuotes + ') ' +
                   'VALUES (' + valuesInQuotes + ');'
      sql = pgp.as.format(query.text,request.query)
      console.log('INSERT', sql);

      pool.query (sql,  (err, res) => {if (err) {
        console.log (err.stack.split("\n", 1).join(""))
        err.detail = err.stack
        return response.send(err)
      } else {
        console.log('inserted', res.rowCount);
      }})

    }
  }
  })
 /*  paramArr = request.body.data
  query = {
  text: 'INSERT INTO public.dportfolios ' +
        '(idclient, idstategy, portfolioname, portleverage)' +
        ' VALUES (${idclient}, ${idstategy}, ${portfolioname}, ${portleverage}) ;',
    values: paramArr
  }
  sql = pgp.as.format(query.text,query.values)

  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })  */ 
}


async function ftEntryCreateTest (request, response) {
  paramArr = {
    idclient:122,
    ref:'AAZZREFdsfsd11',
    numId:10 
  }
  console.log('PARAM',paramArr);
  const query = {
  text: 'INSERT INTO public."1Temp" ' +
        '("TextT", "numId")' +
        " VALUES ('entry ${idclient:raw} some text ref ${ref:raw} finish '  , ${numId}) ;",
    values: paramArr
  }
  
  sql = pgp.as.format(query.text,query.values)
  console.log('sql',sql);

  pool.query (sql,  (err, res) => {if (err) {
    console.log (err.stack.split("\n", 1).join(""))
    err.detail = err.stack
    return response.send(err)
  } else {
    return response.status(200).json(res.rowCount)}
  })   
}

module.exports = {
  fGetMT950Transactions,
  fGetAccountingData,
  GetEntryScheme,
  ftEntryCreateTest
}