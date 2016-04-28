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

function sendGenericTemplate(config) {
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
