
    //  Google Spreadsheet API
    //  -----------------------------
    //
    //  Create one by passing the key of the spreadsheeet containing data
    //
    //      var api = $lux.api({name: 'googlesheets', url: sheetkey});
    //
    lux.createApi('googlesheets', {
        //
        endpoint: "https://spreadsheets.google.com",
        //
        url: function (urlparams) {
            // when given the url is of the form key/worksheet where
            // key is the key of the spreadsheet you want to retrieve,
            // worksheet is the positional or unique identifier of the worksheet
            if (this._url) {
                if (urlparams) {
                    return this.endpoint + '/feeds/list/' + this._url + '/' + urlparams.id + '/public/values?alt=json';
                } else {
                    return null;
                }
            }
        },
        //
        getList: function (options) {
            var Model = this.Model,
                opts = this.options,
                $lux = this.$lux;
            return this.request('GET', null, options).then(function (response) {
                return response;
            });
        },
        //
        get: function (urlparams, options) {
            var Model = this.Model,
                opts = this.options,
                $lux = this.$lux;
            return this.request('GET', urlparams, options).then(function (response) {
                response.data = opts.orientation === 'columns' ? new GoogleSeries(
                    $lux, response.data) : new GoogleModel($lux, response.data);
                return response;
            });
        }
    });
    //
    //
    var GoogleModel = Class.extend({
        //
        init: function ($lux, data, opts) {
            var i, j, ilen, jlen;
            this.column_names = [];
            this.name = data.feed.title.$t;
            this.elements = [];
            this.raw = data; // A copy of the sheet's raw data, for accessing minutiae

            if (typeof(data.feed.entry) === 'undefined') {
                $lux.log.warn("Missing data for " + this.name + ", make sure you didn't forget column headers");
                return;
            }

            $lux.log.info('Building models from google sheet');

            for (var key in data.feed.entry[0]) {
                if (/^gsx/.test(key)) this.column_names.push(key.replace("gsx$", ""));
            }

            for (i = 0, ilen = data.feed.entry.length; i < ilen; i++) {
                var source = data.feed.entry[i];
                var element = {};
                for (j = 0, jlen = this.column_names.length; j < jlen; j++) {
                    var cell = source["gsx$" + this.column_names[j]];
                    if (typeof(cell) !== 'undefined') {
                        if (cell.$t !== '' && !isNaN(cell.$t))
                            element[this.column_names[j]] = +cell.$t;
                        else
                            element[this.column_names[j]] = cell.$t;
                    } else {
                        element[this.column_names[j]] = '';
                    }
                }
                if (element.rowNumber === undefined)
                    element.rowNumber = i + 1;
                this.elements.push(element);
            }
        }
    });

    var GoogleSeries = Class.extend({
        //
        init: function ($lux, data, opts) {
            var i, j, ilen, jlen;
            this.column_names = [];
            this.name = data.feed.title.$t;
            this.series = [];
            this.raw = data; // A copy of the sheet's raw data, for accessing minutiae

            if (typeof(data.feed.entry) === 'undefined') {
                $lux.log.warn("Missing data for " + this.name + ", make sure you didn't forget column headers");
                return;
            }
            $lux.log.info('Building series from google sheet');

            for (var key in data.feed.entry[0]) {
                if (/^gsx/.test(key)) {
                    var name = key.replace("gsx$", "");
                    this.column_names.push(name);
                    this.series.push([name]);
                }
            }

            for (i = 0, ilen = data.feed.entry.length; i < ilen; i++) {
                var source = data.feed.entry[i];
                for (j = 0, jlen = this.column_names.length; j < jlen; j++) {
                    var cell = source["gsx$" + this.column_names[j]],
                        serie = this.series[j];
                    if (typeof(cell) !== 'undefined') {
                        if (cell.$t !== '' && !isNaN(cell.$t))
                            serie.push(+cell.$t);
                        else
                            serie.push(cell.$t);
                    } else {
                        serie.push('');
                    }
                }
            }
        }
    });


    lux.app.directive('googleMap', function () {
        return {
            //
            // Create via element tag
            // <d3-force data-width=300 data-height=200></d3-force>
            restrict: 'AE',
            //
            link: function (scope, element, attrs) {
                require(['google-maps'], function () {
                    on_google_map_loaded(function () {
                        var lat = +attrs.lat,
                            lng = +attrs.lng,
                            loc = new google.maps.LatLng(lat, lng),
                            opts = {
                                center: loc,
                                zoom: attrs.zoom ? +attrs.zoom : 8
                            },
                            map = new google.maps.Map(element[0], opts);
                        var marker = new google.maps.Marker({
                            position: loc,
                            map: map,
                            title: attrs.marker
                        });
                        //
                        windowResize(function () {
                            google.maps.event.trigger(map, 'resize');
                            map.setCenter(loc);
                            map.setZoom(map.getZoom());
                        }, 500);
                    });
                });
            }
        };
    });

    lux.app.directive('luxGrid', function () {
        return {
            //
            // Create via element tag
            // <d3-force data-width=300 data-height=200></d3-force>
            restrict: 'AE',
            //
            link: function (scope, element, attrs) {
                require(['google-maps'], function () {
                    on_google_map_loaded(function () {
                        var lat = +attrs.lat,
                            lng = +attrs.lng,
                            loc = new google.maps.LatLng(lat, lng),
                            opts = {
                                center: loc,
                                zoom: attrs.zoom ? +attrs.zoom : 8
                            },
                            map = new google.maps.Map(element[0], opts);
                        var marker = new google.maps.Marker({
                            position: loc,
                            map: map,
                            title: attrs.marker
                        });
                        //
                        windowResize(function () {
                            google.maps.event.trigger(map, 'resize');
                            map.setCenter(loc);
                            map.setZoom(map.getZoom());
                        }, 500);
                    });
                });
            }
        };
    });