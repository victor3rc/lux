    //
    //  CMS api for dynamic web apps
    //  -------------------------------
    //
    angular.module('lux.cms.api', ['lux.services'])

        .run(['$lux', '$window', function ($lux, $window) {
            var pageCache = {};

            $lux.registerApi('cms', {
                //
                url: function (urlparams) {
                    var url = this._url,
                        name = urlparams ? urlparams.slug : null;
                    if (url.substring(url.length-5) === '.json')
                        return url;
                    if (url.substring(url.length-1) !== '/')
                        url += '/';
                    url += name || 'index';
                    if (url.substring(url.length-5) === '.html')
                        url = url.substring(0, url.length-5);
                    else if (url.substring(url.length-1) === '/')
                        url += 'index';
                    if (url.substring(url.length-5) !== '.json')
                        url += '.json';
                    return url;
                },
                //
                getPage: function (page, state, stateParams) {
                    var href = lux.stateHref(state, page.name, stateParams),
                        data = pageCache[href];
                    if (data)
                        return data;
                    //
                    return this.get(stateParams).then(function (response) {
                        var data = response.data;
                        pageCache[href] = data;
                        forEach(data.require_css, function (css) {
                            loadCss(css);
                        });
                        if (data.require_js) {
                            var defer = $lux.q.defer();
                            require(rcfg.min(data.require_js), function () {
                                // let angular resolve its queue if it needs to
                                defer.resolve(data);
                            });
                            return defer.promise;
                        } else
                            return data;
                    }, function (response) {
                        if (response.status === 404) {
                            $window.location.reload();
                        }
                    });
                },
                //
                getItems: function (page, state, stateParams) {}
            });
        }]);
