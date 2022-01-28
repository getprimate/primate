'use strict';

const {document} = window;

/**
 * Attaches nodes under the unordered list.
 *
 * @private
 * @param {{tokenList: Array}} scope - the current scope
 * @param {HTMLElement} element - the jqLite wrapped instance of the element
 * @param {Array|string} tokens - tokens to be appended
 * @return {{append: function}} the element object
 */
const _attachListNodes = (scope, element, tokens) => {
    const shouldAppend = typeof tokens === 'string';
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
};

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
         * @param {{tokenList: Array, isInitialised: boolean, $watch: function}} scope - the ng-model of the element
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
                    if (scope.isInitialised === true) {
                        return scope.isInitialised;
                    }

                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        scope.isInitialised = true;
                        return _attachListNodes(scope, itemNode, scope.tokenList);
                    }

                    return scope.isInitialised;
                },
                false
            );

            parent.classList.add('token-input');

            itemNode.addEventListener('click', (event) => {
                const {target} = event;

                if (target.nodeName !== 'LI' || target.nodeName !== 'SPAN') {
                    return false;
                }

                target.remove();

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

            textNode.placeholder =
                typeof attrs.placeholder === 'string' ? attrs.placeholder : 'Type and press enter...';

            textNode.addEventListener('keyup', (event) => {
                const {target} = event;
                event.preventDefault();

                if (event.keyCode === 13) {
                    let value = target.value.trim();

                    if (value.length >= 1) {
                        _attachListNodes(scope, itemNode, target.value.trim());
                    }

                    target.value = '';
                }
            });
        }
    };
}
