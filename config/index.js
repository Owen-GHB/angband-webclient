var ladder = require('./ladder.js');
var vbulletin = require('./vbulletin.js');

module.exports = {

   ...ladder,
   ...vbulletin,

   // limit of how many messages to keep in database
   chat_max_messages: 200,

   // # of chat messages sent to frontend when user connects
   chat_last_messages: 100

};
