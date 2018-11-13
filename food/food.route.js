'use strict';

const express = require('express');
const router = express.Router();
const Food = require('./food.model');
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

/*** URI: /food ***/

/**
 * Create a new food record
 */
router.post('/', (req, res, next) => {
    if (!req.body.name)
        return next({status: 400, message: 'Food name must be specified'});
    if (!req.body.name.singular || typeof req.body.name.singular !== 'string')
        return next({status: 400, message: 'Food name.singular must be a string'});
    if (!req.body.name.plural || typeof req.body.name.plural !== 'string')
        return next({status: 400, message: 'Food name.plural must be a string'});
    if (!req.body.conversions)
        return next({status: 400, message: 'Array of "conversions" must be specified'});
    if (!Array.isArray(req.body.conversions))
        return next({status: 400, message: '"Conversions" must be an array'});
    req.body.conversions.forEach(c => {
        if (c.unit_id === null || typeof c.unit_id !== 'number' || !Number.isInteger(c.unit_id)
            || c.unit_id < 0 || c.unit_id > 12)
            return next({status: 400, message: 'Each conversion.unit_id must be an integer between 0 and 12'});
        if (c.ratio === null | typeof c.ratio !== 'number')
            return next({status: 400, message: 'Each conversion.ration must be a number'});
    });

    Food.create(req.body)
        .then(record => res.wrap(record.exportable))
        .catch(err => next({status: 500, message: 'Server Error: Unable to create the food record'}));
});

/*** URI: /food/:id ***/

/**
 * Return the specified food record
 */
router.get('/:id', (req, res, next) => {
    Food.findOne({_id: req.params.id})
        .then(record => record ?
            res.wrap(record.exportable) :
            next() // the the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to retrieve the specified Food record'}));
});

module.exports = router;