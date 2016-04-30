module.exports = {
  UNRECOGNIZED_QUERY: 'Sorry, I don\'t understand your message, can you try something else? Type HELP if you want to see what I can do for you.',
  GAME_NOT_FOUND: 'Sorry, I couldn\'t find any deals for: ',
  GAME_FOUND: 'Ok, here\'s what I found',
  TRY_ANOTHER_PLATFORM: 'Try another platform',
  LET_YOU_KNOW: (name) => `Yessir! I'll let you know when I find a better price for ${name}. Type WATCHLIST to manage your game notifications.`,
  HELP_MENU: `Just type the name of the game you're looking for, you can also add the name of the platform or console to filter the results. For example "search call of duty for ps4" or "destiny for xbox".`,
  SUCCESSFUL_UNSUBSCRIBE: `I'll stop sending you the weekly deals. If you want to subscribe again, just send SUBSCRIBE.`
};
