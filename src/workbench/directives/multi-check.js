/**
 * Copyright (c) Ajay Sreedhar. All rights reserved.
 *
 * Licensed under the MIT License.
 * Please see LICENSE file located in the project root for more information.
 */

'use strict';

import {isObject, /* isText, */ randomHex} from '../lib/core-toolkit.js';

const {document} = window;

/**
 * Creates a LI node with blank placeholder label.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 */
function attachBlankLabel(listElement) {
    let itemElement = document.createElement('li');
    let labelElement = document.createElement('label');

    labelElement.innerHTML = '-- Empty --';

    itemElement.appendChild(labelElement);
    listElement.appendChild(itemElement);

    return labelElement;
}

/**
 * Creates LI nodes with token values under the specified UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {Object[]|string[]} available - An array of nodeValue - displayText pair.
 * @param {string[]} selected - An array of items to be marked as selected.
 * @return {Object[]} The added token array.
 */
function attachItemElements(listElement, available, selected = []) {
    /* const inputClass = listElement.parentElement.dataset.inputClass; */

    for (let item of available) {
        let {nodeValue, displayText} = isObject(item) ? item : {nodeValue: item, displayText: item};

        let itemElement = document.createElement('li');
        let inputElement = document.createElement('input');
        let labelElement = document.createElement('label');

        itemElement.dataset.identifier = randomHex();

        inputElement.type = 'checkbox';
        inputElement.value = nodeValue;

        if (selected.indexOf(nodeValue) >= 0) {
            inputElement.checked = true;
        }

        labelElement.appendChild(inputElement);
        labelElement.append(`\u00A0 ${displayText}`);

        itemElement.appendChild(labelElement);
        listElement.appendChild(itemElement);
    }

    return available;
}

/**
 * Removes all LI nodes from the UL element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @return {number} - The number of items removed.
 */
function clearItemElements(listElement) {
    const length = 0;

    while (listElement.firstChild !== null) {
        listElement.removeChild(listElement.lastChild);
    }

    return length;
}

/**
 * Checks the input elements as per the values in items array.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @param {string[]} selected - An array of nodeValues to be checked.
 * @return {number} - The number of items checked.
 */
function checkSelectedItems(listElement, selected) {
    let counter = 0;

    for (let child of listElement.children) {
        let inputElement = child.querySelector('input[type="checkbox"]');

        if (selected.indexOf(inputElement.value) >= 0) {
            inputElement.checked = true;
        }
    }

    return counter;
}

/**
 * Unchecks all inputs in the list element.
 *
 * @param {HTMLUListElement} listElement - The parent UL element.
 * @return {number} - The number of items unchecked.
 */
function uncheckAllItems(listElement) {
    let counter = 0;

    for (let child of listElement.children) {
        let inputElement = child.querySelector('input[type="checkbox"]');

        if (inputElement.checked === true) {
            counter++;
        }

        inputElement.checked = false;
    }

    return counter;
}

/**
 * Initializes the multi-check directive.
 *
 * @param {Object} scope - The injected scope object.
 * @property {string[]=} scope.available - An array of available items to be checked
 * @property {string[]=} scope.selected - An array of items selected from available list
 * @param {Object} element - The parent element wrapped as jqLite object.
 * @return {boolean} True if linking successful, false otherwise.
 */
function link(scope, element) {
    if (!Array.isArray(scope.selected) || !Array.isArray(scope.available)) {
        return false;
    }

    /** @type HTMLElement */
    const parentElement = element[0];

    const childElements = {};
    childElements.listElement = parentElement.querySelector('ul.multi-check__list');

    /**
     * Marks the checkboxes as checked or unchecked.
     *
     * @param {string[]} current - The current array of items.
     * @param {string[]} previous - The previous array of items.
     * @return {boolean} True if items were checked, false otherwise.
     */
    const onSelectedListUpdated = (current, previous) => {
        uncheckAllItems(childElements.listElement);

        if (!Array.isArray(previous) || current.length >= 1) {
            checkSelectedItems(childElements.listElement, current);
            return true;
        }

        return false;
    };

    /**
     * Updates the UL element if a change in the available items array is detected.
     *
     * @param {string[]} current - The current array of items.
     * @param {string[]} previous - The previous array of items.
     * @return {boolean} True if new LI items were added, false otherwise.
     */
    const onAvailableListUpdated = (current, previous) => {
        clearItemElements(childElements.listElement);

        if (!Array.isArray(current) || current.length === 0) {
            attachBlankLabel(childElements.listElement);
            return false;
        }

        if (!Array.isArray(previous) || current.length >= 1) {
            const items = attachItemElements(childElements.listElement, current, scope.selected);
            return items.length >= 1;
        }

        return false;
    };

    if (scope.available.length >= 1) {
        attachItemElements(childElements.listElement, scope.available, scope.selected);
    }

    childElements.listElement.addEventListener('click', (event) => {
        const {target} = event;

        if (target.nodeName !== 'INPUT') {
            return false;
        }

        if (target.checked === true) {
            scope.selected.push(target.value);
        } else {
            const index = scope.selected.indexOf(target.value);
            scope.selected.splice(index, 1);
        }
    });

    scope.$watch('selected', onSelectedListUpdated, false);
    scope.$watch('available', onAvailableListUpdated, false);

    scope.$on('$destroy', () => {
        clearItemElements(childElements.listElement);

        parentElement.removeChild(childElements.listElement);
        childElements.listElement = null;

        parentElement.remove();
    });
}

/**
 * Provides constructor for creating multi check directive.
 *
 * HTML Element
 * <multi-check></multi-check>
 *
 * Element Properties:
 * - data-ng-model - The model reference. Should be an array.
 * - data-placeholder - A placeholder text to be displayed on the text area.
 *
 * @constructor
 * @return {Object} The directive definition.
 */
export default function MultiCheckDirective() {
    const template = '<ul class="multi-check__list"></ul>';

    return {
        transclude: false,
        restrict: 'E',
        require: ['ngModel'],
        scope: {selected: '=ngModel', available: '=optionList'},
        link,
        template
    };
}
