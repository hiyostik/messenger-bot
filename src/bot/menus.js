'use strict';

const _ = require('lodash');
const api = require('../api');
const facebook = require('../facebook');
const messages = require('../constants/messages');
const onboarding = require('./onboarding');

const sendHelpMenu = (config) => {
  return facebook.sendTextMessage(config, messages.HELP_MENU1)
    .then(() => {
      const buttons = [{
        'type': 'postback',
        'title': 'Settings',
        'payload': 'GO_TO_SETTINGS'
      }, {
        'type': 'postback',
        'title': 'Watchlist',
        'payload': 'GO_TO_WATCHLIST'
      }];
      return facebook.sendButtonMessage(config, messages.HELP_MENU2, buttons);
    })
};

const sendSettingsMenu = (config, user) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Manage Platforms',
    'payload': 'GO_TO_PLATFORMS'
  }, {
    'type': 'postback',
    'title': (user.data.has_plus) ? 'Disable PS Plus' : 'Enable PS Plus',
    'payload': (user.data.has_plus) ? 'PLUS_DISABLE' : 'PLUS_ENABLE'
  }];
  const platformsString = user.data.platforms.map((p) => `  - ${p.name}\n`).join('');
  const message = `
${messages.SETTINGS_MENU}\n
Your Platforms:
${(platformsString) ? platformsString : ` - You haven't selected any platforms.`}
PlayStation Plus Enabled: ${(user.data.has_plus) ? 'Yes' : 'No'}`;
  return facebook.sendButtonMessage(config, message, buttons);
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

const sendPlatformsMenu = (config, user) => {
  return facebook.sendTextMessage(config, messages.PLATFORM_SHOW)
    .then((json) => onboarding.sendPlatformSelector(config, user));
};

const otherPlatform = (config, user) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes',
    'payload': 'ADD_ANOTHER_PLATFORM_YES'
  }, {
    'type': 'postback',
    'title': 'No',
    'payload': 'ADD_ANOTHER_PLATFORM_NO'
  }];
  return facebook.sendButtonMessage(config, messages.PLATFORM_OTHER, buttons, `settings.add_another_platform.confirm`);
};

const confirmAddPlatform = (config, user, platform) => {
  return onboarding.confirmAddPlatform(config, user, platform, 'settings');
};

const confirmRemovePlatform = (config, user) => {
  return onboarding.confirmRemovePlatform(config, user, 'settings');
};

const confirmPlusEnabled = (config) => {
  return facebook.sendTextMessage(config, messages.CONFIRM_PLUS_ENABLED);
};

const confirmPlusDisabled = (config) => {
  return facebook.sendTextMessage(config, messages.CONFIRM_PLUS_DISABLED);
};

const exitSettings = (config, user) => {
  return facebook.sendTextMessage(config, messages.ALL_SET, 'NULL');
};

const sendUnsubscribeConfirmation = (config) => {
  // Unsubscribe from daily deals
  return facebook.sendTextMessage(config, messages.SUCCESSFUL_UNSUBSCRIBE);
};

const randomGreeting = (config) => {
  const keys = ['GREETING1', 'GREETING2', 'GREETING3'];
  return facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

const randomYoureWelcome = (config) => {
  const keys = ['YOUREWELCOME1', 'YOUREWELCOME2', 'YOUREWELCOME3'];
  return facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

const randomLove = (config, type) => {
  const keys = {
    'love': ['LOVE1', 'LOVE2', 'LOVE3'],
    'like': ['LIKE1', 'LIKE2', 'LIKE3'],
    'marry': ['MARRY1', 'MARRY2']
  };
  return facebook.sendTextMessage(config, messages[_.sample(keys[type])]);
};

const randomHate = (config) => {
  const keys = ['HATE1', 'HATE2', 'HATE3'];
  return facebook.sendTextMessage(config, messages[_.sample(keys)]);
};

module.exports = {
  sendHelpMenu,
  sendSettingsMenu,
  sendWatchlist,
  sendPlatformsMenu,
  otherPlatform,
  confirmAddPlatform,
  confirmRemovePlatform,
  confirmPlusEnabled,
  confirmPlusDisabled,
  exitSettings,
  sendUnsubscribeConfirmation,
  randomGreeting,
  randomYoureWelcome,
  randomLove,
  randomHate
};
