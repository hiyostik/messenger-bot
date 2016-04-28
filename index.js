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
    if (event.message && event.message.text) {
      parseQuery(event.message.text, config);
    }
    if (event.postback) {
      parsePostback(JSON.stringify(event.postback), config);
    }
  }
  return res.sendStatus(200);
});

const platformsMap = {
  'PS4': 1,
  'PS3': 2,
  'PS Vita': 3,
  'PSP': 4,
  'playstation': 1,
  'playstation 4': 1,
  'playstation 3': 2,
  'vita': 3
};

const platformsIdMap = {
  1: 'PS4',
  2: 'PS3',
  3: 'PS Vita',
  4: 'PSP'
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

function parsePostback(text, config) {
  let match;
  match = text.match(/ADD_TO_WATCHLIST_(\d+)/i);
  if (match && match[1]) {
    // Look for game_id
    // Save in watchlist table
    // Respond
    const gameName = match[1];
    return facebook.sendTextMessage(config, messages.LET_YOU_KNOW(gameName));
  }

  match = text.match(/RETRY_SEARCH_FOR_QUERY_(\d+)/i);
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
  return api.search(searchObject.game.trim(), searchObject.platform)
    .then((json) => {
      const results = json.results;
      if (results.length > 0) {
        let cards = [];
        for(let i = 0; i < results.length; i += 1) {
          const deal = results[i];
          const lowestPrice = deal.deal_price || deal.normal_price;
          cards.push({
            'title': deal.title,
            'subtitle': `${platformsIdMap[deal.platform_id]} | \$${lowestPrice}\nPlayStation Store`,
            'image_url': deal.image_url || 'https://yostikapp.com/site/images/yostik_full_logo.png',
            'buttons': [{
              'type': 'web_url',
              'title': 'Get this deal',
              'url': deal.url
            }, {
              'type': 'postback',
              'title': 'Add to watchlist',
              'payload': 'ADD_TO_WATCHLIST_' + deal.game_id,
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
