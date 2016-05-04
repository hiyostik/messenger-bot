'use strict';

const _ = require('lodash');
const api = require('../api');
const facebook = require('../facebook');
const messages = require('../constants/messages');

const onboard = (config, user) => {
  return facebook.sendTextMessage(config, messages.ONBOARDING1(user.data.first_name || 'friend'))
    .then((json) => {
      const button = {
        'type': 'postback',
        'title': 'Cool.',
        'payload': 'ONBOARDING_COOL'
      };
      return facebook.sendButtonMessage(config, messages.ONBOARDING2, [ button ], 'onboarding.cool');
    });
};

const sendPlatformSelector = (config, user) => {
  const selectedPlatforms = user.data.platforms;
  const cards = [
    {
      'title': 'PlayStation 4',
      'image_url': 'https://yostikapp.com/site/images/platforms/ps4.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 1 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 1 }) ? 'REMOVE_PLATFORM_1' : 'ADD_PLATFORM_1'
      }]
    },
    {
      'title': 'Xbox One',
      'image_url': 'https://yostikapp.com/site/images/platforms/xboxone.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 5 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 5 }) ? 'REMOVE_PLATFORM_5' : 'ADD_PLATFORM_5'
      }]
    },
    {
      'title': 'PC',
      'image_url': 'https://yostikapp.com/site/images/platforms/pcwindows.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 7 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 7 }) ? 'REMOVE_PLATFORM_7' : 'ADD_PLATFORM_7'
      }]
    },
    {
      'title': 'PlayStation 3',
      'image_url': 'https://yostikapp.com/site/images/platforms/ps3.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 2 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 2 }) ? 'REMOVE_PLATFORM_2' : 'ADD_PLATFORM_2'
      }]
    },
    {
      'title': 'Xbox 360',
      'image_url': 'https://yostikapp.com/site/images/platforms/xbox360.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 6 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 6 }) ? 'REMOVE_PLATFORM_6' : 'ADD_PLATFORM_6'
      }]
    },
    {
      'title': 'PlayStation Vita',
      'image_url': 'https://yostikapp.com/site/images/platforms/psvita.png',
      'buttons': [{
        'type': 'postback',
        'title': _.find(selectedPlatforms, { id: 3 }) ? 'Remove' : 'Add',
        'payload': _.find(selectedPlatforms, { id: 3 }) ? 'REMOVE_PLATFORM_3' : 'ADD_PLATFORM_3'
      }]
    },
    {
      'title': 'Other',
      'image_url': 'https://yostikapp.com/site/images/yostik_full_logo.png',
      'buttons': [{
        'type': 'postback',
        'title': 'Other platforms',
        'payload': 'ADD_PLATFORM_OTHER'
      }]
    },
  ];

  return facebook.sendGenericTemplate(config, cards);
};

const confirmAddPlatform = (config, user, platform, contextNamespace) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes',
    'payload': 'ADD_ANOTHER_PLATFORM_YES'
  }, {
    'type': 'postback',
    'title': 'No',
    'payload': 'ADD_ANOTHER_PLATFORM_NO'
  }];
  return facebook.sendButtonMessage(config, messages.PLATFORM_ADDED(platform.name), buttons, `${(contextNamespace) ? contextNamespace : `onboarding`}.add_another_platform.confirm`);
};

const confirmRemovePlatform = (config, user, contextNamespace) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes',
    'payload': 'ADD_ANOTHER_PLATFORM_YES'
  }, {
    'type': 'postback',
    'title': 'No',
    'payload': 'ADD_ANOTHER_PLATFORM_NO'
  }];
  return facebook.sendButtonMessage(config, messages.PLATFORM_REMOVED, buttons, `${(contextNamespace) ? contextNamespace : `onboarding`}.add_another_platform.confirm`);
};

const step1 = (config, user) => {
  return facebook.sendTextMessage(config, messages.ONBOARDING3, 'onboarding.skip')
    .then((json) => sendPlatformSelector(config, user));
};

const skip = (config, user) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes, skip it.',
    'payload': 'ONBOARDING_SKIP_YES'
  }, {
    'type': 'postback',
    'title': 'No, take me back.',
    'payload': 'ONBOARDING_SKIP_NO'
  }];
  return facebook.sendButtonMessage(config, messages.ONBOARDING_SKIP, buttons, 'onboarding.skip.confirm');
};

const skipOther = (config, user) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes, skip it.',
    'payload': 'ONBOARDING_SKIP_YES'
  }, {
    'type': 'postback',
    'title': 'No, take me back.',
    'payload': 'ONBOARDING_SKIP_NO'
  }];
  return facebook.sendButtonMessage(config, messages.PLATFORM_SELECTION_OTHER, buttons, 'onboarding.skip.confirm');
};

const doSkip = (config, user) => {
  return facebook.sendTextMessage(config, messages.ONBOARDING_DO_SKIP, 'NULL')
    .then((json) => finish(config, user));
};

const cancelSkip = (config, user) => {
  return facebook.sendTextMessage(config, messages.ONBOARDING_CANCEL_SKIP, 'onboarding.skip')
    .then((json) => sendPlatformSelector(config, user));
};

const askPlus = (config, user) => {
  const buttons = [{
    'type': 'postback',
    'title': 'Yes',
    'payload': 'ONBOARDING_PLUS_YES'
  }, {
    'type': 'postback',
    'title': 'No',
    'payload': 'ONBOARDING_PLUS_NO'
  }];
  return facebook.sendButtonMessage(config, messages.PLUS_SELECTION, buttons, 'onboarding.plus.confirm');
};

const finish = (config, user) => {
  return facebook.sendTextMessage(config, messages.ONBOARDING_END1 + ' ' + messages.ONBOARDING_END2, 'NULL')
    .then((json) => facebook.sendTextMessage(config, messages.ONBOARDING_END3))
};

const doFinish = (config, user) => {
  return facebook.sendTextMessage(config, messages.ALL_SET, 'NULL')
    .then((json) => finish(config, user));
};

module.exports = {
  onboard,
  sendPlatformSelector,
  confirmAddPlatform,
  confirmRemovePlatform,
  step1,
  skip,
  skipOther,
  doSkip,
  cancelSkip,
  askPlus,
  finish,
  doFinish
};
