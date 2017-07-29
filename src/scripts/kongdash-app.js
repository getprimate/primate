'use strict';

/* global angular:true ngDependency:true */
var app = angular.module('KongDash', ['ngAnimate', 'base64'].concat(typeof ngDependency === 'undefined' ? [] : ngDependency));

app.provider('ajax', ['$base64',  function ($base64) {
    let httpConfig = {};

    let httpRequest = function (config) {
        let request = {
            method: config.method,
            url: config.url || (httpConfig.host + config.resource),
            headers: {},
            withCredentials: false
        };

        if (typeof config.data === 'object')
            request.data = config.data;

        if (typeof httpConfig.authorization === 'string') {
            request.withCredentials = true;
            request.headers['Authorization'] = httpConfig.authorization;
        }

        if (typeof httpConfig.accept === 'string')
            request.headers['Accept'] = httpConfig.accept;

        if (typeof httpConfig.contentType === 'string')
            request.headers['Content-Type'] = httpConfig.contentType;

        if (typeof config.headers === 'object') {
            Object.keys(config.headers).forEach(function (item) {
                request.headers[item] = config.headers[item];
            });
        }

        if (Object.keys(request.headers).length <= 0)
            delete request.headers;

        return request;
    };

    this.setHost = function (host) {
        httpConfig.host = host;
    };

    this.basicAuth = function (username, password) {
        httpConfig.authorization = 'Basic ' + $base64.encode(username + ':' + (password || ''));
    };

    this.accept = function (type) {
        httpConfig.accept = type;
    };

    this.contentType = function (type) {
        httpConfig.contentType = type;
    };

    this.$get = ['$http', function ($http) {
        return {
            request: function (config) {
                return $http(httpRequest(config));
            },
            get: function (config) {
                config.method = 'GET';
                return $http(httpRequest(config));
            },
            post: function (config) {
                config.method = 'POST';
                return $http(httpRequest(config));
            },
            put: function (config) {
                config.method = 'PUT';
                return $http(httpRequest(config));
            },
            patch: function (config) {
                config.method = 'PATCH';
                return $http(httpRequest(config));
            },
            delete: function (config) {
                config.method = 'DELETE';
                return $http(httpRequest(config));
            },
            setHost: function (host) {
                httpConfig.host = host;
            },
            basicAuth: function (username, password) {
                if (!username) return;
                httpConfig.authorization = 'Basic ' + $base64.encode(username + ':' + (password || ''));
            }
        };
    }];
}]);

app.factory('toast', function () {
    return {
        displayMessage: function (message) {
            let body = angular.element('body'), text = '', status;

            if (body.children('.notification').length > 0)
                body.children('.notification').remove();

            try {
                if (typeof message.text === 'object') {
                    if (Object.keys(message.text).length > 0) {
                        let firstKey = Object.keys(message.text)[0];

                        if ((firstKey === 'error' || firstKey === 'message') && typeof message.text[firstKey] === 'string')
                            text = message.text[firstKey];
                        else
                            text = firstKey + ' ' + message.text[firstKey];

                    } else {
                        text = 'No details available!';
                    }
                } else {
                    text = message.text;
                }
            } catch (e) {
                text = 'No details available!';
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
                    break;
            }

            let div = angular.element('<div></div>', {class: 'notification ' + message.type})
                .html('<b>' + status + '</b> ' + text + '.')
                .on('click', function () {
                    div.fadeOut(200);
                });

            body.append(div);
            let interval = setInterval(function () {
                div.fadeOut({
                    duration: 1000, complete: function () {
                        clearInterval(interval);
                    }
                });
            }, 4000);
        },
        error: function (message) {
            this.displayMessage({ type: 'danger', text: message });
        },
        warning: function (message) {
            this.displayMessage({ type: 'warning', text: message });
        },
        info: function (message) {
            this.displayMessage({ type: 'info', text: message });
        },
        success: function (message) {
            this.displayMessage({ type: 'success', text: message });
        }
    };
});

/**
 * Converts first letter of a string to uppercase and
 * replaces underscores with whitespaces.
 */
app.filter('pgname', function () {
    return function (input) {
        if (typeof input !== 'string' || input === null) {
            return '';
        }

        return (input.charAt(0).toUpperCase() + input.substr(1).toLowerCase()).split('_').join(' ');
    };
});

/**
 * Strips protocol (http:// or https://) from URL.
 */
app.filter('stripProtocol', function () {
    return function (input) {
        if (!input) return '';

        if (input.indexOf('s://') > 1) return input.split('https://')[1];

        return (input.split('http://')[1]) || '';
    };
});

/**
 * Joins a string array with commas.
 */
app.filter('splice', function () {
    return function (input) {
        if (typeof input !== 'object') {
            return '';
        }

        return input.join(', ');
    };
});