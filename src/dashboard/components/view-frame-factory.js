/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

const _viewFrame = {
    title: '',
    prevUrl: '',
    host: '',
    actionButtons: []
};

export default function ViewFrameFactory() {
    return _viewFrame;
}
