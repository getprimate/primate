app.controller('ApiListController', ['$scope', '$http', '$httpParamSerializerJQLike', 'viewFactory', 'toast',
    function ($scope, $http, $httpParamSerializerJQLike, viewFactory, toast) {

    viewFactory.title = 'API List'
    viewFactory.prevUrl = viewFactory.deleteAction = null

    $scope.formInput = {
        apiName: '',
        requestHost: '',
        requestPath: '',
        upstreamUrl: '',
        preserveHost: true,
        stripRequestPath: false
    }

    var panelAdd = angular.element('div#panelAdd')
    var apiForm = panelAdd.children('div.panel__body').children('form')

    var table = angular.element('table#apiTable')

    table.on('click', 'i.state-highlight', function (event) {
        var icon = angular.element(event.target)
        var payload = {}
        var attribute = icon.data('attribute')

        payload[attribute] = ((icon.hasClass('success')) ? false : true )

        $http({
            method: 'PATCH',
            url: buildUrl('/apis/' + icon.data('api-id')),
            data: $httpParamSerializerJQLike(payload),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then(() => {
            if ( payload[attribute] == true) {
                icon.removeClass('default').addClass('success')

            } else {
                icon.removeClass('success').addClass('default')
            }

            toast.success('Attribute ' + attribute + ' set to ' + payload[attribute])

        }, () => {
            toast.error('Unable to update ' + attribute)
        })
    })

    panelAdd.children('div.panel__heading').on('click', function () {
        apiForm.slideToggle(300)
    })

    apiForm.on('submit', function (event) {
        event.preventDefault();

        var payload = {};

        if ($scope.formInput.apiName.trim().length > 1) {
            payload.name = $scope.formInput.apiName;
        }

        if ($scope.formInput.requestHost.trim().length > 1) {
            payload.request_host = $scope.formInput.requestHost;
        }

        if (typeof payload.name === 'undefined' &&
                typeof payload.request_host === 'undefined') {
            apiForm.find('input[name="apiName"]').focus();
            return false;
        }

        if ($scope.formInput.requestPath.trim().length > 1) {
            payload.request_path = $scope.formInput.requestPath;
        }

        if ( typeof payload.request_path === 'undefined' &&
            typeof payload.request_host === 'undefined') {
            apiForm.find('input[name="requestPath"]').focus()
            return false;
        }

        if ($scope.formInput.upstreamUrl.trim().length > 1) {
            payload.upstream_url = $scope.formInput.upstreamUrl;
        } else {
            apiForm.find('input[name="upstreamUrl"]').focus()
            return false;
        }

        payload.strip_request_path = $scope.formInput.stripRequestPath;
        payload.preserve_host = $scope.formInput.preserveHost

        $http({
            method: 'POST',
            url: buildUrl('/apis/'),
            data: $httpParamSerializerJQLike(payload),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        }).then((response) => {
            $scope.apiList.push(response.data)

            toast.success('New API added')

        }, (response) => {
            if (response.status == 401) {
                toast.error('Duplicate value for one of the API parameters')
                
            } else {
                toast.error('Could not add new API')
            }
        })

        return false
    })

    apiForm.on('click', 'button[name="actionCancel"]', function () {
        apiForm.slideUp(300)
    })

    $http({
        method: 'GET',
        url: buildUrl('/apis')
    }).then((response) => {
        $scope.apiList = response.data.data

    }, () => {
        toast.error('Could not load list of APIs')
    })
}])