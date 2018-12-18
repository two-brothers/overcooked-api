'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');

/*** URI: /auth ***/

/**
 * When a user visits this URL, they will be directed to a github authentication server,
 * and then redirected to /auth/github/callback
 * If successful, subsequent calls in the session (to any API) will have req.isAuthenticated() return true
 */
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github'), (req, res, next) => res.redirect('/'));

module.exports = router;