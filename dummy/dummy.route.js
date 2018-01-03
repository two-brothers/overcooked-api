'use strict';

/**
 * A dummy route to demonstrate the basic structure
 */

const express = require('express');
const router = express.Router();
const wrapper = require('../response-wrapper');

router.get('/', (req, res, next) => {
   if(true) {
       res.json(wrapper.wrap({dummyResponse: 'Dum de dum dum'}));
   } else {
       next({status: 500, message: 'Something has gone horribly wrong'});
   }
});

module.exports = router;
