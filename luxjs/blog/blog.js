    //  Blog Module
    //  ===============
    //
    //  Simple blog pagination directives and code highlight with highlight.js
    angular.module('lux.blog', ['templates-blog', 'lux.services', 'highlight', 'lux.scroll'])
        .controller('BlogEntry', ['$scope', 'dateFilter', '$lux', 'scroll', function ($scope, dateFilter, $lux, scroll) {
            var post = $scope.post;
            if (!post) {
                $lux.log.error('post not available in $scope, cannot use pagination controller!');
                return;
            }
            addPageInfo(post, $scope, dateFilter, $lux);
        }])
        .directive('blogPagination', function () {
            return {
                templateUrl: "blog/pagination.tpl.html",
                restrict: 'AE'
            };
        })
        .directive('blogHeader', function () {
            return {
                templateUrl: "blog/header.tpl.html",
                restrict: 'AE'
            };
        });
