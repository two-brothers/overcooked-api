'use strict';

const express = require('express');
const router = express.Router();
const Food = require('./food.model');
const UnitTypes = require('./unit_types');
const wrapper = require('../response-wrapper');
const VLD = require('../request-validator');

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
    const maxUnitType = UnitTypes.length - 1;

    const error = VLD.required(req.body.name, () => true, 'Food name must be defined') ||
        VLD.required(req.body.name.singular, VLD.isNonEmptyString, 'Food name.singular must be a string') ||
        VLD.required(req.body.name.plural, VLD.isNonEmptyString, 'Food name.plural must be a string') ||
        VLD.required(req.body.conversions, Array.isArray, 'Food conversions must be an array') ||
        VLD.required(req.body.conversions, (arr) => arr.length > 0, 'Food conversions cannot be empty') ||
        req.body.conversions.reduce((error, conversion, convIdx) => error || (
            VLD.required(conversion.unit_id, VLD.isBoundedInt(0, maxUnitType),
                `Food conversions[${convIdx}].unit_id must be an integer between 0 and ${maxUnitType}`) ||
            VLD.required(conversion.ratio, VLD.isPositiveNumber,
                `Food conversions[${convIdx}].ratio must be a postive number`)
        ), null);

    if (error)
        return next({status: 400, message: error});

    Food.create(req.body)
        .then(record => res.wrap(record.exportable))
        .catch(err => next({status: 500, message: 'Server Error: Unable to create the food record'}));
});

/*** URI: /food/:id ***/

/**
 * Return the specified food record
 */
router.get('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');

    Food.findOne({_id: req.params.id})
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => res.wrap(record.exportable))
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to retrieve the specified Food record'})
        );
});

/**
 * Update the specified food record
 */
router.put('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');
    const maxUnitType = UnitTypes.length - 1;

    const error = ( req.body.name !== undefined ?
            VLD.required(req.body.name.singular, VLD.isNonEmptyString, 'Food name.singular must be a string') ||
            VLD.required(req.body.name.plural, VLD.isNonEmptyString, 'Food name.plural must be a string') :
            null
        ) ||
        VLD.optional(req.body.conversions, Array.isArray, 'Food conversions (if defined) must be an array') ||
        VLD.optional(req.body.conversions, (arr) => arr.length > 0, 'Food conversions (if defined) cannot be empty') ||
        ( req.body.conversions ?
                req.body.conversions.reduce((error, conversion, convIdx) => error || (
                    VLD.required(conversion.unit_id, VLD.isBoundedInt(0, maxUnitType),
                        `Food conversions[${convIdx}].unit_id must be an integer between 0 and ${maxUnitType}`) ||
                    VLD.required(conversion.ratio, VLD.isPositiveNumber,
                        `Food conversions[${convIdx}].ratio must be a positive number`)
                ), null) :
                null
        );

    if (error)
        return next({status: 400, message: error});

    Food.findOne({_id: req.params.id})
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => Object.assign(record, update))
        .then(record => record.save())
        .then(() => res.status(204).send())
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to update the specified Food record'})
        );
});

/**
 * Delete the specified food record
 */
router.delete('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found');

    Food.findOne({_id: req.params.id})
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record.remove())
        .then(() => res.status(204).send())
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({status: 500, message: 'Server Error: Unable to delete the specified Food record'})
        );
});


/*** URI: /food/at/:page ***/
router.get('/at/:page', (req, res, next) => {
    const ITEMS_PER_PAGE = 3;

    const page = Number(req.params.page);
    const error = VLD.required(page, VLD.isBoundedInt(0, Infinity), 'The page parameter must be a non-negative integer');
    if (error)
        next({status: 400, message: error});

    Food.find()
        .limit(ITEMS_PER_PAGE + 1) // get an extra record to see if there is at least another page,
        .skip(page * ITEMS_PER_PAGE)
        .then(records => records.length === 0 ? next() : records) // let the 404 handler catch it
        .then(records => records.map(record => record.exportable))
        .then(records => res.wrap({
            food: records.slice(0, ITEMS_PER_PAGE),
            last_page: records.length <= ITEMS_PER_PAGE
        }))
        .catch(err => next({status: 500, message: 'Server Error: Unable to retrieve the Food records'}));
});

module.exports = router;