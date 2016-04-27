'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const keys = require('./.keys/facebook');

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
      var text = event.message.text;
      sendTextMessage(sender, 'Text received, echo: ' + text.substring(0, 200));
    }
  }
  return res.sendStatus(200);
});

function sendTextMessage(sender, text) {
  const messageData = {
    text: text
  };

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
