var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var url = require('url');
var WebSocketServer = require('ws').Server;
var generatePassword = require("password-maker");

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server = http.createServer(app);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var wss = new WebSocketServer({ server: server });

var waiting = {};

wss.on('connection', function(ws) {
	var token, pebble;
	if(ws.protocol === 'watch') {
		do {
			token = generatePassword({ uppercase: false, symbols : false, numbers : true }, 4);
		} while(token in waiting);
		ws.send(JSON.stringify({SlyToken: token}));
		waiting[token] = ws;

		ws.on('close', function() {
			delete waiting[token];
		});
	} else if(ws.protocol === 'display') {
		var location = url.parse(ws.upgradeReq.url, true);
		token = location.pathname.substr(1);
		console.log(token, Object.keys(waiting));
		if(!(token in waiting)) {
			console.log("no such slide");
			ws.send(JSON.stringify({SlyError: "No Such Slide"}))
			return ws.close();
		}
		pebble = waiting[token];
		delete waiting[token];
		pebble.send(JSON.stringify({SlyConnected: 1}));
		pebble.on("message", function(data) {
			ws.send(data);
		});
		ws.on("message", function(data) {
			pebble.send(data);
		});
		pebble.on("close", function() {
			ws.close();
		});
		ws.on("close", function() {
			pebble.send(JSON.stringify({SlyConnected: 0}));
			waiting[token] = pebble;
		});
	}
});

server.listen(3000);
