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
  const entries = req.body.entry;
  for (let i = 0; i < entries.length; i++) {
    let messaging_events = entries[i].messaging;
    for (let j = 0; j < messaging_events.length; j++) {
      const event = messaging_events[j];
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
  }
  return res.sendStatus(200);
});

app.post('/bot/messenger/v1/notify/:id', function (req, res) {
  const json = req.body;
  const config = {
    sender_id: req.params.id,
    access_token: keys.access_token
  };

  if (json && json.length) {
    const msg = (json.length > 1) ? 'WATCHLIST_NOTIFICATION_MULTIPLE' : 'WATCHLIST_NOTIFICATION_SINGLE';
    const limit = (json.length > 10) ? 10 : json.length;
    let cards = [];
    let watchlistItems = [];
    for(let i = 0; i < limit; i += 1) {
      const deal = json[i];
      const lowestPrice = deal.lowest_price;
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
          'title': 'Stop watching',
          'payload': 'STOP_WATCHING_' + deal.watchlist_id
        }],
      });
      watchlistItems.push({
        id: deal.watchlist_id,
        low_price: lowestPrice
      });
    }
    facebook.sendTextMessage(config, messages[msg]);
    facebook.sendGenericTemplate(config, cards);
    return res.send({
      success: true,
      watchlist_items: watchlistItems
    });
  }

  return res.status(500).send({ error: 'No notifications found' })
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
      .then((response) => {
        const messageConstructor = (response.action === 'watchlist_item_updated') ? messages.REMIND_YOU : messages.LET_YOU_KNOW;
        return facebook.sendTextMessage(config, messageConstructor(response.item.game_name.substr(0, 150)));
      })
      .catch((err) => console.log(err));
  }

  match = text.match(/STOP_WATCHING_(\d+)/i);
  if (match && match[1]) {
    return api.removeFromWatchlist({ id: match[1] })
      .then((response) => {
        return facebook.sendTextMessage(config, messages.CONFIRM_STOP_WATCHING);
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
  const cleanAndNormalizedQuery = cleanQuery.replace(/[^a-zA-Z0-9]+/g, '');
  switch (cleanAndNormalizedQuery) {
    case 'hello': case 'hey': case 'hi':
    case 'helloyostik': case 'heyyostik': case 'hiyostik':
      return menus.randomGreeting(config);
    case 'thanks': case 'thankyou': case 'ty':
    case 'thanksyostik': case 'thankyouyostik': case 'tyyostik':
    case 'yourethebest': case 'yourthebest':
      return menus.randomYoureWelcome(config);
    case 'iloveyou': case 'iloveu':
    case 'iloveyouyostik': case 'iloveuyostik':
      return menus.randomLove(config, 'love');
    case 'ilikeyou': case 'ilikeu':
    case 'ilikeyouyostik': case 'ilikeuyostik':
      return menus.randomLove(config, 'like');
    case 'marryme': case 'marrymeyostik':
      return menus.randomLove(config, 'marry');
    case 'ihateyou': case 'ihateu': case 'yousuck': case 'usuck':
    case 'ihateyouyostik': case 'ihateuyostik': case 'yousuckyostik': case 'usuckyostik':
    case 'fuckyou': case 'fucku': case 'fuckyouyostik': case 'fuckuyostik':
      return menus.randomHate(config);
    case 'help': case 'helpme': case 'helpmeyostik': case 'ineedhelp':
      return menus.sendHelpMenu(config);
    case 'watchlist': case 'unsubscribe': case 'stop':
      return menus.sendWatchlist(config);
      // return menus.sendUnsubscribeConfirmation(config);
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
