'use strict';

/**
 * A dummy route to demonstrate the basic structure
 */

const express = require('express');
const router = express.Router();
const Dummy = require('./dummy.model');
const wrapper = require('../response-wrapper');

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response));
    next();
});

/*** URI: /dummy ***/

/**
 * Return all dummy records
 */
router.get('/', (req, res, next) => {
    Dummy.find({})
        .then(records => res.wrap(records))
        .catch(err => res.status(500).send('Server Error: Unable to retrieve dummy records'));
});

/**
 * Create a new dummy record
 */
router.post('/', (req, res, next) => {
    if (!req.body.name)
        return next({status: 400, message: 'Dummy name must be specified'});

    Dummy.create(req.body)
        .then(record => res.wrap(record))
        .catch(err => next({status: 500, message: 'Server Error: Unable to create dummy record'}));
});

/*** URI: /dummy/:id ***/

/**
 * Return the specified dummy record
 */
router.get('/:id', (req, res, next) => {
    Dummy.findById(req.params.id)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to retrieve dummy record'}));
});

/**
 * Update the specified dummy record
 */
router.put('/:id', (req, res, next) => {
    if (!req.body.name)
        return next({status: 400, message: 'New dummy name must be specified'});

    Dummy.findByIdAndUpdate(req.params.id, req.body)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to update dummy record'}));
});

/**
 * Delete the specified dummy record
 */
router.delete('/:id', (req, res, next) => {
    Dummy.findByIdAndRemove(req.params.id)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to delete achievement'}));
});

module.exports = router;
