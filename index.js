'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const keys = require('./.keys/facebook');
const facebook = require('./src/facebook');
const messages = require('./src/constants/messages');

const app = express();

app.use(bodyParser.json());

app.get('/bot/messenger/v1/webhook', function (req, res) {
  if (req.query['hub.verify_token'] === keys['verify_token']) {
    return res.send(req.query['hub.challenge']);
  }
  return res.send('Error, wrong validation token');
});

app.post('/bot/messenger/v1/webhook', function (req, res) {
  const messaging_events = req.body.entry[0].messaging;
  for (let i = 0; i < messaging_events.length; i++) {
    const event = req.body.entry[0].messaging[i];
    const sender = event.sender.id;
    const config = {
      sender: sender,
      access_token: keys.access_token
    };
    if (event.message && event.message.text) {
      parseQuery(event.message.text, config);
    }
    if (event.postback) {
      const text = JSON.stringify(event.postback);
      facebook.sendTextMessage(config, 'Postback received: ' + text.substring(0, 200));
    }
  }
  return res.sendStatus(200);
});

const platformsMap = {
  'PS4': 1,
  'PS3': 2,
};

const platformsIdMap = {
  1: 'PS4',
  2: 'PS3'
};

function getSearchObject(query) {
  for (var key in platformsMap) {
    if (query.indexOf(key.toLowerCase()) !== -1) {
      return {
        game: query.replace(new RegExp(`(for )?${key}`, 'i'), ''),
        platform: platformsMap[key]
      }
    }
  }
  return {
    game: query,
    platform: false
  };
}

function parseSearchGame(query) {
  const re = /(search (for)?|look (for|up)?|find (me)?)(.*)/i;
  const match = query.match(re);
  if (match !== null && match[5]) {
    return getSearchObject(match[5].toLowerCase().trim());
  }
  return false;
}

function parseQuery(query, config) {
  // Search Game
  const searchObject = parseSearchGame(query);
  if (searchObject !== false) {
    // TODO: Request search
    const results = [];
    if (results.length > 0) {
      facebook.sendTextMessage(config, 'found something!');
    } else {
      console.log(searchObject);
      if(searchObject.platform) {
        const button = {
          'type': 'postback',
          'title': 'Try other platform',
          'payload': {
            'type': 'RETRY_SEARCH',
            'query': searchObject.game
          }
        };
        facebook.sendButtonMessage(config, messages.GAME_NOT_FOUND + searchObject.game + ' for ' + platformsIdMap[searchObject.platform], [button]);
      } else {
        facebook.sendTextMessage(config, messages.GAME_NOT_FOUND + searchObject.game);
      }
    }
  } else {
    // TODO: Search if Query is Game
    facebook.sendTextMessage(config, messages.UNRECOGNIZED_QUERY);
  }
};

app.listen(8123, '0.0.0.0', function () {
  console.log('Facebook Messenger bot started on port 8123');
});
