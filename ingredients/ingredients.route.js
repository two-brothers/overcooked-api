'use strict';

const express = require('express');
const router = express.Router();
const Ingredient = require('./ingredient.model');
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

/*** URI: /ingredients ***/

/**
 * Return all ingredients
 */
router.get('/', (req, res, next) => {
    Ingredient.find({})
        .then(records => res.wrap(records))
        .catch(err => res.status(500).send('Server Error: Unable to retrieve ingredients'));
});

/**
 * Create a new ingredient
 */
router.post('/', (req, res, next) => {
    if (!req.body.name)
        return next({status: 400, message: 'Ingredient name must be specified'});
    if (!req.body.name.singular)
        return next({status: 400, message: 'Ingredient singular name must be specified'});
    if (!req.body.name.plural)
        return next({status: 400, message: 'Ingredient plural name must be specified'});

    Ingredient.create(req.body)
        .then(record => res.wrap(record))
        .catch(err => next({status: 500, message: 'Server Error: Unable to create ingredient'}));
});

/*** URI: /ingredients/:id ***/

/**
 * Return the specified ingredient
 */
router.get('/:id', (req, res, next) => {
    Ingredient.findById(req.params.id)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to retrieve the specified ingredient'}));
});

/**
 * Update the specified ingredient
 */
router.put('/:id', (req, res, next) => {
    if (!req.body.name)
        return next({status: 400, message: 'New ingredient name must be specified'});
    if (!req.body.name.singular)
        return next({status: 400, message: 'New ingredient name must have a singular form'});
    if (!req.body.name.plural)
        return next({status: 400, message: 'New ingredient name must have a plural form'});

    Ingredient.findByIdAndUpdate(req.params.id, req.body)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to update the specified ingredient'}));
});

/**
 * Delete the specified ingredient
 */
router.delete('/:id', (req, res, next) => {
    Ingredient.findByIdAndRemove(req.params.id)
        .then(record => record ?
            res.wrap(record) :
            next() // let the 404 handler catch it
        )
        .catch(err => next({status: 500, message: 'Server Error: Unable to delete the specified ingredient'}));
});

module.exports = router;
