'use strict';

const route = require('./food.route');
const model = require('./food.model');
const unit_types = require('./unit_types');
const sample = require('./food.sample');

module.exports = {
    route: route,
    model: model,
    unit_types: unit_types,
    sample: sample
};