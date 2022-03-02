/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isText} from '../lib/core-toolkit.js';

/**
 * Copies text to clipboard.
 *
 * @param {MouseEvent} event - The mouse down event.
 * @return {boolean} True if copied, false otherwise.
 */
function copyToClipBoard(event) {
    const {target} = event;
    const {clipboardText} = target.dataset;

    if (isText(clipboardText)) {
        target.style.setProperty('color', 'var(--theme__primary-fg)');

        window.navigator.clipboard.writeText(clipboardText).then(() => {
            target.title = 'Copied!';
        });

        return true;
    }

    return false;
}

/**
 * Reverts the highlighted color.
 *
 * @param {MouseEvent} event - The mouseup event.
 * @return {boolean} Always true.
 */
function revertColor(event) {
    const {target} = event;
    target.style.setProperty('color', 'var(--theme__default-fg)');

    return true;
}

/**
 * Initializes the clipboard text directive.
 *
 * @param {Object} scope - The injected scope object.
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @param {{title?: string}} attributes - The element attributes.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element, attributes) {
    const parentElement = element[0];

    if (!isText(attributes.title)) {
        parentElement.title = 'Click to copy';
    }

    parentElement.classList.add('clickable', 'clipboard');

    parentElement.addEventListener('mousedown', copyToClipBoard);
    parentElement.addEventListener('mouseup', revertColor);

    scope.$on('$destroy', () => {
        parentElement.removeEventListener('mousedown', copyToClipBoard);
        parentElement.removeEventListener('mouseup', revertColor);
    });
}

/**
 * Provides constructor for creating clipboard text directive.
 *
 * HTML Element
 * <span data-clipboard-text="some-text-to-copy"></span>
 *
 * Element Properties:
 * - data-clipboard-text - The data to be copied to clipboard upon clicking.
 *
 * @constructor
 * @return {Object} The directive definition.
 */
export default function ClipboardTextDirective() {
    return {
        transclude: false,
        restrict: 'A',
        link
    };
}
