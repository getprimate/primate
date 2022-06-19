/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

/**
 * Provides a callback for record model watcher.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {HTMLElement} _recordElement - The text area element.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordModelWatcher(current, previous) {
    if (previous === null) {
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
    if (this._recordScope.recordModel === null) this._recordScope.recordModel = {};

    const button = target.nodeName === 'BUTTON' ? target : target.parentElement;

    /* Remove individual keys so as to not to trigger the watcher. */
    if (Array.isArray(this._recordScope.recordModel)) {
        this._recordScope.recordModel.length = 0;
    } else {
        for (let key of Object.keys(this._recordScope.recordModel)) {
            delete this._recordScope.recordModel[key];
        }
    }

    if (button.value === 'clear') {
        this._recordElement.value = JSON.stringify(this._recordScope.recordModel, null, 4);

        wrapper.lastChild.classList.remove('success');
        wrapper.lastChild.title = 'Changes applied';

        this._recordScope.isModified = false;
        return true;
    }

    if (button.value === 'done') {
        try {
            const parsed = JSON.parse(this._recordElement.value);

            /* Copy individual keys so as to not to trigger the watcher. */
            for (let key of Object.keys(parsed)) {
                key = Array.isArray(this._recordScope.recordModel) ? parseInt(key) : key;
                this._recordScope.recordModel[key] = parsed[key];
            }

            /* Pretty-print the JSON object back to the text area. */
            this._recordElement.value = JSON.stringify(parsed, null, 4);
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
    if (scope.recordModel === null) {
        scope.recordModel = {};
    }

    /** @type HTMLElement */
    const parentElement = element[0];
    const childElements = {
        recordElement: parentElement.firstChild,
        recordControl: parentElement.lastChild
    };

    const recordModelWatcher = RecordModelWatcher.bind({
        _options: {sanitiseValues: attributes.sanitiseValues === 'true'},
        _recordElement: childElements.recordElement
    });

    const clickEventListener = RecordControlWatcher.bind({
        _recordScope: scope,
        _recordElement: childElements.recordElement
    });

    const inputEventListener = RecordElementWatcher.bind({
        _recordScope: scope,
        _recordControl: childElements.recordControl
    });

    scope.$watch('recordModel', recordModelWatcher, false);

    childElements.recordControl.addEventListener('click', clickEventListener);
    childElements.recordElement.addEventListener('input', inputEventListener);

    scope.$on('$destroy', () => {
        parentElement.removeChild(childElements.recordElement);
        parentElement.removeChild(childElements.recordControl);

        parentElement.remove();
    });
}

function RecordMapController(scope) {
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
        controller: ['$scope', RecordMapController],
        link,
        template
    };
}
