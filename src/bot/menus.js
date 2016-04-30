const _ = require('lodash');
const facebook = require('../facebook');
const messages = require('../constants/messages');

const sendHelpMenu = (config) => {
  facebook.sendTextMessage(config, messages.HELP_MENU);
};

const sendWatchlist = (config) => {
  // Get watchlist from DB
  // Send generic template with buttons to unwatch
  facebook.sendTextMessage(config, 'TODO: Watchlist');
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
