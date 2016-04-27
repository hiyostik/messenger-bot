'use strict';

const Hapi = require('hapi');

const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: 8123
});

server.route({
  method: 'GET',
  path: '/bot/messenger/v1/webhook',
  handler: function(request, reply) {
    reply('Hello from the Messenger webhook');
  }
});

server.start((err) => {
  if (err) {
      throw err;
  }
  console.log('Server running at:', server.info.uri);
});
