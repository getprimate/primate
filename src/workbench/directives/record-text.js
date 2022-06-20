/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';

/**
 * Provides a callback for record model watcher.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {Object} _recordScope - The current directive scope.
 * @property {HTMLElement} _recordElement - The text area element.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordModelWatcher(current, previous) {
    if (_.isNil(current)) {
        this._recordElement.value = '';
        return false;
    }

    this._recordElement.value = JSON.stringify(current, null, 4);
    return true;
}

/**
 * Provides a callback for input event listener.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {Object} _recordScope - The current directive scope.
 * @property {Object} _recordScope.recordModel - The model object.
 * @property {HTMLUListElement} _recordElement - The text area element.
 * @property {HTMLElement} _recordControl - The contrl wrapper
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordElementWatcher() {
    if (this._recordScope.isModified === true) {
        return true;
    }

    this._recordScope.isModified = true;
    this._recordControl.firstChild.innerHTML = '';
    this._recordControl.lastChild.classList.add('success');

    return true;
}

/**
 * Provides a callback for click event listener.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {Object} _recordScope - The current directive scope.
 * @property {Object} _recordScope.recordModel - The model object.
 * @property {HTMLUListElement} _recordElement - The textarea element.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordControlWatcher(event) {
    const {currentTarget: wrapper, target} = event;
    wrapper.firstChild.innerHTML = '';

    if (target.nodeName === 'DIV') return false;

    const button = target.nodeName === 'BUTTON' ? target : target.parentElement;

    if (button.value === 'clear') {
        this._recordScope.$apply((scope) => {
            scope.recordModel = null;
        });

        wrapper.lastChild.classList.remove('success');
        wrapper.lastChild.title = 'Changes applied';

        this._recordScope.isModified = false;
        return true;
    }

    if (button.value === 'done') {
        try {
            const parsed = JSON.parse(this._recordElement.value);
            this._recordScope.$apply((scope) => {
                scope.recordModel = parsed;
            });
        } catch (e) {
            wrapper.firstChild.innerHTML = 'JSON validation failed!';
            return false;
        }

        this._recordScope.isModified = false;

        button.classList.remove('success');
        button.title = 'Changes applied';

        return true;
    }

    return false;
}

/**
 * Initializes the record map directive.
 *
 * @param {Object} scope - The injected scope object.
 * @property {string=} scope.recordModel - An object containing added items.
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @param {{placeholder?: string}} attributes - The element attributes.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element, attributes) {
    /** @type HTMLElement */
    const parentElement = element[0];
    const childElements = {
        recordElement: parentElement.firstChild,
        recordControl: parentElement.lastChild
    };

    const context = {
        _recordScope: scope,
        _recordElement: childElements.recordElement,
        _recordControl: childElements.recordControl
    };

    const recordModelWatcher = RecordModelWatcher.bind(context);
    const clickEventListener = RecordControlWatcher.bind(context);
    const inputEventListener = RecordElementWatcher.bind(context);

    scope.$watch('recordModel', recordModelWatcher, false);

    childElements.recordControl.addEventListener('click', clickEventListener);
    childElements.recordElement.addEventListener('input', inputEventListener);

    scope.$on('$destroy', () => {
        parentElement.removeChild(childElements.recordElement);
        parentElement.removeChild(childElements.recordControl);

        parentElement.remove();
    });
}

function RecordTextController(scope) {
    scope.isModified = false;
}

/**
 * Provides definitions for creating record text directive.
 *
 * HTML Element
 * <record-text></record-text>
 *
 * Element Properties:
 * - data-ng-model - The model reference. Should be an object or null.
 *
 * @return {Object} The directive definition.
 */
export default function RecordTextDirective() {
    const template =
        '<textarea></textarea>' +
        '<div class="control">' +
        '<div class="pull-left" style="color: var(--std__warning);"></div>' +
        '<button type="button" value="clear" title="Clear all rows"><span class="material-icons">backspace</span></button>' +
        '<button type="button" value="done" title="No changes made"><span class="material-icons">done</span></button>' +
        '</div>';

    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        scope: {recordModel: '=ngModel'},
        controller: ['$scope', RecordTextController],
        link,
        template
    };
}
