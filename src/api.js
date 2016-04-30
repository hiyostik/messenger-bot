'use strict';

const fetch = require('node-fetch');

const search = (title, platform, limit) => {
  let url = `http://localhost:8000/api/v1/search?title=${title}&limit=${limit || 10}`;
  if (platform) {
    url += `&platform=${platform}`;
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

module.exports = {
  search,
  logMessage,
  addToWatchlist
};
