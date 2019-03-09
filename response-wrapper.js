'use strict'

/**
 * For security reasons, it is common practice to wrap any server response in a JSON object with a 'data' field
 * This module simply performs that wrapping
 */

const response_wrapper = {
    wrap: (value) => ({ data: value })
}

module.exports = response_wrapper
