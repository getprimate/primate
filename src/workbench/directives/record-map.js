/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isObject, randomHex, trim} from '../lib/core-toolkit.js';

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
 * @returns {HTMLLIElement} The created LI element.
 */
function createRecordItem(key = '', value = '') {
    const li = document.createElement('li');
    li.dataset.identifier = randomHex();

    const keyInput = document.createElement('input');
    const valueInput = document.createElement('input');

    keyInput.type = 'text';
    keyInput.value = key;
    keyInput.name = `${li.dataset.identifier}_key`;

    valueInput.type = 'text';
    valueInput.value = value;
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
 * @return {Object} The added record object.
 */
function attachRecordItems(listElement, record) {
    for (let key of Object.keys(record)) {
        let li = createRecordItem(key, record[key]);
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
        let key = trim(child.firstChild.value, ''); /* Key text. */
        let value = trim(child.lastChild.value, ''); /* Value text. */

        if (key.length >= 1) {
            model[key] = value;
        }
    }

    return model;
}

/**
 * Provides a callback for record model watcher.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {HTMLUListElement} _listElement - The UL element.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function RecordModelWatcher(current, previous) {
    console.log('Current:', JSON.stringify(current));
    console.log('Previous:', JSON.stringify(previous));

    clearRecordItems(this._listElement);

    if (!isObject(current)) {
        return false;
    }

    if (Object.keys(current).length === 0) {
        const li = createRecordItem();
        this._listElement.appendChild(li);

        return true;
    }

    attachRecordItems(this._listElement, current);
    return true;
}

/**
 * Provides a callback for click event listener.
 *
 * This function should not be used directly.
 * Allways create and instant of this function with
 * the below properties:
 *
 * @property {Object} _recordModel - The model of the current scope.
 * @property {HTMLUListElement} _listElement - The UL element.
 *
 * @param {Object} current - The current model object.
 * @param {Object} previous  - The previous model object.
 * @returns {boolean} True if handled, false otherwise.
 */
function ButtonWrapperWatcher(event) {
    const {target} = event;

    if (target.nodeName === 'DIV') {
        return false;
    }

    const button = target.nodeName === 'BUTTON' ? target : target.parentElement;

    if (button.value === 'clear') {
        for (let key of Object.keys(this._recordModel)) {
            delete this._recordModel[key];
        }

        clearRecordItems(this._listElement);
        return true;
    }

    if (button.value === 'done') {
        updateRecordModel(this._listElement, this._recordModel);
        target.classList.remove('success');

        return true;
    }

    if (button.value === 'insert') {
        /* Do not insert a new LI if the input box in the last UL is empty. */
        if (trim(this._listElement.lastChild.firstChild.value).length === 0) {
            this._listElement.lastChild.firstChild.focus();
            return false;
        }

        const li = createRecordItem();
        this._listElement.appendChild(li);

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
    if (!isObject(scope.recordModel)) {
        return false;
    }

    /** @type HTMLElement */
    const parentElement = element[0];
    const childElements = {};

    childElements.recordElement = parentElement.firstChild;
    childElements.buttonWrapper = parentElement.lastChild;

    const clickEventListener = ButtonWrapperWatcher.bind({
        _recordModel: scope.recordModel,
        _listElement: childElements.recordElement
    });

    childElements.buttonWrapper.addEventListener('click', clickEventListener);

    scope.$watch('recordModel', RecordModelWatcher.bind({_listElement: childElements.recordElement}), false);

    scope.$on('$destroy', () => {
        parentElement.removeChild(childElements.recordElement);
        parentElement.remove();
    });
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
        '<ul class="record-map__items"></ul><div class="record-map__flex">' +
        '<button type="button" class="mini btn subtle" value="clear"><span class="material-icons">backspace</span></button>' +
        '<button type="button" class="mini btn subtle" value="insert"><span class="material-icons">add</span></button>' +
        '<button type="button" class="mini btn subtle" value="done"><span class="material-icons">done</span></button>' +
        '</div>';

    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        scope: {recordModel: '=ngModel'},
        link,
        template
    };
}
