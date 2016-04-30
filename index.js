'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const keys = require('./.keys/facebook');
const facebook = require('./src/facebook');
const api = require('./src/api');
const menus = require('./src/bot/menus');
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
    const config = {
      sender_id: event.sender.id,
      access_token: keys.access_token
    };
    const messageEvent = {
      messenger_platform_id: 1,
      external_user_id: config.sender_id,
    };
    if (event.message && event.message.text) {
      messageEvent.external_message_id = event.message.mid;
      messageEvent.type = 'message';
      messageEvent.text = event.message.text;
      logMessage(messageEvent);
      parseQuery(event.message.text, config);
    }
    if (event.postback && event.postback.payload) {
      messageEvent.external_message_id = 'pid.' + event.timestamp; // Making this up, there's no ID for a postback
      messageEvent.type = 'postback';
      messageEvent.text = event.postback.payload;
      logMessage(messageEvent);
      parsePostback(event.postback.payload, config);
    }
  }
  return res.sendStatus(200);
});

const platformsMap = {
  'PS4': 1,
  'PS3': 2,
  'PS Vita': 3,
  'PSP': 4,
  'playstation 4': 1,
  'playstation 3': 2,
  'playstation': 1,
  'vita': 3,
  'xbox one': 5,
  'xbox 1': 5,
  'xbox 360': 6,
  'xbox': 5,
  'xone': 5,
  'xboxone': 5,
  'xbox360': 6,
  'x360': 6,
  '360': 6,
  'pc': 7,
  'windows': 7
};

const platformsIdMap = {
  1: 'PS4',
  2: 'PS3',
  3: 'PS Vita',
  4: 'PSP',
  5: 'Xbox One',
  6: 'Xbox 360',
  7: 'PC',
  8: 'Mac',
  9: 'Linux'
};

const storesMap = {
  1: 'PlayStation Store',
  2: 'Steam',
  3: 'Amazon.com',
  4: 'Gog.com',
  5: 'Humble Store',
  6: 'WinGameStore'
};

function logMessage(messageEvent) {
  return api.logMessage(messageEvent);
}

function getSearchObject(query) {
  for (var key in platformsMap) {
    if (query.indexOf(key.toLowerCase()) !== -1) {
      return {
        game: query.replace(new RegExp(`(for )?${key}`, 'i'), '').trim(),
        platform: platformsMap[key]
      }
    }
  }
  return {
    game: query.trim(),
    platform: false
  };
}

function parsePostback(text, config) {
  let match;
  match = text.match(/ADD_TO_WATCHLIST_(\d+)_(\d+)_(.+)/i);
  if (match && match[1] && match[2] && match[3]) {
    const watchlistItem = {
      messenger_platform_id: 1,
      external_user_id: config.sender_id,
      game_id: match[1],
      platform_id: match[2],
      low_price: match[3]
    };
    return api.addToWatchlist(watchlistItem)
      .then((item) => {
        return facebook.sendTextMessage(config, messages.LET_YOU_KNOW(item.game_name.substr(0, 150)));
      })
      .catch((err) => console.log(err));
  }

  match = text.match(/RETRY_SEARCH_FOR_QUERY_(.+)/i);
  if (match && match[1]) {
    return parseQuery(`search ${match[1]}`, config);
  }
}

function parseSearchGame(query) {
  const re = /(search (for)?|look (for|up)?|find (me)?)(.*)/i;
  const match = query.match(re);
  if (match !== null && match[5]) {
    return getSearchObject(match[5].trim());
  }
  return false;
}

function parseQuery(query, config) {
  const cleanQuery = query.toLowerCase().trim();
  switch (cleanQuery) {
    case 'help':
      return menus.sendHelpMenu(config);
    case 'watchlist':
      return menus.sendWatchlist(config);
    case 'unsubscribe':
      return menus.sendUnsubscribeConfirmation(config);
    default:
      // Not a simple keyword, continue looking
      break;
  }

  let searchObject;
  // Check if it's a game search
  searchObject = parseSearchGame(cleanQuery);
  if (searchObject !== false) {
    return searchDeal(searchObject, config);
  }

  // Check if it's an implicit game search
  searchObject = parseSearchGame(`search ${cleanQuery}`);
  if (searchObject !== false) {
    return searchDeal(searchObject, config);
  }

  return facebook.sendTextMessage(config, messages.UNRECOGNIZED_QUERY);
};

function searchDeal(searchObject, config) {
  return api.search(searchObject.game, searchObject.platform)
    .then((json) => {
      const results = json.results;
      if (results.length > 0) {
        let cards = [];
        for(let i = 0; i < results.length; i += 1) {
          const deal = results[i];
          const lowestPrice = deal.deal_price || deal.normal_price;
          let price = `\$${parseFloat(lowestPrice).toFixed(2)}`;
          price += (deal.discount_percent) ? ` | ${deal.discount_percent}% OFF!` : '';
          cards.push({
            'title': deal.title,
            'subtitle': `${platformsIdMap[deal.platform_id]} | ${price}\n${storesMap[deal.store_id]}`,
            'image_url': deal.image_url || 'https://yostikapp.com/site/images/yostik_full_logo.png',
            'buttons': [{
              'type': 'web_url',
              'title': 'Get this deal',
              'url': deal.url
            }, {
              'type': 'postback',
              'title': 'Watch for price drop',
              'payload': 'ADD_TO_WATCHLIST_' + deal.game_id + '_' + deal.platform_id + '_' + lowestPrice,
            }],
          });
        }
        facebook.sendTextMessage(config, messages.GAME_FOUND);
        facebook.sendGenericTemplate(config, cards);
      } else {
        if(searchObject.platform) {
          const button = {
            'type': 'postback',
            'title': messages.TRY_ANOTHER_PLATFORM,
            'payload': 'RETRY_SEARCH_FOR_QUERY_' + searchObject.game
          };
          facebook.sendButtonMessage(config, messages.GAME_NOT_FOUND + searchObject.game + ' for ' + platformsIdMap[searchObject.platform], [button]);
        } else {
          facebook.sendTextMessage(config, messages.GAME_NOT_FOUND + searchObject.game);
        }
      }
    });
}

app.listen(8123, '0.0.0.0', function () {
  console.log('Facebook Messenger bot started on port 8123');
});
