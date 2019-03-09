'use strict'

const express = require('express')
const session = require('express-session')
const compression = require('compression')
const bodyParser = require('body-parser')
const random = require('secure-random')
const FileStreamRotator = require('file-stream-rotator')
const morgan = require('morgan')
const path = require('path')
const swaggerUI = require('swagger-ui-express')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session)
const passport = require('passport')

const food = require('./food/module')
const recipes = require('./recipes/module')
const auth = require('./auth/module')
const api = require('./api/module')
const DBNAME = require('./db.name.js')

/*** CONNECT TO DB ***/

mongoose.Promise = global.Promise
mongoose.connect(DBNAME)
    .then(() => console.log('Database connected'))
    .catch((err) => console.error(err))

/*** SET UP SESSION ***/

const app = express()

app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    name: 'sessionID', // use a generic name to prevent app fingerprinting
    secret: random(32).toString(),
    resave: false, // don't save sessions that have not changed
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // compliant clients will not reveal the cookie to client-side javascript
        secure: process.env.NODE_ENV !== 'development', // send cookies over http in development and https in production
        maxAge: 1000 * 60 * 30 // 30 minutes
    },
    // TODO: there has got to be a way to stub this in the test file
    store: process.env.NODE_ENV === 'test' ? null : new MongoStore({ mongooseConnection: mongoose.connection })
}))
app.disable('x-powered-by') // Don't reveal that we're using Express
app.enable('trust proxy')

/*** LOGGING ***/

if (process.env.NODE_ENV !== 'test') {
    const logDirectory = path.join(__dirname, 'log')
    const accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(logDirectory, 'access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
    })
    app.use(morgan('combined', { stream: accessLogStream }))
}

/*** AUTHENTICATION ***/

auth.initialise()
app.use(passport.initialize())
app.use(passport.session())
passport.use(auth.strategy)
passport.serializeUser(auth.serialise)
passport.deserializeUser(auth.deserialise)

/*** ROUTES ***/

const currentVersion = `/v1`
app.get('/', (req, res, next) => res.redirect(`${currentVersion}/api`))
app.use(`${currentVersion}/auth`, auth.route)
app.use(`${currentVersion}/food`, food.route)
app.use(`${currentVersion}/recipes`, recipes.route)
app.get('/cms', (req, res) => res.sendFile(path.join(__dirname, 'static', 'index.html')))
app.use('/cms', express.static(path.join(__dirname, 'static')))

/*** API Documentation ***/

app.use(`${currentVersion}/api`, swaggerUI.serve, swaggerUI.setup(api.json))

/*** ERROR HANDLING ***/

app.use((req, res, next) => {
    return next({ status: 404, message: 'Resource not found' })
})

app.use((err, req, res, next) => {
    const status = err.status || 500
    const msg = err.message || 'Internal Server Error: Unhandled use case'
    res.status(status).send({ error: msg })
})

module.exports = app
