var createError = require('http-errors');
var compression = require('compression')
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var validator = require('express-validator');
var cors = require('cors');
var responseHelper = require('./helper/response');
var mongoose = require('mongoose');
var auth = require('./common/auth');
var multer = require('multer');
var fs = require('fs');
var AWS = require('aws-sdk');
var v8 = require('v8');
const helmet = require("helmet");
const swaggerUI = require("swagger-ui-express");
// const swaggerDocument = require('./swagger.json');

if(process.env.NODE_ENV == 'production'){
  console.log('ifffff')
  global.config = require('./config/prod')
}else{
  console.log('elseeeee')
  global.config = require('./config/dev')
}
var temporaryV8 = v8.getHeapStatistics();

var generateErrorObject = (param, msg, value, location) => {
  return {
      field: param,
      msg: msg
  };
};

var app = express();

mongoose.Promise = global.Promise;
console.log('global.config.MONGODB_URI',global.config.MONGODB_URI)
mongoose.connect(global.config.MONGODB_URI, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true,useCreateIndex: true }).then(() => {
    console.log('DB connection successful');
}).catch((err) => console.error(err));

app.responseHelper = responseHelper;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(helmet());
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));
app.use(compression())
app.use(validator());
app.use(auth.verify);

app.use(require("./routes"));
// app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;