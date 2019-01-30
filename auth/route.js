'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const wrapper = require('../response-wrapper');

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response));
    return next();
});

/*** URI: /auth ***/

/**
 * When a user visits this URL, they will be directed to a github authentication server,
 * and then redirected to /auth/github/callback
 * If successful, subsequent calls in the session (to any API) will have req.isAuthenticated() return true
 */
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github'), (req, res, next) => res.redirect('/cms'));

/**
 * Return the profile of the authenticated user or null if there is no user
 */
router.get('/whoami', (req, res, next) => {
    res.wrap((req.user && req.user.profile) ? req.user.profile : null);
});

/**
 * Log the user out of the current session
 */
router.get('/logout', (req, res, next) => {
    req.logout();
    res.status(204).send();
});

module.exports = router;