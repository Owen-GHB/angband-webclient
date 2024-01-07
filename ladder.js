var config = require('./config');
var MySql = require('sync-mysql');

var connection = new MySql({
  host: 'localhost',
  user: config.ladder_username,
  password: config.ladder_password,
  database: config.ladder_dbname
});

function getLatestDumps() {
  const query = "SELECT id, name, variant, level, class, race, email, username, status, date_upd, IF(date_upd = '0000-00-00', `date`, date_upd) AS sortdate, comments_count, comments_latest AS lastcom FROM ladder WHERE (date > DATE_ADD(NOW(), INTERVAL -1 DAY) OR date_upd > DATE_ADD(NOW(), INTERVAL -1 DAY)) AND competition = 0 ORDER BY sortdate DESC";
  return connection.query(query);
}

function getLatestScreenshots() {
  const query = "SELECT id, name, variant, email, username, DATE_FORMAT(date, '%Y%m%d') AS date_f, DATE_FORMAT(date, '%H:%i') AS time_f FROM screens WHERE date > DATE_ADD(NOW(), INTERVAL -1 DAY) ORDER BY date DESC";
  return connection.query(query);
}

module.exports = {
  getLatestDumps,
  getLatestScreenshots
};
