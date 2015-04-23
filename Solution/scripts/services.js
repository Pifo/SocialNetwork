'use strict';

var app = app || {};

app.Services = function (baseServiceUrl, parseAppId, parseRestApiKey) {
    var selector = '#wrapper';
    var selectorPost = '#viewPost';

    function getHeaders() {
        var headers = {
            'X-Parse-Application-Id': parseAppId,
            'X-Parse-REST-API-Key': parseRestApiKey
        };

        var currentUser = app.userSession.getCurrentUser();
        if (currentUser) {
            headers['X-Parse-Session-Token'] = currentUser.sessionToken;
        }

        return headers;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////
    function listMyPosts() {

        users.listPosts(function (data) {
                $.each(data, function () {

                    $.each(this, function (k, v) {
                        users.getById(data.results[k].createdBy.objectId, function (userRow) {

                            data.results[k]["myPicture"] = userRow.picture;
                            data.results[k]["myUsername"] = userRow.username;
                            data.results[k]["myDate"] = new Date(data.results[k].createdAt).toString('d-MMM-yyyy HH:mm');

                            $.get('templates/all_posts.html', function (template) {
                                var output = Mustache.render(template, data);
                                $(selectorPost).html(output);
                            });

                        }, function (error) {
                            showAjaxError("Cannot load user by id", error)
                        });//end get by id

                    });//end inner loop
                });//end loop

            },
            function (error) {
                showAjaxError("Cannot load home page ", error)
            }
        )
    }

//////////////////////////////////////////////////////////////////////////////////////////////


    var users = {

        //Login
        login: function (username, password, success, error) {
            var url = baseServiceUrl + 'login';
            var userData = {
                username: username,
                password: password
            };

            return app.ajaxRequester.get(url, userData, getHeaders(), function (data) {
                app.userSession.login(data);
                success(data);

            }, error);
        },


        //Logout
        logout: function () {
            app.userSession.logout();
        },


        //Register
        register: function (username, password, fullName, about, gender, picture, success, error) {
            var url = baseServiceUrl + 'users';
            var userData = {
                username: username,
                password: password,
                name: fullName,
                about: about,
                gender: gender,
                picture: picture

            };

            return app.ajaxRequester.post(url, userData, getHeaders(), function (data) {
                data.picture = picture;
                data.name = fullName;
                data.username = username;

                app.userSession.login(data);
                success(data);

            }, error);
        },

        //Do Post
        doPost: function (content, success, error) {
            var url = baseServiceUrl + "classes/Post";

            var currentUser = app.userSession.getCurrentUser();
            var userData = {
                content: content,
                createdBy: {
                    "__type": "Pointer",
                    "className": "_User",
                    "objectId": currentUser.objectId
                }
            };

            return app.ajaxRequester.post(url, userData, getHeaders(), success, error);
        },
        ////////////////////////////////////////////
        getAllPosts: function (success, error) {
            var url = baseServiceUrl + "classes/Post";

            return app.ajaxRequester.get(url, undefined, getHeaders(), success, error);
        },
        ///////////////////////////////////////////

        //List Posts
        listPosts: function (success, error) {
            var url = baseServiceUrl + "classes/Post";

            var userData = {
                includeParam: {
                    "order": "createdAt",
                    "limit": 50,
                    "include": "createdBy"
                }
            }

            return app.ajaxRequester.get(url, userData, getHeaders(), success, error);

        },


        //Get By Id
        getById: function (objectId, success, error) {
            var url = baseServiceUrl + 'users/' + objectId;
            return app.ajaxRequester.get(url, undefined, getHeaders(), success, error);
        },


        //Get Post By Id
        getPostsById: function (objectId, success, error) {
            var url = baseServiceUrl + "classes/Post/" + objectId;
            return app.ajaxRequester.get(url, undefined, getHeaders(), success, error);
        },


        //Get All Users
        getAllUsers: function (success, error) {
            var url = baseServiceUrl + 'users';
            return app.ajaxRequester.get(url, undefined, getHeaders(), success, error);
        },


        //Edit Profile
        editProfile: function (user, success, error) {
            var url = baseServiceUrl + 'users/' + user.objectId;
            return app.ajaxRequester.put(url, user, getHeaders(), success, error);
        }

    };//end users


    return {
        users: users,
        listMyPosts: listMyPosts
    }

};
