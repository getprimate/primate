(function (window, angular, undefined) { 'use strict';

    if (typeof angular == 'undefined') {
        return;
    }

    var displayMessage = function (message) {
        var body = angular.element('body'), status;

        if (body.children('.notification').length > 0)
            body.children('.notification').remove();

        var text = '';

        try {
            if (typeof message.text === 'object') {
                if (Object.keys(message.text).length > 0) {
                    var firstKey = Object.keys(message.text)[0];

                    if ((firstKey === 'error' || firstKey === 'message') && typeof message.text[firstKey] === 'string') {
                        text = message.text[firstKey];
                    } else {
                        text = firstKey + ' ' + message.text[firstKey];
                    }
                } else {
                    text = 'No details available!';
                }
            } else {
                text = message.text
            }
        } catch (e) {
            text = 'No details available!'
        }

        switch (message.type) {
            case 'danger':
                status = 'Error!';
                break;

            case 'success':
                status = 'Success!';
                break;

            case 'warning':
                status = 'Warning!';
                break;

            default:
                status = 'Message:';
                break
        }

        var div = angular.element('<div></div>', { class: 'notification ' + message.type })
            .html('<b>' + status + '</b> ' + text + '.')
            .on('click', function () {
                div.fadeOut(200);
            });

        body.append(div);
        var interval = setInterval(function () { div.fadeOut({ duration: 1000, complete: function () { clearInterval(interval); } }) }, 4000);
    };

    angular.module('ngToast', [])
        .provider('toast', [function () {
            this.$get =[function() {
                return {
                    show: displayMessage,
                    error: function (message) { displayMessage({ type: 'danger', text: message }) },
                    warning: function (message) { displayMessage({ type: 'warning', text: message }) },
                    info: function (message) { displayMessage({ type: 'info', text: message }) },
                    success: function (message) { displayMessage({ type: 'success', text: message }) }
                }
            }]
        }]);
})(window, window.angular);