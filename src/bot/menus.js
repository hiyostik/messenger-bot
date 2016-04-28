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

module.exports = {
  sendHelpMenu,
  sendWatchlist,
  sendUnsubscribeConfirmation
};
