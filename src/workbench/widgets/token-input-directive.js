'use strict';

import {isNil, isText} from '../../lib/core-toolkit.js';

const {document} = window;

/**
 * Attaches nodes under the unordered list.
 *
 * @private
 * @param {{tokenList: Array}} scope - the current scope
 * @param {HTMLElement} element - the parent element
 * @param {Array|string} tokens - tokens to be appended
 * @return {{append: function}} the element object
 */
function attachListNodes(scope, element, tokens) {
    const shouldAppend = isText(tokens);
    /* TODO : Skip splitting tokens by comma, if the feature is disabled using data-disable-parser="true". */
    const tokenList = shouldAppend === true ? tokens.split(',') : [...scope.tokenList];

    for (let token of tokenList) {
        token = token.trim();

        let li = document.createElement('li');
        li.dataset.tokenValue = token;
        li.innerHTML = `${token} <span class ="material-icons">highlight_off</span>`;

        element.appendChild(li);

        if (shouldAppend === true) {
            scope.tokenList.push(token);
        }
    }

    return element;
}

/**
 * Directive constructor for token-input widgets.
 *
 * @constructor
 *
 * @returns {Object} the directive object
 */
export default function TokenInputDirective() {
    return {
        transclude: false,
        restrict: 'E',
        require: 'ngModel',
        template: '<textarea class="token-input__text"></textarea><ul class="token-input__list"></ul>',
        scope: {tokenList: '=ngModel'},
        controller: [
            '$scope',
            function (scope) {
                scope.isInitialised = false;
            }
        ],

        /**
         *
         * @param {Object} scope - the ng-model of the element
         * @param {{children: function, addClass: function, on: function}} element - a jqLite instance of the element
         * @param {Object} attrs - the element attributes
         * @returns {boolean} true on linking, false otherwise
         */
        link(scope, element, attrs) {
            /** @type HTMLElement */
            const parent = element[0];

            if (!Array.isArray(scope.tokenList)) {
                return false;
            }

            /**
             * The textarea for typing tokens.
             *
             * @type {Object}
             * @property {function} attr - sets an attribute
             */
            const textNode = parent.querySelector('textarea.token-input__text');

            /**
             * The unordered list for attaching tokens.
             */
            const itemNode = parent.querySelector('ul.token-input__list');

            scope.$watch(
                'tokenList',
                (current, previous) => {
                    if (scope.isInitialised === false) {
                        scope.isInitialised = true;
                        attachListNodes(scope, itemNode, scope.tokenList);

                        return scope.isInitialised;
                    }

                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        attachListNodes(scope, itemNode, current);

                        return true;
                    }

                    return false;
                },
                false
            );

            parent.classList.add('token-input');

            itemNode.addEventListener('click', (event) => {
                const {target} = event;
                let element = target;

                if (target.nodeName === 'UL') {
                    return false;
                }

                if (target.nodeName === 'SPAN' && target.classList.contains('material-icons')) {
                    element = target.closest('li');
                }

                element.remove();

                if (Array.isArray(scope.tokenList)) {
                    scope.tokenList.splice(0);

                    for (let child of itemNode.children) {
                        let {tokenValue} = child.dataset;

                        if (typeof tokenValue === 'string') {
                            scope.tokenList.push(tokenValue);
                        }
                    }
                }
            });

            textNode.placeholder = isText(attrs.placeholder) ? attrs.placeholder : 'Type and press enter...';

            textNode.addEventListener('keyup', (event) => {
                const {target} = event;
                event.preventDefault();

                if (event.keyCode === 13) {
                    let value = target.value.trim();

                    if (value.length >= 1) {
                        attachListNodes(scope, itemNode, target.value.trim());
                    }

                    target.value = '';
                }
            });
        }
    };
}
