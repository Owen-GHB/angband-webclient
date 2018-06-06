var lowdb    = require("lowdb");
var FileSync = require("lowdb/adapters/FileSync");
var bcrypt   = require("bcrypt");

//var adapter  = ;
var db       = {
   games    : lowdb(new FileSync("./db/games.json")),
   news     : lowdb(new FileSync("./db/news.json")),
   sessions : lowdb(new FileSync("./db/sessions.json")),
   users    : lowdb(new FileSync("./db/users.json"))
};

var SALT          = "aaa";
var SALT_ROUNDS   = 5;
var DEFAULT_ROLES = ["user"];


/* SHEMAS

   users: [{
      name          : string,
      password_hash : string,
      role          : [string]
   }]
   
   sessions: [{
      session_id: string,
      user: string
   }],
   
   games: [{
      name: String,
      longname: String,
      desc: String,
      longdesc: String,
      restrict_paths: Boolean,
      data_paths: Array,
      args: Array
   }]

*/
// set default data if db files are empty
db.games.defaults({data:[]}).write();
db.news.defaults({data:[]}).write();
db.sessions.defaults({data:[]}).write();
db.users.defaults({data:[]}).write();


// export db object
module.exports.db = db;







// module.exports.createUser = function(name, password, roles, callback) {
//    var password_hash = encrypt(password, function(error, hashed_password) {
//       db.get("users").push({
//          name: name,
//          password: password_hash,
//          roles: roles
//       }).write();
//       callback();
//    });
// };


// AUTEHNTICATION
module.exports.verifyWithLocalDb = function(username, password, done) {
   console.log("localdb verifyWithLocalDb: checking with", username, password);
   authenticate(username, password, function(error, user, more_info) {
      done(error, user, more_info);
   });
};

module.exports.isLoggedIn = function(req, res, next) {
   console.log("is user logged in?");
   return next(); 
};


module.exports.serializeUser = function(user, done) {
   done(null, user.name);
};

module.exports.deserializeUser = function(name, done) {
   findUserByName(name, function(err, user) {
      done(err, user);
   });
};





// NEWS
function getNews() {
   return db.news
      .get("data")
      .sortBy("-timestamp")
      .take(10)
      .value();
}
module.exports.getNews = getNews;


// state update
module.exports.refresh = function() {
   db.games.read();
   db.news.read();
   db.users.read();
   db.sessions.read();
};




// UTILITY FUNCTIONS
function findUserByName(name) {
   return db.users.get("data").find({name: name}).value();
}


/**
 * username: `string`
 * password: `string`
 * callback: `function(error, user, additional_info)`
 *    error
 *       `null` if no errors
 *       `string` if some error occured during authentication
 *    user
 *       `null` if authentication failed (wrong username/password pair)
 *       `object` object with user data according to schema
 *    additional_info: can be one of:
 *       `null` - when some error occured
 *       "new" when username was not found in db and new user was created
 *       "ok" when username and password matched ones in db
 *       "no match" when username/password pair had no match in db or password was incorrect
 *       can be `new`, `ok` or `no match`
 * */
function authenticate(username, password, callback) {
   var user = db.users.get("data").find({name: username}).value();
   
   // user does not exist, create one
   if(!user) {
      bcrypt.hash(password, SALT_ROUNDS, function(error, hashed_password) {
         if(error)
            return callback(error, null);
            
         var new_user = {
            name          : username,
            password_hash : hashed_password,
            roles         : DEFAULT_ROLES
         };
         db.users.get("data").push(new_user).write();
         callback(null, new_user, "new");
      });
   }
   
   // user exist, check password hashes
   else {
      bcrypt.compare(password, user.password_hash, function(error, they_match) {
         if(error)
            return callback(error, null);
         if(they_match)
            return callback(null, user, "ok");
         else
            return callback(null, null, "no match");
      });
   }
}

// test
// authenticate("me", "my wrong password", function(error, user, info) {
//    console.log("authentication check:", error, user, info);
// });