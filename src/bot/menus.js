'use strict';

const _ = require('lodash');
const api = require('../api');
const facebook = require('../facebook');
const messages = require('../constants/messages');

const sendHelpMenu = (config) => {
  facebook.sendTextMessage(config, messages.HELP_MENU);
};

const sendWatchlist = (config) => {
  // Get watchlist from DB
  // Send generic template with buttons to unwatch
  return api.getWatchlist(config.sender_id).then((json) => {
    const results = json.results;
    if (results.length > 0) {
      const limit = (results.length > 10) ? 10 : results.length;
      let cards = [];
      for(let i = 0; i < limit; i += 1) {
        const item = results[i];
        const price = `\$${parseFloat(item.low_price).toFixed(2)}`;
        cards.push({
          'title': item.game.name,
          'subtitle': `${item.platform.name}\nWatching for prices lower than ${price}`,
          'image_url': item.game.image_url || 'https://yostikapp.com/site/images/yostik_full_logo.png',
          'buttons': [{
            'type': 'postback',
            'title': 'Stop watching',
            'payload': 'STOP_WATCHING_' + item.id
          }],
        });
      }
      facebook.sendTextMessage(config, messages.WATCHLIST_SHOW);
      return facebook.sendGenericTemplate(config, cards);
    }
    return facebook.sendTextMessage(config, messages.WATCHLIST_EMPTY);
  });
};

const sendUnsubscribeConfirmation = (config) => {
  // Unsubscribe from daily deals
  facebook.sendTextMessage(config, messages.SUCCESSFUL_UNSUBSCRIBE);
};

const randomGreeting = (config) => {
  const keys = ['GREETING1', 'GREETING2', 'GREETING3'];
  facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

const randomYoureWelcome = (config) => {
  const keys = ['YOUREWELCOME1', 'YOUREWELCOME2', 'YOUREWELCOME3'];
  facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

const randomLove = (config, type) => {
  const keys = {
    'love': ['LOVE1', 'LOVE2', 'LOVE3'],
    'like': ['LIKE1', 'LIKE2', 'LIKE3'],
    'marry': ['MARRY1', 'MARRY2']
  };
  facebook.sendTextMessage(config, messages[_.sample(keys[type])]);
};

const randomHate = (config) => {
  const keys = ['HATE1', 'HATE2', 'HATE3'];
  facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

module.exports = {
  sendHelpMenu,
  sendWatchlist,
  sendUnsubscribeConfirmation,
  randomGreeting,
  randomYoureWelcome,
  randomLove,
  randomHate
};
