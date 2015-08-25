    //
    // Grid module for lux
    //
    //  Dependencies:
    //
    //      - use $modal service from angular-strap library
    //
    //
require(['lodash'], function(_) {

    function dateSorting(column) {

        column.sortingAlgorithm = function(a, b) {
            var dt1 = new Date(a).getTime(),
                dt2 = new Date(b).getTime();
            return dt1 === dt2 ? 0 : (dt1 < dt2 ? -1 : 1);
        };
    }

    angular.module('lux.grid', ['lux.services', 'lux.grid.dataProviderFactory', 'templates-grid', 'ngTouch', 'ui.grid',
                                'ui.grid.pagination', 'ui.grid.selection', 'ui.grid.autoResize'])
        //
        .constant('gridDefaults', {
            //
            enableFiltering: true,
            enableRowHeaderSelection: false,
            useExternalPagination: true,
            useExternalSorting: true,
            useExternalFiltering: true,
            // Scrollbar display: 0 - never, 1 - always, 2 - when needed
            enableHorizontalScrollbar: 0,
            enableVerticalScrollbar: 0,
            //
            rowHeight: 30,
            minGridHeight: 250,
            offsetGridHeight: 102,
            //
            // request delay in ms
            requestDelay: 100,
            //
            paginationOptions: {
                sizes: [25, 50, 100]
            },
            //
            gridState: {
                page: 1,
                limit: 25,
                offset: 0
            },
            gridFilters: {},
            //
            showMenu: true,
            gridMenu: {
                'create': {
                    title: 'Add',
                    icon: 'fa fa-plus'
                },
                'delete': {
                    title: 'Delete',
                    icon: 'fa fa-trash'
                },
                'columnsVisibility': {
                    title: 'Columns visibility',
                    icon: 'fa fa-eye'
                }
            },
            modal: {
                delete: {
                    templates: {
                        'empty': 'grid/templates/modal.empty.tpl.html',
                        'delete': 'grid/templates/modal.delete.tpl.html',
                    },
                    messages: {
                        'info': 'Are you sure you want to delete',
                        'danger': 'DANGER - THIS CANNOT BE UNDONE',
                        'success': 'Successfully deleted',
                        'error': 'Error while deleting ',
                        'empty': 'Please, select some',
                    }
                },
                columnsVisibility: {
                    templates: {
                        'default': 'grid/templates/modal.columns.tpl.html',
                    },
                    messages: {
                        'info': 'Click button with column name to toggle visibility'
                    }
                }
            },
            // dictionary of call-backs for columns types
            // The function is called with four parameters
            //	* `column` ui-grid object
            //	* `col` object from metadata
            //	* `uiGridConstants` object
            //	* `gridDefaults` object
            columns: {
                date: dateSorting,

                datetime: dateSorting,

                // Font-awesome icon by default
                boolean: function (column, col, uiGridConstants, gridDefaults) {
                    column.cellTemplate = gridDefaults.wrapCell('<i ng-class="{{COL_FIELD === true}} ? \'fa fa-check-circle text-success\' : \'fa fa-times-circle text-danger\'"></i>');

                    if (col.hasOwnProperty('filter')) {
                        column.filter = {
                            type: uiGridConstants.filter.SELECT,
                            selectOptions: [{ value: 'true', label: 'True' }, { value: 'false', label: 'False'}]
                        };
                    }
                }
            },
            //
            // default wrapper for grid cells
            wrapCell: function (template) {
                return '<div class="ui-grid-cell-contents">' + template + '</div>';
            }
        })
        //
        .service('GridService', ['$lux', '$q', '$location', '$compile', '$modal', 'uiGridConstants', 'gridDefaults', 'GridDataProviderFactory', '$timeout',
            function($lux, $q, $location, $compile, $modal, uiGridConstants, gridDefaults, GridDataProviderFactory, $timeout) {

            var gridDataProvider;

            function parseColumns(columns, metaFields) {
                var columnDefs = [],
                    column;

                angular.forEach(columns, function(col) {
                    column = {
                        field: col.name,
                        displayName: col.displayName,
                        type: getColumnType(col.type),
                        name: col.name
                    };

                    if (col.hasOwnProperty('hidden') && col.hidden)
                        column.visible = false;

                    if (!col.hasOwnProperty('sortable'))
                        column.enableSorting = false;

                    if (!col.hasOwnProperty('filter'))
                        column.enableFiltering = false;

                    var callback = gridDefaults.columns[col.type];
                    if (callback) callback(column, col, uiGridConstants, gridDefaults);

                    if (typeof column.field !== 'undefined' && column.field === metaFields.repr) {
                        column.cellTemplate = gridDefaults.wrapCell('<a ng-href="{{grid.appScope.objectUrl(row.entity)}}">{{COL_FIELD}}</a>');
                        // Set repr column as the first column
                        columnDefs.splice(0, 0, column);
                    }
                    else
                        columnDefs.push(column);
                });

                return columnDefs;
            }

            // Get specified page using params
            function getPage(scope) {
                var query = angular.extend({}, scope.gridState);

                // Add filter if available
                if (scope.gridFilters)
                    query = angular.extend(query, scope.gridFilters);

                gridDataProvider.getPage(query);
            }

            // Return column type according to type
            function getColumnType(type) {
                switch (type) {
                    case 'integer':     return 'number';
                    case 'datetime':    return 'date';
                    default:            return type;
                }
            }

            // Add menu actions to grid
            function addGridMenu(scope, gridOptions) {
                var menu = [],
                    stateName = window.location.href.split('/').pop(-1),
                    model = stateName.slice(0, -1),
                    modalScope = scope.$new(true),
                    modal, title, template;

                scope.create = function($event) {
                    // if location path is available then we use ui-router
                    if (lux.context.uiRouterEnabled)
                        $location.path($location.path() + '/add');
                    else
                        $lux.window.location.href += '/add';
                };

                scope.delete = function($event) {
                    modalScope.selected = scope.gridApi.selection.getSelectedRows();

                    var firstField = gridOptions.columnDefs[0].field,
                        subPath = scope.options.target.path || '';

                    // Modal settings
                    angular.extend(modalScope, {
                        'stateName': stateName,
                        'repr_field': scope.gridOptions.metaFields.repr || firstField,
                        'infoMessage': gridDefaults.modal.delete.messages.info + ' ' + stateName + ':',
                        'dangerMessage': gridDefaults.modal.delete.messages.danger,
                        'emptyMessage': gridDefaults.modal.delete.messages.empty + ' ' + stateName + '.',
                    });

                    if (modalScope.selected.length > 0)
                        template = gridDefaults.modal.delete.templates.delete;
                    else
                        template = gridDefaults.modal.delete.templates.empty;

                    modal = $modal({scope: modalScope, template: template, show: true});

                    modalScope.ok = function() {

                        function deleteItem(item) {
                            var defer = $lux.q.defer(),
                                pk = item[scope.gridOptions.metaFields.id];

                            function onSuccess(resp) {
                                defer.resolve(gridDefaults.modal.delete.messages.success);
                            }

                            function onFailure(error) {
                                defer.reject(gridDefaults.modal.delete.messages.error);
                            }

                            gridDataProvider.deleteItem(pk, onSuccess, onFailure);

                            return defer.promise;
                        }

                        var promises = [];

                        forEach(modalScope.selected, function(item, _) {
                            promises.push(deleteItem(item));
                        });

                        $q.all(promises).then(function(results) {
                            getPage(scope);
                            modal.hide();
                            $lux.messages.success(results[0] + ' ' + results.length + ' ' + stateName);
                        }, function(results) {
                            modal.hide();
                            $lux.messages.error(results + ' ' + stateName);
                        });
                    };
                };

                scope.columnsVisibility = function() {
                    modalScope.columns = scope.gridOptions.columnDefs;
                    modalScope.infoMessage = gridDefaults.modal.columnsVisibility.messages.info;

                    modalScope.toggleVisible = function(column) {
                        if (column.hasOwnProperty('visible'))
                            column.visible = !column.visible;
                        else
                            column.visible = false;

                        scope.gridApi.core.refresh();
                    };

                    modalScope.activeClass = function(column) {
                        if (column.hasOwnProperty('visible')) {
                            if (column.visible) return 'btn-success';
                            return 'btn-danger';
                        } else
                            return 'btn-success';
                    };
                    //
                    template = gridDefaults.modal.columnsVisibility.templates.default;
                    modal = $modal({scope: modalScope, template: template, show: true});
                };

                forEach(gridDefaults.gridMenu, function(item, key) {
                    title = item.title;

                    if (key === 'create')
                        title += ' ' + model;

                    menu.push({
                        title: title,
                        icon: item.icon,
                        action: scope[key]
                    });
                });

                extend(gridOptions, {
                    enableGridMenu: true,
                    gridMenuShowHideColumns: false,
                    gridMenuCustomItems: menu
                });
            }

            // Get initial data
            this.getInitialData = function(scope, connectionType) {
                function onMetadataReceived(metadata) {
                    scope.gridState.limit = metadata['default-limit'];
                    scope.gridOptions.metaFields = {
                        id: metadata.id,
                        repr: metadata.repr
                    };

                    scope.gridOptions.columnDefs = parseColumns(metadata.columns, scope.gridOptions.metaFields);
                }

                function onDataReceived(data) {
                    scope.gridOptions.totalItems = data.total;

                    if (data.type !== 'update') {
                        scope.gridOptions.data = [];
                    }

                    angular.forEach(data.result, function(row) {
                        var id = scope.gridOptions.metaFields.id;
                        var lookup = {};
                        lookup[id] = row[id];

                        var index = _.findIndex(scope.gridOptions.data, lookup);
                        if (index === -1) {
                            scope.gridOptions.data.push(row);
                        } else {
                            scope.gridOptions.data[index] = _.merge(scope.gridOptions.data[index], row);
                        }

                    });

                    // Update grid height
                    scope.updateGridHeight();

                    // This only needs to be done when onDataReceived is called from an event outside the current execution block,
                    // e.g. when using websockets.
                    $timeout(function() {
                        scope.$apply();
                    }, 0);
                }

                var listener = {
                    onMetadataReceived: onMetadataReceived,
                    onDataReceived: onDataReceived
                };

                gridDataProvider = GridDataProviderFactory.create(
                    connectionType,
                    scope.options.target,
                    scope.options.target.path || '',
                    scope.gridState,
                    listener
                );

                gridDataProvider.connect();

            };

            // Builds grid options
            this.buildOptions = function(scope, options) {
                scope.options = options;
                scope.paginationOptions = gridDefaults.paginationOptions;
                scope.gridState = gridDefaults.gridState;
                scope.gridFilters = gridDefaults.gridFilters;

                scope.objectUrl = function(entity) {
                    return $lux.window.location + '/' + entity[scope.gridOptions.metaFields.id];
                };

                scope.clearData = function() {
                    scope.gridOptions.data = [];
                };

                scope.updateGridHeight = function () {
                    var length = scope.gridOptions.totalItems,
                        element = angular.element(document.getElementsByClassName('grid')[0]),
                        totalPages = scope.gridApi.pagination.getTotalPages(),
                        currentPage = scope.gridState.page,
                        lastPage = scope.gridOptions.totalItems % scope.gridState.limit,
                        gridHeight = 0;

                    // Calculate grid height
                    if (length > 0) {
                        if (currentPage < totalPages || lastPage === 0)
                            gridHeight = scope.gridState.limit * gridDefaults.rowHeight + gridDefaults.offsetGridHeight;
                        else
                            gridHeight = lastPage * gridDefaults.rowHeight + gridDefaults.offsetGridHeight;
                    }

                    if (gridHeight < gridDefaults.minGridHeight)
                        gridHeight = gridDefaults.minGridHeight;

                    element.css('height', gridHeight + 'px');
                };

                var gridOptions = {
                        paginationPageSizes: scope.paginationOptions.sizes,
                        paginationPageSize: scope.gridState.limit,
                        enableFiltering: gridDefaults.enableFiltering,
                        enableRowHeaderSelection: gridDefaults.enableRowHeaderSelection,
                        useExternalPagination: gridDefaults.useExternalPagination,
                        useExternalSorting: gridDefaults.useExternalSorting,
                        useExternalFiltering: gridDefaults.useExternalFiltering,
                        enableHorizontalScrollbar: gridDefaults.enableHorizontalScrollbar,
                        enableVerticalScrollbar: gridDefaults.enableVerticalScrollbar,
                        rowHeight: gridDefaults.rowHeight,
                        onRegisterApi: function(gridApi) {
                            scope.gridApi = gridApi;

                            //
                            // Pagination
                            scope.gridApi.pagination.on.paginationChanged(scope, _.debounce(function(pageNumber, pageSize) {
                                scope.gridState.page = pageNumber;
                                scope.gridState.limit = pageSize;
                                scope.gridState.offset = pageSize*(pageNumber - 1);

                                getPage(scope);
                            }, gridDefaults.requestDelay));
                            //
                            // Sorting
                            scope.gridApi.core.on.sortChanged(scope, _.debounce(function(grid, sortColumns) {
                                if( sortColumns.length === 0) {
                                    delete scope.gridState.sortby;
                                    getPage(scope);
                                } else {
                                    // Build query string for sorting
                                    angular.forEach(sortColumns, function(column) {
                                        scope.gridState.sortby = column.name + ':' + column.sort.direction;
                                    });

                                    switch( sortColumns[0].sort.direction ) {
                                        case uiGridConstants.ASC:
                                            getPage(scope);
                                            break;
                                        case uiGridConstants.DESC:
                                            getPage(scope);
                                            break;
                                        case undefined:
                                            getPage(scope);
                                            break;
                                    }
                                }
                            }, gridDefaults.requestDelay));
                            //
                            // Filtering
                            scope.gridApi.core.on.filterChanged(scope, _.debounce(function() {
                                var grid = this.grid;
                                scope.gridFilters = {};

                                // Add filters
                                angular.forEach(grid.columns, function(value, _) {
                                    // Clear data in order to refresh icons
                                    if (value.filter.type === 'select')
                                        scope.clearData();

                                    if (value.filters[0].term)
                                        scope.gridFilters[value.colDef.name] = value.filters[0].term;
                                });

                                // Get results
                                getPage(scope);

                            }, gridDefaults.requestDelay));
                        }
                    };

                if (gridDefaults.showMenu)
                    addGridMenu(scope, gridOptions);

                return gridOptions;
            };
        }])
        //
        // Directive to build Angular-UI grid options using Lux REST API
        .directive('restGrid', ['$compile', 'GridService', function ($compile, GridService) {

            return {
                restrict: 'A',
                link: {
                    pre: function (scope, element, attrs) {
                        var scripts= element[0].getElementsByTagName('script');

                        forEach(scripts, function (js) {
                            globalEval(js.innerHTML);
                        });

                        var opts = attrs;
                        if (attrs.restGrid) opts = {options: attrs.restGrid};

                        if (typeof attrs.gridDataProvider === 'string') {
                            opts.gridDataProvider = attrs.gridDataProvider;
                        }

                        opts = getOptions(opts);

                        if (opts) {
                            scope.gridOptions = GridService.buildOptions(scope, opts);
                            GridService.getInitialData(scope, opts.gridDataProvider);
                        }

                        var grid = '<div ui-if="gridOptions.data.length>0" class="grid" ui-grid="gridOptions" ui-grid-pagination ui-grid-selection ui-grid-auto-resize></div>';
                        element.append($compile(grid)(scope));
                    },
                },
            };

        }]);
});