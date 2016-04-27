'use strict';

const Hapi = require('hapi');
const keys = require('./.keys/facebook');

const server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: 8123
});

server.route({
  method: 'GET',
  path: '/bot/messenger/v1/webhook',
  handler: function(request, reply) {
    if (request.query['hub.verify_token'] === keys['verify_token']) {
      return reply(request.query['hub.challenge']);
    }
    return reply('Error, wrong validation token');
  }
});

server.route({
  method: 'POST',
  path: '/bot/messenger/v1/webhook',
  handler: function(request, reply) {
    reply({
      response: 'from POST'
    });
  }
});

server.start((err) => {
  if (err) {
      throw err;
  }
  console.log('Server running at:', server.info.uri);
});
