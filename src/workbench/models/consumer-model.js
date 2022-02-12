/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * @typedef {Object} ConsumerModel - The consumer model to be attached to the scope.
 *
 * @property {string} username - The unique username of the consumer.
 * @property {string} custom_id - Field for storing an existing unique id for the consumer.
 * @property {string[]} tags - An optional set of strings associated with the consumer for grouping and filtering.
 */

/**
 * Defines a consumer model with default values.
 *
 * @type {ConsumerModel}
 */
export default {
    username: '',
    custom_id: '',
    tags: []
};
