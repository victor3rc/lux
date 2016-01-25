//  Grid Data Provider
//	===================
//
//	provides data to a lux.grid using websockets
define(['angular',
        'lux/grid',
        'lux/services'], function (angular) {
    'use strict';

    angular.module('lux.grid.websocket', ['lux.grid', 'lux.sockjs'])

        .run(['$lux', 'luxGridDataProviders', function ($lux, dataProvider) {

            dataProvider.register('websocket', gridDataProviderWebsocketFactory($lux, dataProvider));
        }]);


    function gridDataProviderWebsocketFactory ($lux, dataProvider) {

        function GridDataProviderWebsocket (grid) {
            this._grid = grid;
        }

        GridDataProviderWebsocket.prototype.destroy = function() {
            this._grid = null;
        };

        GridDataProviderWebsocket.prototype.connect = function() {
            var self = this;

            dataProvider.check(self);

            function onConnect () {
                self.getPage();
            }

            function onMessage (sock, msg) {
                var tasks;

                if (msg.data.event === 'record-update') {
                    tasks = msg.data.data;

                    self._grid.onDataReceived({
                        total: msg.data.total,
                        result: tasks,
                        type: 'update'
                    });

                } else if (msg.data.event === 'records') {
                    tasks = msg.data.data;

                    self._grid.onDataReceived({
                        total: msg.data.total,
                        result: tasks,
                        type: 'update'
                    });

                } else if (msg.data.event === 'columns-metadata') {
                    self._grid.onMetadataReceived(msg.data.data);
                }
            }

            this._sockJs = $lux.sockJs(this._websocketUrl);

            this._sockJs.addListener(this._channel, onMessage.bind(this));

            this._sockJs.connect(onConnect.bind(this));

        };

        GridDataProviderWebsocket.prototype.getPage = function (options) {
            this._sockJs.rpc(this._channel, options);
        };

        GridDataProviderWebsocket.prototype.deleteItem = function(identifier, onSuccess, onFailure) {
            var options = {id: identifier};
            this._sockJs.rpc(this._channel, options).then(onSuccess, onFailure);
        };

        return GridDataProviderWebsocket;
    }

});
