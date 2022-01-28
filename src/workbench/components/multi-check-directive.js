'use strict';

const {document} = window;

/**
 *
 * @param {HTMLElement} element
 * @param {Object} scope
 * @returns {*}
 * @private
 */
function _refresh(element, scope) {
    const {available, selected} = scope;
    const ul = element.querySelector('ul');
    const inputStyle = typeof element.dataset['inputStyle'] === 'string' ? element.dataset['inputStyle'] : 'success';

    /* Remove all existing child elements. */
    while (ul.firstChild) {
        ul.firstChild.remove();
    }

    for (let item of available) {
        let {nodeValue, displayText} = typeof item === 'object' ? item : {nodeValue: item, displayText: item};

        let li = document.createElement('li');
        let input = document.createElement('input');

        input.type = 'checkbox';
        input.classList.add('multi-check__input', inputStyle);
        input.dataset['nodeValue'] = nodeValue;

        let label = document.createElement('label');

        if (selected.indexOf(nodeValue) >= 0) {
            input.checked = true;
        }

        label.appendChild(input);
        label.append(`\u00A0 ${displayText}`);

        li.appendChild(label);
        ul.appendChild(li);
    }

    return element;
}

export default function MultiCheckDirective() {
    return {
        transclude: false,
        restrict: 'E',
        require: ['ngModel'],
        template: '<ul></ul>',
        scope: {selected: '=ngModel', available: '=optionList'},
        controller: [
            '$scope',
            function (scope) {
                scope.isInitialised = false;
            }
        ],
        link(scope, element) {
            if (!Array.isArray(scope.selected) || !Array.isArray(scope.available)) {
                return false;
            }

            /** @type {HTMLElement} */
            const parent = element[0];

            _refresh(parent, scope);

            scope.$watch(
                'selected',
                (current, previous) => {
                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        return _refresh(parent, scope);
                    }
                },
                false
            );

            scope.$watch(
                'available',
                (current, previous) => {
                    if (Array.isArray(previous) && Array.isArray(current) && previous.length !== current.length) {
                        return _refresh(parent, scope);
                    }
                },
                false
            );

            parent.addEventListener('click', (event) => {
                const {target} = event;

                if (target.nodeName !== 'INPUT') {
                    return false;
                }

                const {nodeValue} = target.dataset;

                if (target.checked === true) {
                    scope.selected.push(nodeValue);
                } else {
                    let position = scope.selected.indexOf(nodeValue);
                    scope.selected.splice(position, 1);
                }
            });

            scope.isInitialised = true;
        }
    };
}
