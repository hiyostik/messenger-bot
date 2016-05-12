'use strict';

const fetch = require('node-fetch');

const getOrCreateUser = (config) => {
  const url = `http://localhost:8000/api/v1/user/1/${config.sender_id}?access_token=${config.access_token}`;
  return fetch(url, { method: 'GET' }).then((res) => res.json());
}

const search = (title, platforms, limit) => {
  let url = `http://localhost:8000/api/v1/search?title=${title}&limit=${limit || 10}`;
  if (platforms) {
    url += platforms.map((p) => `&platform[]=${p}`).join('');
  }
  return fetch(url).then((res) => res.json());
}

const logMessage = (messageEvent) => {
  const url = `http://localhost:8000/api/v1/logmessage`;
  return fetch(url, { method: 'POST', body: JSON.stringify(messageEvent) }).then((res) => res.json());
}

const addToWatchlist = (watchlistItem) => {
  const url = `http://localhost:8000/api/v1/watchlist`;
  return fetch(url, { method: 'POST', body: JSON.stringify(watchlistItem) }).then((res) => res.json());
}

const removeFromWatchlist = (watchlistItem) => {
  const url = `http://localhost:8000/api/v1/watchlist-remove`;
  return fetch(url, { method: 'POST', body: JSON.stringify(watchlistItem) }).then((res) => res.json());
}

const getWatchlist = (externalUserId) => {
  const url = `http://localhost:8000/api/v1/watchlist/1/${externalUserId}`;
  return fetch(url, { method: 'GET' }).then((res) => res.json());
}

const setReplyContext = (config, replyContext) => {
  const url = `http://localhost:8000/api/v1/reply-context/1/${config.sender_id}?access_token=${config.access_token}`;
  return fetch(url, { method: 'POST', body: JSON.stringify({reply_context: replyContext}) }).then((res) => res.json());
}

const addPlatform = (config, platformId) => {
  const url = `http://localhost:8000/api/v1/add-platform/1/${config.sender_id}?access_token=${config.access_token}`;
  return fetch(url, { method: 'POST', body: JSON.stringify({platform_id: platformId}) }).then((res) => res.json());
}

const removePlatform = (config, platformId) => {
  const url = `http://localhost:8000/api/v1/remove-platform/1/${config.sender_id}?access_token=${config.access_token}`;
  return fetch(url, { method: 'POST', body: JSON.stringify({platform_id: platformId}) }).then((res) => res.json());
}

const updatePlus = (config, hasPlus) => {
  const url = `http://localhost:8000/api/v1/update-plus/1/${config.sender_id}?access_token=${config.access_token}`;
  return fetch(url, { method: 'POST', body: JSON.stringify({has_plus: hasPlus}) }).then((res) => res.json());
}

module.exports = {
  getOrCreateUser,
  search,
  logMessage,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  setReplyContext,
  addPlatform,
  removePlatform,
  updatePlus
};
