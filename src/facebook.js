const request = require('request');

function sendTextMessage(config, text) {
  const messageData = {
    text: text
  };
  sendMessage(config, messageData);
}

function sendButtonMessage(config, text, buttons) {
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
  sendMessage(config, messageData);
}

function sendGenericTemplate(config, cards) {
  const messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": cards
      }
    }
  };
  sendMessage(config, messageData);
}

function sendMessage(config, messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config['access_token'] },
    method: 'POST',
    json: {
      recipient: { id: config['sender_id'] },
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

module.exports = {
  sendTextMessage: sendTextMessage,
  sendButtonMessage: sendButtonMessage,
  sendGenericTemplate: sendGenericTemplate,
  sendMessage: sendMessage
};
