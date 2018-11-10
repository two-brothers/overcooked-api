'use strict';

const mongoose = require('mongoose');
const Ingredient = new mongoose.Schema({
    name: {
        singular: {
            type: String,
            required: true
        },
        plural: {
            type: String,
            required: true
        }
    }
});

module.exports = mongoose.model('IIngredient', Ingredient);