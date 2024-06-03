const ngrok = require('@ngrok/ngrok');

async function ngSetup() {
  const sessionNG = await new ngrok.SessionBuilder()
  .authtoken('2gWGuTLYVjfgBvJ7fWBfaCHPDLF_9xGdw8AGWWnK7EF63BqM')
  .metadata("Online in One Line")
  .connect();
  const listener = await sessionNG
  .httpEndpoint()
  .domain('parrot-organic-overly.ngrok-free.app')
  // .allowCidr("0.0.0.0/0")
  // .oauth("google")
  .requestHeader("X-Req-Yup", "true")
  .listen();
  const socket = await ngrok.listen(appServer, listener);
  console.log(`Ingress established at: ${listener.url()}`);
  console.log(`Express listening on: ${socket.address()}`);
}
// RedisService.TestRedis();
// RedisService.redisSetInstrumentList();

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')