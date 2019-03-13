'use strict'

const express = require('express')
const router = express.Router()
const Food = require('./food.model')
const UnitTypes = require('./unitTypes')
const wrapper = require('../response-wrapper')
const VLD = require('../request-validator')
const auth = require('../auth/module')
// use a thunk so it can be mocked in unit tests
// even if the module is already initialised (for example, by being imported in another file)
const ensureAuth = (req, res, next) => auth.ensureAuth(req, res, next)

/**
 * Create a 'wrap' function that wraps the response
 * in a json object with a 'data' field before responding
 * to the client
 */
router.use((req, res, next) => {
    res.wrap = (response) => res.json(wrapper.wrap(response))
    return next()
})

/*** URI: /food ***/

/**
 * Create a new food record
 */
router.post('/', ensureAuth, (req, res, next) => {
    const maxUnitType = UnitTypes.length - 1

    const error = VLD.firstError(
        VLD.required(req.body.name, () => true, 'Food name must be defined'),
        () => req.body.name && VLD.firstError(
            VLD.required(req.body.name.singular, VLD.isNonEmptyString, 'Food name.singular must be a string'),
            VLD.required(req.body.name.plural, VLD.isNonEmptyString, 'Food name.plural must be a string')
        ),
        VLD.required(req.body.conversions, VLD.isNonEmptyArray, 'Food conversions must be a non-empty array'),
        () => VLD.firstError(...req.body.conversions.map((conversion, convIdx) => () => VLD.firstError(
            VLD.required(conversion.unitId, VLD.isBoundedInt(0, maxUnitType), `Food conversions[${convIdx}].unitId must be an integer between 0 and ${maxUnitType}`),
            VLD.required(conversion.ratio, VLD.isFinitePositiveNumber, `Food conversions[${convIdx}].ratio must be a positive number`)
        )))
    )

    if (error)
        return next({ status: 400, message: error })

    Food.create(req.body)
        .then(record => res.wrap(record.exportable))
        .catch(err => next({ status: 500, message: 'Server Error: Unable to create the food record' }))
})

/*** URI: /food/:id ***/

/**
 * Return the specified food record
 */
router.get('/:id', (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')

    Food.findOne({ _id: req.params.id })
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(record => res.wrap(record.exportable))
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to retrieve the specified Food record' })
        )
})

/**
 * Update the specified food record
 */
router.put('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')
    const maxUnitType = UnitTypes.length - 1

    const error = VLD.firstError(
        () => req.body.name && VLD.firstError(
            VLD.required(req.body.name.singular, VLD.isNonEmptyString, 'Food name.singular must be a string'),
            VLD.required(req.body.name.plural, VLD.isNonEmptyString, 'Food name.plural must be a string')
        ),
        VLD.optional(req.body.conversions, VLD.isNonEmptyArray, 'Food conversions (if defined) must be a non-empty array'),
        () => req.body.conversions && VLD.firstError(...req.body.conversions.map((conversion, convIdx) => () => VLD.firstError(
            VLD.required(conversion.unitId, VLD.isBoundedInt(0, maxUnitType), `Food conversions[${convIdx}].unitId must be an integer between 0 and ${maxUnitType}`),
            VLD.required(conversion.ratio, VLD.isFinitePositiveNumber, `Food conversions[${convIdx}].ratio must be a positive number`)
        )))
    )

    if (error)
        return next({ status: 400, message: error })

    Food.findOne({ _id: req.params.id })
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(record => Object.assign(record, req.body))
        .then(record => {
            record.save()
            res.wrap(record.exportable)
        })
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to update the specified Food record' })
        )
})

/**
 * Delete the specified food record
 */
router.delete('/:id', ensureAuth, (req, res, next) => {
    const RecordNotFound = new Error('Record Not Found')

    Food.findOne({ _id: req.params.id })
        .catch(() => Promise.reject(RecordNotFound))
        .then(record => record ? record : Promise.reject(RecordNotFound))
        .then(record => record.remove())
        .then(() => res.status(204).send())
        .catch(err => err === RecordNotFound ?
            next() : // let the 404 handler catch it
            next({ status: 500, message: 'Server Error: Unable to delete the specified Food record' })
        )
})


/*** URI: /food/at/:page ***/
router.get('/at/:page', (req, res, next) => {
    const ITEMS_PER_PAGE = 20

    const page = Number(req.params.page)
    const error = VLD.required(page, VLD.isBoundedInt(0, Infinity), 'The page parameter must be a non-negative integer')()

    if (error)
        return next({ status: 400, message: error })

    Food.find()
        .sort({ id: 1 })
        .limit(ITEMS_PER_PAGE + 1) // get an extra record to see if there is at least another page,
        .skip(page * ITEMS_PER_PAGE)
        .then(records => records.map(record => record.exportable))
        .then(records => res.wrap({
            food: records.slice(0, ITEMS_PER_PAGE),
            lastPage: records.length <= ITEMS_PER_PAGE
        }))
        .catch(() => next({ status: 500, message: 'Server Error: Unable to retrieve the specified Food records' }))
})

module.exports = router
