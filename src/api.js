'use strict';

const fetch = require('node-fetch');

const search = (title, platform, limit) => {
  let url = `http://localhost:8000/api/v1/search?title=${title}&limit=${limit || 10}`;
  if (platform) {
    url += `&platform=${platform}`;
  }
  return fetch(url).then((res) => res.json());
}

module.exports = {
  search
};
