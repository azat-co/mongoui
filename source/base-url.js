
module.exports.API_URL = formatUrlString(inheritUrl({
  protocol: PUB_API_PROTO,
  host: PUB_API_HOST,
  port: PUB_API_PORT,
}));

console.log(module.exports.API_URL);

function formatUrlString(uri){
  return `${uri.protocol}://${uri.host}:${uri.port}`;
}

function inheritUrl(uri){
  return Object.assign( uri && PUB_API_WINDOW === false ? {} : {
    protocol: window.location.protocol,
    host: window.location.host,
    port: window.location.port,
  }, uri || {});
}
