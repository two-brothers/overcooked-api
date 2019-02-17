'use strict';

const route = require('./food.route');
const model = require('./food.model');
const unitTypes = require('./unitTypes');
const sample = require('./food.sample');

module.exports = {
    route: route,
    model: model,
    unitTypes: unitTypes,
    sample: sample
};
