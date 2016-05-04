'use strict';

const fetch = require('node-fetch');
const api = require('./api');

function sendTextMessage(config, text, replyContext) {
  const messageData = {
    text: text
  };
  return sendMessage(config, messageData, replyContext);
}

function sendButtonMessage(config, text, buttons, replyContext) {
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
  return sendMessage(config, messageData, replyContext);
}

function sendGenericTemplate(config, cards, replyContext) {
  const messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": cards
      }
    }
  };
  return sendMessage(config, messageData, replyContext);
}

function sendMessage(config, messageData, replyContext) {
  return fetch('https://graph.facebook.com/v2.6/me/messages?access_token=' + config['access_token'], {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: { id: config['sender_id'] },
      message: messageData
    })
  })
  .then((res) => res.json())
  .then(() => {
    if (replyContext !== undefined) {
      return api.setReplyContext(config, replyContext);
    }
    return this;
  })
  .catch((err) => console.log('Error sending message: ', err));
}

module.exports = {
  sendTextMessage: sendTextMessage,
  sendButtonMessage: sendButtonMessage,
  sendGenericTemplate: sendGenericTemplate,
  sendMessage: sendMessage
};
