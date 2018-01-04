'use strict';

const express = require('express');
const session = require('express-session');
const compression = require('compression');
const bodyParser = require('body-parser');
const random = require('secure-random');
const FileStreamRotator = require('file-stream-rotator');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);

const dummy = require('./dummy/module');
const DBNAME = require('./db.name.js');

/*** CONNECT TO DB ***/

mongoose.Promise = global.Promise;
mongoose.connect(DBNAME)
    .catch((err) => console.error(err));

/*** SET UP SESSION ***/

const app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    name: 'sessionID', // use a generic name to prevent app fingerprinting
    secret: random(32).toString(),
    resave: false, // don't save sessions that have not changed
    saveUninitialized: true,
    rolling: true, // a session ID cookie is set on every response (resetting the expiration time)
    cookie: {
        httpOnly: true, // compliant clients will not reveal the cookie to client-side javascript
        secure: true, // only send cookies over https,
        maxAge: 1000 * 60 * 30 // 30 minutes
    },
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.disable('x-powered-by'); // Don't reveal that we're using Express

/*** LOGGING ***/

const logDirectory = path.join(__dirname, 'log');
const accessLogStream = FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
});
app.use(morgan('combined', {stream: accessLogStream}));

/*** ROUTES ***/

app.get('/', (req, res, next) => {
    res.redirect('/index.html');
});
app.use('/dummy', dummy.route);
app.use(express.static(path.join(__dirname, 'static')));

/*** ERROR HANDLING ***/

app.use((req, res, next) => {
   return next({status: 404, message: 'Resource not found'});
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    const msg = err.message || 'Internal Server Error: Unhandled use case';
    res.status(status).send({error: msg});
});

module.exports = app;