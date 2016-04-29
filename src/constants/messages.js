module.exports = {
  UNRECOGNIZED_QUERY: 'Sorry, I don\'t understand your message, can you try something else? Type HELP if you want to see what I can do for you.',
  GAME_NOT_FOUND: 'I couldn\'t find any deals for: ',
  GAME_FOUND: 'Ok, here\'s what I found',
  TRY_ANOTHER_PLATFORM: 'Try another platform',
  LET_YOU_KNOW: (name) => `Alright, boss. I'll let you know when ${name} drops its price.`,
  HELP_MENU: `Here's what I can do for you:\n
    - SEARCH for a game, I'll find the best prices and tell you where you can buy them.
    You can also limit your search to a specific platform or console. Example: "search witcher 3 for ps4", or "find banner saga for pc".\n
    - WATCHLIST will show you the list of games you're currently watching for better prices. You can search for the current lowest price,
    or unwatch a game here.`,
  SUCCESSFUL_UNSUBSCRIBE: `I'll stop sending you the weekly deals. If you want to subscribe again, just send SUBSCRIBE.`
};
