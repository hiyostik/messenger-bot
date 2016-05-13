'use strict';

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const JSONbig = require('json-bigint');
const keys = require('./.keys/facebook');
const facebook = require('./src/facebook');
const api = require('./src/api');
const queryHelper = require('./src/queryHelper');
const menus = require('./src/bot/menus');
const onboarding = require('./src/bot/onboarding');
const messages = require('./src/constants/messages');

const app = express();

// app.use(bodyParser.json());
app.use(function(req, res, next){
  if (req.method == 'POST') {
    var body = '';

    req.on('data', function (data) {
      body += data;

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > 1e6)
        req.connection.destroy();
    });

    req.on('end', function () {
      // console.log(body); // should work
        // use post['blah'], etc.
      req.body = JSONbig.parse(body)
      next()
    });
  }
});

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
        api.getOrCreateUser(config).then((user) => {
          logMessage(messageEvent);
          parseQuery(event.message.text, config, user);
        });
      }
      if (event.postback && event.postback.payload) {
        messageEvent.external_message_id = 'pid.' + event.timestamp; // Making this up, there's no ID for a postback
        messageEvent.type = 'postback';
        messageEvent.text = event.postback.payload;
        api.getOrCreateUser(config).then((user) => {
          logMessage(messageEvent);
          parsePostback(event.postback.payload, config, user);
        });
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
      let price = (lowestPrice > 0) ? `\$${parseFloat(lowestPrice).toFixed(2)}` : `FREE`;
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

function parsePostback(text, config, user) {
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
    return parseQuery(`search ${match[1]}`, config, user, { retrySearch: true });
  }

  match = text.match(/ADD_PLATFORM_(.+)/i);
  if (match && match[1]) {
    const isOnboarding = (user.data.reply_context && user.data.reply_context.indexOf('onboarding.') > -1);
    const menuObj = (isOnboarding) ? onboarding : menus;
    if (match[1] === 'OTHER') {
      return (isOnboarding) ? onboarding.skipOther(config, user) : menus.otherPlatform(config, user);
    }

    return api.addPlatform(config, match[1])
      .then((json) => menuObj.confirmAddPlatform(config, user, json.platform));
  }

  match = text.match(/REMOVE_PLATFORM_(.+)/i);
  const isOnboarding = (user.data.reply_context && user.data.reply_context.indexOf('onboarding.') > -1);
  const menuObj = (isOnboarding) ? onboarding : menus;
  if (match && match[1]) {
    return api.removePlatform(config, match[1])
      .then((json) => menuObj.confirmRemovePlatform(config, user));
  }

  match = text.match(/ADD_ANOTHER_PLATFORM_(.+)/i);
  if (match && match[1]) {
    const isOnboarding = (user.data.reply_context && user.data.reply_context.indexOf('onboarding.') > -1);
    if (match[1] === 'YES') {
      // I use this method because it's the same message and cards, but
      // the method should have a better name...
      return (isOnboarding) ? onboarding.cancelSkip(config, user) : menus.sendPlatformsMenu(config, user);
    }

    if (match[1] === 'NO') {
      if (!isOnboarding) {
        return menus.exitSettings(config, user);
      }
      const hasSonyPlatform = _.some(user.data.platforms, (p) => (p.id >= 1 && p.id <= 3));
      if (hasSonyPlatform) {
        return onboarding.askPlus(config, user);
      }
      return onboarding.doFinish(config, user);
    }
  }

  if (text === 'ONBOARDING_COOL') {
    return onboarding.step1(config, user);
  }

  if (text === 'ONBOARDING_SKIP_YES') {
    return onboarding.doSkip(config, user);
  }

  if (text === 'ONBOARDING_SKIP_NO') {
    return onboarding.cancelSkip(config, user);
  }

  if (text === 'ONBOARDING_PLUS_YES') {
    return api.updatePlus(config, true)
      .then((json) => onboarding.doFinish(config, user));
  }

  if (text === 'ONBOARDING_PLUS_NO') {
    return onboarding.doFinish(config, user);
  }

  if (text === 'GO_TO_SETTINGS') {
    return menus.sendSettingsMenu(config, user);
  }

  if (text === 'GO_TO_WATCHLIST') {
    return menus.sendWatchlist(config);
  }

  if (text === 'GO_TO_PLATFORMS') {
    return menus.sendPlatformsMenu(config, user);
  }

  if (text === 'PLUS_ENABLE') {
    return api.updatePlus(config, true)
      .then((json) => menus.confirmPlusEnabled(config, user));
  }

  if (text === 'PLUS_DISABLE') {
    return api.updatePlus(config, false)
      .then((json) => menus.confirmPlusDisabled(config, user));
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

function parseQuery(query, config, user, options) {
  if (user.isNew) {
    // This is the first message we receive from this user.
    // Start the onboarding process
    return onboarding.onboard(config, user);
  }
  if (user.data.reply_context) {
    return handleContext(config, user, user.data.reply_context, query);
  }
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
    case 'loveyou': case 'loveu':
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
    case 'settings':
      return menus.sendSettingsMenu(config, user);
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
    return searchDeal(searchObject, config, user, options);
  }

  // Check if it's an implicit game search
  searchObject = parseSearchGame(`search ${cleanQuery}`);
  if (searchObject !== false) {
    return searchDeal(searchObject, config, user, options);
  }

  return facebook.sendTextMessage(config, messages.UNRECOGNIZED_QUERY);
};

function searchDeal(searchObject, config, user, options) {
  let platformsToSearch;
  if (searchObject.platform) {
    platformsToSearch = [searchObject.platform];
  } else if (options && options.retrySearch === true) {
    platformsToSearch = null;
  } else if (user.data && user.data.platforms) {
    platformsToSearch = user.data.platforms.map((p) => p.id);
  }
  return api.search(searchObject.game, platformsToSearch)
    .then((json) => {
      const results = json.results;
      const userHasPlus = (user.data.has_plus);
      if (results.length > 0) {
        let cards = [];
        for(let i = 0; i < results.length; i += 1) {
          const deal = results[i];
          const hasPlusPrice = (deal.plus_price !== null && deal.plus_discount_percent !== null);
          const useLowPrice = (userHasPlus && hasPlusPrice) ? deal.plus_price : deal.deal_price;
          const lowestPrice = (useLowPrice === 0) ? useLowPrice : useLowPrice || deal.normal_price;
          let price = (lowestPrice > 0) ? `\$${parseFloat(lowestPrice).toFixed(2)}` : 'FREE';
          if (userHasPlus && hasPlusPrice) {
            price += ` | ${deal.plus_discount_percent}% OFF with PS Plus!`;
          } else {
            price += (deal.discount_percent) ? ` | ${deal.discount_percent}% OFF!` : '';
          }
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
        return facebook.sendTextMessage(config, messages.GAME_FOUND)
          .then(() => facebook.sendGenericTemplate(config, cards));
      } else {
        if(platformsToSearch) {
          const button = {
            'type': 'postback',
            'title': messages.TRY_ANOTHER_PLATFORM,
            'payload': 'RETRY_SEARCH_FOR_QUERY_' + searchObject.game
          };
          return facebook.sendButtonMessage(config, messages.GAME_NOT_FOUND_FOR_PLATFORM(searchObject.game), [button]);
        } else {
          return facebook.sendTextMessage(config, messages.GAME_NOT_FOUND(searchObject.game));
        }
      }
    });
}

function handleContext(config, user, context, query) {
  if (context === 'onboarding.cool') {
    return onboarding.step1(config, user);
  }

  if (context === 'onboarding.skip') {
    return onboarding.skip(config, user);
  }

  if (context === 'onboarding.skip.confirm') {
    if (queryHelper.isAffirmative(query)) {
      return onboarding.doSkip(config, user);
    }

    if (queryHelper.isNegative(query)) {
      return onboarding.cancelSkip(config, user);
    }

    // By default, ask again
    return onboarding.skip(config, user);
  }

  if (context === 'onboarding.add_another_platform.confirm') {
    if (queryHelper.isAffirmative(query)) {
      return onboarding.cancelSkip(config, user);
    }

    // By default, consider negative
    const hasSonyPlatform = _.some(user.data.platforms, (p) => (p.id >= 1 && p.id <= 3));
    if (hasSonyPlatform) {
      return onboarding.askPlus(config, user);
    }
    return onboarding.doFinish(config, user);
  }

  if (context === 'onboarding.plus.confirm') {
    if (queryHelper.isAffirmative(query)) {
      return api.updatePlus(config, true)
        .then((json) => onboarding.doFinish(config, user));
    }

    // By default, consider negative
    return onboarding.doFinish(config, user);
  }

  if (context === 'settings.add_another_platform.confirm') {
    if (queryHelper.isAffirmative(query)) {
      return menus.sendPlatformsMenu(config, user);
    }

    // By default, consider negative
    return menus.exitSettings(config, user);
  }
}

app.listen(8123, '0.0.0.0', function () {
  console.log('Facebook Messenger bot started on port 8123');
});
