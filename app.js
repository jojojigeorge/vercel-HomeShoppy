


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
var session = require('express-session')
const MongoStore = require('connect-mongo');



var fileUpload = require('express-fileupload')
var db =require('./config/connection')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var app = express();


var favicon = require('serve-favicon')
app.use(favicon(path.join(__dirname, 'public','images','favicon.ico')))


// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layouts', layoutDir: __dirname + '/views/layouts', partialDir: __dirname + '/views/partials' }))
app.engine('hbs', hbs.engine({
  extname: 'hbs',
  defaultLayout: 'layouts',
  layoutDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.use(fileUpload())
app.use(express.static(path.join(__dirname, 'public')));




// app.use(session({secret:'jojikey',resave :false,saveUninitialized: true,cookie:{maxAge:300000}}))
app.use(
  session({
    secret: "jojikey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: "mongodb+srv://username:username@cluster101.0ktl0i6.mongodb.net/SessionStore?retryWrites=true&w=majority",
    }),
    ttl: {
      maxAge: 100 * 60 * 1000, // 100 minutes in milliseconds
    }
  })
);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());



app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
