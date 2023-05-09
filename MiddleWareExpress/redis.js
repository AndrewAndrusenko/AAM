const uiAmmMarketData = require ('./aam_ui_market_data_load')
const redis = require('redis');
const client = redis.createClient();
client.on('error', err => console.log('Redis Client Error', err));
async function TestRedis (request,response) {
  await client.connect();
  // await client.hDel('age')
  await client.hSet('user-session:123', {
    name: 'TestAAA',
  })
}
async function redisSetInstrumentList (request, response) {
  let instrumentsData = await uiAmmMarketData.fGetMoexInstruments(request={query:{rowslimit:50000}},response);
  await client.hSet('user-session:123', {data:JSON.stringify(instrumentsData)} ).then (async data => {
    let instrumentsData = await client.hGetAll('user-session:123');
    console.log('SetInstrumentList ',JSON.parse(instrumentsData.data).length);
  })
} 
async function redisGetInstrumentList (request, response) {
  let instrumentsData = await client.hGetAll('user-session:123')
  console.log('redisGetInstrumentList', JSON.parse(instrumentsData.data).length);
  return response.status(200).send(instrumentsData.data)
} 
module.exports = {
  TestRedis,
  redisGetInstrumentList,
  redisSetInstrumentList
}