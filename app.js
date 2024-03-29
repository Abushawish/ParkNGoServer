var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('parkNgoDB.db');
var app = express();

db.serialize(function() {
    db.run("create table if not exists user(\
            license_plate varchar(40) NOT NULL primary key,\
            fname varchar(40),\
            email varchar(40),\
            password varchar(40),\
            stripe_cust_id varchar(100))"
            );

    db.run("create table if not exists parking(\
            parking_id integer NOT NULL primary key,\
            license_plate varchar(40),\
            spot_num varchar(40),\
            time_in integer,\
            time_out integer,\
            total_min integer,\
            total_charge integer,\
            foreign key(license_plate) references user(license_plate) on delete cascade)"
            );
    
    db.run("PRAGMA foreign_keys=ON");

});



db.close();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
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
    console.log(err.message)
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
  console.log(err.message)
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
