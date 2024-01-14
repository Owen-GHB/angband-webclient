var https = require('https');
var localdb = require('./localdb');
var config  = require('./config');

function getGitHubInfoForGame(game) {
  return new Promise((resolve) => {
    var options = {
      headers: {
        'User-Agent': 'Angband Live',
        'Authorization': `token ${config.github_token}`
      }
    };

    https.get(`https://api.github.com/repos/${game.repo}/releases/latest`, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          var latestRelease = JSON.parse(data);
          var githubInfo = {
            name: game.name,
            version: latestRelease.tag_name,
            releaseDate: latestRelease.published_at
          };

          resolve(githubInfo);
        } catch (error) {
          console.error(`Error parsing GitHub information for ${game.name}: ${error.message}`);
          resolve(null); // Resolve with null for failed requests
        }
      });
    }).on('error', (error) => {
      console.error(`Error fetching GitHub information for ${game.name}: ${error.message}`);
      resolve(null); // Resolve with null for failed requests
    });
  });
}

async function getGitHubInfoForGames() {
  var games = localdb.fetchGames();
  var infoArray = [];

  for (var game of games) {
    if (typeof(game.repo) !== 'undefined') {
      try {
        var githubInfo = await getGitHubInfoForGame(game);
        if (githubInfo !== null) {
          infoArray.push(githubInfo);
        }
      } catch (error) {
        console.error(error.message);
      }
    }
  }
  
  return infoArray;
}

// Export the function as a module
module.exports = {
  getGitHubInfoForGames
};
