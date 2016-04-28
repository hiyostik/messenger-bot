const fetch = require('node-fetch');

const search = (title, platform, limit) => {
  return fetch(`http://localhost:8000/api/v1/search?title=${title}&platform=${platform}&limit=${limit || 10}`)
    .then((res) => res.json());
}

module.exports = {
  search
};
