/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import * as _ from '../lib/core-toolkit.js';

const {document} = window;

/**
 * Removes all LI nodes from the UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @return {number} - The number of items removed.
 */
function clearRecordItems(listElement) {
    let length = 0;

    while (listElement.firstChild !== null) {
        listElement.removeChild(listElement.lastChild);
        length++;
    }

    return length;
}

/**
 * Creates a LI element with the text inputs for key and value pair.
 *
 * @param {string} key - The text to be displayed in the key input box.
 * @param {string} value  - The text to be displayed on the value input box.
 * @param {{
 *      keyPlaceholder: string,
 *      valuePlaceholder: string
 *      }} - The key and value placeholder texts.
 * @returns {HTMLLIElement} The created LI element.
 */
function createRecordItem(key = '', value = '', options) {
    const li = document.createElement('li');
    li.dataset.identifier = _.randomHex();

    const keyInput = document.createElement('input');
    const valueInput = document.createElement('input');

    keyInput.type = valueInput.type = 'text';

    keyInput.value = key;
    keyInput.placeholder = options.keyPlaceholder;
    keyInput.name = `${li.dataset.identifier}_key`;

    valueInput.value = value;
    valueInput.placeholder = options.valuePlaceholder;
    valueInput.name = `${li.dataset.identifier}_value`;

    li.appendChild(keyInput);
    li.appendChild(valueInput);

    return li;
}

/**
 * Creates LI nodes with token values under the specified UL element.
 *
 * The function iterates over a JSON object and creates LI element
 * by calling {@link createRecordItem} function repeatedly.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {Object} record - An object containing the key-value pairs.
 * @param {{
 *      keyPlaceholder: string,
 *      valuePlaceholder: string
 *      }} options - The key and value placeholder texts.
 * @return {Object} The added record object.
 */
function attachRecordItems(listElement, record, options) {
    for (let key of Object.keys(record)) {
        let li = createRecordItem(key, record[key], options);
        listElement.appendChild(li);
    }

    return record;
}

/**
 * Iterates the list element and populates the record model object.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {Object} model - The model attached to the current scope.
 * @return {Object} The updated model.
 */
function updateRecordModel(listElement, model) {
    const children = listElement.childNodes;

    for (let key of Object.keys(model)) {
        delete model[key];
    }

    for (let child of children) {
        let key = _.trim(child.firstChild.value, ''); /* Key text. */
        let value = _.trim(child.lastChild.value, ''); /* Value text. */

        if (key.length >= 1) {
            model[key] = value;
        }
    }

    return model;
}

