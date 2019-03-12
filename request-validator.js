'use strict'

/**
 * The request body should be validated before being added to the database
 * This module provides some utility functions to simplify the code
 */

/**
 * Executes the passed functions in order and returns the first error message (without evaluating subsequent functions)
 * @param errMsgFns
 * @returns {*}
 */
const firstError = (...errMsgFns) => errMsgFns.reduce((firstError, nextFn) => firstError || nextFn(), null)

// These functions return a function that returns the error if the field does not pass the validation function
// It is expected the outer function will be instantiated and passed to the 'firstError' function, which will lazily evaluate the errors
const requiredField = (field, validator, error) => () => (field !== undefined && validator(field)) ? null : error
const optionalField = (field, validator, error) => () => (field === undefined || validator(field)) ? null : error
const mutuallyExclusive = (arr, error) => () => arr.filter(el => el === undefined).length === 1 ? null : error

// Various validation functions
const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0
const isFinitePositiveNumber = (value) => typeof value === 'number' && value > 0 && value !== Number.POSITIVE_INFINITY
const isBoundedInt = (min, max) => ((value) => Number.isInteger(value) && value >= min && value <= max)
const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0
const isOneOf = (options) => (value) => options.includes(value)

module.exports = {
    required: requiredField,
    optional: optionalField,
    mutuallyExclusive: mutuallyExclusive,
    isNonEmptyString: isNonEmptyString,
    isFinitePositiveNumber: isFinitePositiveNumber,
    isBoundedInt: isBoundedInt,
    isNonEmptyArray: isNonEmptyArray,
    isOneOf: isOneOf,
    firstError: firstError
}
