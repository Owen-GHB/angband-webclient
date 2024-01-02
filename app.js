var express       = require('express');
var path          = require('path');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var session       = require('express-session');
var FileStore     = require('session-file-store')(session)
var bodyParser    = require('body-parser');
var terminal      = require('term.js');
var app           = express();
var expressWs     = require('express-ws')(app);
var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var localdb       = require("./localdb");
var awc           = require('./lib.js');

// do some crucial checks before we can proceed
if(!process.env.SESSION_SECRET) {
   console.warn("SESSION_SECRET environment variable must be set, refer to readme.md. Exiting..");
   process.exit(1);
}

var users = localdb.getUserList();

// =============================================================================
//  S E R V E R   C O N F I G U R A T I O N
// =============================================================================


/**
 * CUSTOM_USER variable defines where user files are stored. If environment variable
 * was not specified a default value of '/home/angband/user' will be used.
 */
const CUSTOM_USER = process.env.CUSTOM_USER || '/home/angband/user'


//set up our pinging
setInterval(function() { awc.keepalive(); }, 10000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
   name: 'session',
   store: new FileStore({ 
      path         : "./db/sessions",              // folder where to store sessions
      secret       : process.env.SESSION_SECRET,   // must be set as environment variable
      retries      : 2,                            // number of retries to read a session file
      ttl          : 60 * 60 * 24 * 7,             // sessions TTS in seconds, 7 days
      reapInterval : 60 * 60 * 1,                  // in seconds, clean expired sessions every hour
   }),
   resave: true,
   secret: process.env.SESSION_SECRET,
   saveUninitialized: false,
   // keys: ['air', 'fire', 'water']
   }
));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(CUSTOM_USER));

// configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

// terminal middleware
app.use(terminal.middleware());

// initialize passport routines
passport.use(new LocalStrategy(localdb.verifyWithLocalDb));
passport.serializeUser(localdb.serializeUser);
passport.deserializeUser(localdb.deserializeUser);





// =============================================================================
//  R O U T E S
// =============================================================================
app.get('/', function(req, res) {
   var news = localdb.getNews();
   var stats = awc.stats();
	res.render('frontpage/frontpage.ejs', {
      user    : req.user ? req.user.name : null, 
      news    : news,
      games   : stats.games,
      players : stats.players
	});
});

app.post('/enter', passport.authenticate("local", {failureRedirect: '/forbidden'}), function(req, res) {
   console.log("user authenticated, redirecting to play", req.user);
   return res.redirect("/play");
});

app.get("/play", localdb.isUserLoggedIn, function(req, res) {
   console.log("rendering play");
   return res.render("play/play.ejs", {user: req.user});
});

app.get('/faq', function(req, res) {
   res.render('faq.ejs');
});

app.get('/graveyard', function(req, res) {
   var deathstats = awc.deathstats();
   res.render('graveyard.ejs',{
   	data:deathstats
   });
});

app.get('/logout', function(req, res) {
   var user = req.user ? req.user.name : "unknown!!";
   console.log(`logging user ${user} out`);
   req.logout();
   res.clearCookie('session');
   res.redirect('/');
});

app.get("/forbidden", function(req, res) {
  return res.render("error.ejs");
});

for (var i = 0; i < users.length; i++) {
    (function (username) {
        app.get('/' + username, function (req, res) {
            var data = localdb.getUserStats(username);
            res.render('profile.ejs', {
                user: username,
                data: data
            });
        });
    })(users[i]);
}


// =============================================================================
//  W E B S O C K E T   R O U T E S
// =============================================================================
app.ws('/', function (ws, req) {
	if (typeof(req.user.name) !== 'undefined'){
	  awc.welcome(req.user, ws);
	}
});




// =============================================================================
//  4 0 4   H A N D L E R
// =============================================================================
app.use(function(req, res, next) {
  return res.render("404.ejs");
});





// =============================================================================
//  E R R O R   H A N D L E R S
// =============================================================================
// development error handler
// will print stacktrace
// if (app.get('env') === 'development') {
//   app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//       message: err.message,
//       error: err
//     });
//   });
// }

// production error handler
// no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });





// =============================================================================
//  S E R V E R   L A U N C H
// =============================================================================
var IP   = process.env.C9_IP   || process.env.IP   || "localhost";
var PORT = process.env.C9_PORT || process.env.PORT || 3000;
var server = app.listen(PORT, function() {
  console.log(`angband.live is is up and running at ${IP} port ${PORT}`);
});





// =============================================================================
//  S E R V E R   S H U T D O W N
// =============================================================================
process.on('SIGINT', function onSigterm() {
  console.info('Got SIGINT. Graceful shutdown started at', new Date().toISOString());
  // start graceul shutdown here
  server.close();
  process.exit();
});
