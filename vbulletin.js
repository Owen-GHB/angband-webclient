var config = require('./config');
var MySql = require('sync-mysql');
var he = require('he');

var connection = new MySql({
  host: 'localhost',
  user: config.vbulletin_username,
  password: config.vbulletin_password,
  database: config.vbulletin_dbname
});

function getLatestThreads() {
	const query = `
            SELECT
                o1.lastcontent,
                o1.lastcontentid AS id,
                o1.title,
                o2.title AS forum,
                o3.title AS category,
                u.username AS lastauthor
            FROM
                oook_node o1
            LEFT JOIN
                oook_node o2 ON o1.parentid = o2.nodeid
            LEFT JOIN
                oook_node o3 ON o2.parentid = o3.nodeid
            LEFT JOIN
                oook_user u ON o1.lastauthorid = u.userid
            WHERE
                o1.lastcontent > 1704581661
                AND o1.title != ''
                AND o1.contenttypeid = 20;
        `;
  	var result = connection.query(query);
	result = result.map(row => {
		var lastcontent = new Date(row.lastcontent);
		row.date = lastcontent.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' , hour12: false });
		row.title = he.decode(row.title);
		return row;
	});
	return result;
}

module.exports = {
  getLatestThreads
};
