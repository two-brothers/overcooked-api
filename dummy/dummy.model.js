'use strict';

const mongoose = require('mongoose');
const DummySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('IDummy', DummySchema );