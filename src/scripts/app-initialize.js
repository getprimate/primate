(function (app) {
    if (typeof app === 'undefined') {
        throw 'InitController: app is undefined';
    }

    app.config(['ajaxProvider', function (ajaxProvider) {
        ajaxProvider.accept('application/json');
        ajaxProvider.contentType('application/json');

        if (typeof kongConfig.username === 'string') {
            ajaxProvider.basicAuth(kongConfig.username, kongConfig.password || '');
        }
    }]);
})(app);