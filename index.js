'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const keys = require('./.keys/facebook');

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
    if (event.message && event.message.text) {
      parseQuery(event.message.text, sender);
    }
    if (event.postback) {
      const text = JSON.stringify(event.postback);
      sendTextMessage(sender, 'Postback received: ' + text.substring(0, 200));
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
    if (query.indexOf(key) !== -1) {
      return {
        game: query.replace(new RegExp(`(for )?${key}`), ''),
        platform: key
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

function parseQuery(query, sender) {
  // Search Game
  const searchObject = parseSearchGame(query);
  if (searchObject !== false) {
    // TODO: Request search
    const results = [];
    if (results.length > 0) {
      sendTextMessage(sender, 'found something!');
    } else {
      if(searchObject.platform) {
        const button = {
          'type': 'postback',
          'title': 'Try other platform',
          'payload': {
            'type': 'RETRY_SEARCH',
            'query': searchObject.game
          }
        };
        sendButtonMessage(sender, messages.GAME_NOT_FOUND + searchObject.game + ' for ' + platformsIdMap[searchObject.platform], [button]);
      } else {
        sendTextMessage(sender, messages.GAME_NOT_FOUND);
      }
    }
  } else {
    // TODO: Search if Query is Game
    sendTextMessage(sender, messages.UNRECOGNIZED_QUERY);
  }
};

function sendTextMessage(sender, text) {
  const messageData = {
    text: text
  };
  sendMessage(sender, messageData);
}

function sendButtonMessage(sender, text, buttons) {
  const messageData = {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'button',
        'text': text,
        'buttons': buttons
      }
    }
  };
  sendMessage(sender, messageData);
}

function sendGenericTemplate(sender) {
  const messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  };
  sendMessage(sender, messageData);
}

function sendMessage(sender, messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: keys['access_token'] },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

app.listen(8123, '0.0.0.0', function () {
  console.log('Facebook Messenger bot started on port 8123');
});