/**
 * Provides a callback for record model watcher.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {HTMLUListElement} _recordElement - The UL element.
 * @property {Object} _options - Configuration options.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordModelWatcher(current, previous) {
    clearRecordItems(this._recordElement);

    if (!_.isObject(current)) {
        return false;
    }

    if (Object.keys(current).length === 0) {
        const li = createRecordItem('', '', this._options);
        this._recordElement.appendChild(li);

        return true;
    }

    if (_.isObject(this._options) && this._options.sanitiseValues === true) {
        const keyList = Object.keys(current);

        for (let key of keyList) {
            if (Array.isArray(current[key])) current[key] = _.implode(current[key]);
            else if (_.isObject(current[key])) current[key] = JSON.stringify(current[key]);
            else if (current[key] === null) current[key] = '';
        }
    }

    attachRecordItems(this._recordElement, current, this._options);
    return true;
}

/**
 * Provides a callback for click event listener.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {{recordModel: {}}} _recordScope - The current directive scope.
 * @property {HTMLUListElement} _recordElement - The UL element.
 * @property {HTMLElement} _recordControl - The contrl wrapper
 * @property {Object} _options - Configuration options.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordElementWatcher(event) {
    if (this._recordScope.isModified === true || event.target.nodeName !== 'INPUT') {
        return true;
    }

    this._recordScope.isModified = true;
    this._recordControl.lastChild.classList.add('success');

    return true;
}

/**
 * Provides a callback for click event listener.
 *
 * This function should not be called directly.
 * Allways create a bound function with the below context:
 *
 * @property {{recordModel: {}}} _recordScope - The current directive scope.
 * @property {HTMLUListElement} _recordElement - The UL element.
 * @property {Object} _options - Configuration options.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordControlWatcher(event) {
    const {currentTarget: wrapper, target} = event;

    if (target.nodeName === 'DIV') {
        return false;
    }

    const button = target.nodeName === 'BUTTON' ? target : target.parentElement;

    if (button.value === 'clear') {
        for (let key of Object.keys(this._recordScope.recordModel)) {
            delete this._recordScope.recordModel[key];
        }

        clearRecordItems(this._recordElement);

        wrapper.lastChild.classList.remove('success');
        wrapper.lastChild.title = 'Changes applied';

        this._recordScope.isModified = false;

        return true;
    }

    if (button.value === 'done') {
        if (_.isNil(this._recordScope.recordModel)) {
            this._recordScope.recordModel = {};
        }

        updateRecordModel(this._recordElement, this._recordScope.recordModel);
        this._recordScope.isModified = false;

        button.classList.remove('success');
        button.placeholder = 'Changes applied';

        return true;
    }

    if (button.value === 'insert') {
        /* Do not insert a new LI if the input box in the last UL is empty. */
        if (
            this._recordElement.childNodes.length >= 1 &&
            _.trim(this._recordElement.lastChild.firstChild.value).length === 0
        ) {
            this._recordElement.lastChild.firstChild.focus();
            return false;
        }

        const li = createRecordItem('', '', this._options);
        this._recordElement.appendChild(li);

        if (this._recordScope.isModified === false) {
            this._recordScope.isModified = true;
            wrapper.lastChild.classList.add('success');
            wrapper.lastChild.title = 'Apply changes';
        }

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
 * @param {{disableParser?: string, placeholder?: string}} attributes - The element attributes.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element, attributes) {
    if (!_.isObject(scope.recordModel)) {
        return false;
    }

    /** @type HTMLElement */
    const parentElement = element[0];
    const childElements = {
        headerElement: parentElement.firstChild,
        recordElement: parentElement.childNodes[1],
        recordControl: parentElement.lastChild
    };

    const options = {
        sanitiseValues: attributes.sanitiseValues === 'true',
        keyPlaceholder: _.isText(attributes.keyPlaceholder) ? attributes.keyPlaceholder : 'Key',
        valuePlaceholder: _.isText(attributes.valuePlaceholder) ? attributes.valuePlaceholder : 'Value'
    };

    const context = {
        _options: options,
        _recordScope: scope,
        _recordControl: childElements.recordControl
    };

    const recordModelWatcher = RecordModelWatcher.bind(context);
    const clickEventListener = RecordControlWatcher.bind(context);
    const inputEventListener = RecordElementWatcher.bind(context);

    if (_.isText(attributes.headerText)) {
        childElements.headerElement.innerHTML = attributes.headerText;
    }

    childElements.recordElement.addEventListener('input', inputEventListener);
    childElements.recordControl.addEventListener('click', clickEventListener);

    scope.$watch('recordModel', recordModelWatcher, false);

    scope.$on('$destroy', () => {
        parentElement.removeChild(childElements.recordElement);
        parentElement.remove();
    });
}

function RecordMapController(scope) {
    scope.isModified = false;
}

/**
 * Provides definitions for creating record map directive.
 *
 * HTML Element
 * <record-map></record-map>
 *
 * Element Properties:
 * - data-ng-model - The model reference. Should be an array.
 *
 * @return {Object} The directive definition.
 */
export default function RecordMapDirective() {
    const template =
        '<h6>Input key value pairs</h6>' +
        '<ul class="records"></ul><div class="control">' +
        '<button type="button" value="clear" title="Clear all rows"><span class="material-icons">backspace</span></button>' +
        '<button type="button" value="insert" title="Insert new row"><span class="material-icons">add</span></button>' +
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
