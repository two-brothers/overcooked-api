'use strict';

/**
 * The request body should be validated before being added to the database
 * This module provides some utility functions to simplify the code
 */

const requiredField = (field, validator, message) => (field !== undefined && validator(field)) ? null : message;
const optionalField = (field, validator, message) => (field === undefined || validator(field)) ? null : message;
const mutuallyExclusive = (arr, message) => arr.filter(el => el === undefined).length === 1 ? null : message;
const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const isPositiveNumber = (value) => typeof value === 'number' && value > 0;
const isBoundedInt = (min, max) => ((value) => Number.isInteger(value) && value >= min && value <= max);
const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

module.exports = {
    required: requiredField,
    optional: optionalField,
    mutuallyExclusive: mutuallyExclusive,
    isNonEmptyString: isNonEmptyString,
    isPositiveNumber: isPositiveNumber,
    isBoundedInt: isBoundedInt,
    isNonEmptyArray: isNonEmptyArray
};