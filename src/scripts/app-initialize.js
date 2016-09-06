/* global app:true kongConfig:true */
(function (app, kongConfig) { 'use strict';

    if (typeof app === 'undefined') throw 'app-initialize.js: app is undefined';

    app.config(['ajaxProvider', function (ajaxProvider) {
        ajaxProvider.accept('application/json');
        ajaxProvider.contentType('application/json');

        if (typeof kongConfig.username === 'string') {
            ajaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
        }
    }]);

})(app, kongConfig);
