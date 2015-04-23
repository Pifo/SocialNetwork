'use strict';

var app = app || {};


(function () {
    var baseServiceUrl = 'https://api.parse.com/1/';
    var parseAppId = 'TnJpt8rz91nn0vq7RIMDyWYQL11938qv1BQFVRxy';
    var parseRestApiKey = '4sdeluJaJqzvv3Xl5upGWC5CzDMPwelI9SS3nNPU';

    var services = new app.Services(baseServiceUrl, parseAppId, parseRestApiKey);

    var selector = '#wrapper';
    var selectorPost = '#viewPost';


    app.router = Sammy(function () {
        //Main Page
        this.get('#/', function () {
            if (app.userSession.getCurrentUser()) {
                app.router.setLocation("#/user/home");
            } else {
                $(selector).load('../index.html');
            }
        });//end


        //Login
        this.get('#/login', function () {
            $(selector).load('templates/login.html');
        });//end


        //Do Login
        this.get('#/do-login', function () {
            var username = $("#login-username.form-control").val();
            var password = $("#login-password.form-control").val();

            services.users.login(username, password, function (data) {
                    showInfoMessage("Login successful");
                    app.router.setLocation("#/user/home");
                },
                function (error) {
                    showAjaxError("Login failed", error);
                    app.router.setLocation("#/login");
                });
        });//end


        //Logout
        this.get('#/logout', function () {
            services.users.logout();
            showInfoMessage("Successfully logged out");
            app.router.setLocation("#/login");
        });//end


        //Register
        this.get('#/register', function () {
            $(selector).load('templates/register.html');
        });//end


        //Do Register
        this.get('#/do-register', function () {
            var username = $('#reg-username.form-control').val();
            var password = $('#reg-password.form-control').val();
            var fullName = $("#reg-name.form-control").val();
            var about = $("#reg-about.form-control").val();
            var gender = $('input[name="gender-radio"]:checked').val();
            var picture = $('#picture').attr('data-picture-data');

            services.users.register(username, password, fullName, about, gender, picture, function (data) {
                    showInfoMessage("Registration successful");
                    app.router.setLocation("#/user/home");
                },
                function (error) {
                    showAjaxError("Registration failed", error);
                    app.router.setLocation("#/register");
                });
        });//end


        //User Home
        this.get('#/user/home', function () {
            var currentUser = app.userSession.getCurrentUser();
            var user =
            {
                username: currentUser.username,
                name: currentUser.name,
                objectId: currentUser.objectId,
                picture: currentUser.picture
            };


            $.get('templates/header.html', function (template) {
                var output = Mustache.render(template, user);
                $(selector).html(output);
            });


            services.users.getAllPosts(function (data) {

                $.get('templates/all_posts.html', function (template) {

                    var resultsLength = data.results.length;
                    var counter = 0;

                    $.each(data.results, function (k, v) {

                        services.users.getById(data.results[k].createdBy.objectId, function (userRow) {

                            data.results[k]["myPicture"] = userRow.picture;
                            data.results[k]["myUsername"] = userRow.username;
                            data.results[k]["myDate"] = new Date(data.results[k].createdAt).toString('d-MMM-yyyy HH:mm');

                            counter++;

                            if (counter == resultsLength) {
                                var output = Mustache.render(template, data);
                                $(selectorPost).html(output);
                            }
                        });

                    });

                });
            }, function (error) {
                alert("ERROR!");
            });

        });//end user home


        //Post
        this.get('#/user/post', function () {
            $(selectorPost).load('templates/post_box.html');
        });//end


        //Do Post
        this.get('#/user/do-post', function () {
            var currentUser = app.userSession.getCurrentUser();

            var postContent = $('#post-content.form-control').val();
            var user = {
                content: postContent
            }

            services.users.doPost(user.content, function (data) {

                showInfoMessage("Post done!");
                app.router.setLocation("#/user/home");
            }, function (error) {
                showErrorMessage("Post fail!");
            });



        });//end Do Post


        //Edit Profile
        this.get('#/users/edit-profile', function () {

            var currentUser = app.userSession.getCurrentUser();

            $.get('templates/edit_profile.html', function (template) {
                var output = Mustache.render(template, currentUser);
                $(selectorPost).html(output);
            });

        });//end Edit Profile



        //Do Edit Profile
        this.get('#/user/do-edit-profile', function () {

            var userData = {

                objectId: $("#edit-profile-form").data('object-id'),
                password: $("#password.form-control").val(),
                name: $("#name.form-control").val(),
                about: $("#about.form-control").val(),
                gender: $('input[name="gender-radio"]:checked').val(),
                picture: $('#picture').attr('data-picture-data')
            };

            services.users.editProfile(userData,

                function (data) {
                    showInfoMessage("Profile edited");

                    var currentUser = app.userSession.getCurrentUser();

                    currentUser.name = userData.name;
                    currentUser.about = userData.about;
                    currentUser.picture = userData.picture;

                    app.userSession.login(currentUser);

                    app.router.setLocation("#/user/home");
                },
                function (error) {

                    showAjaxError("Profile edit failed", error);
                    app.router.setLocation("#/user/edit-profile");
                });
        });//end Do Edit Profile



        //Get User
        this.get('#/user/get-user/:objectId', function () {
            var objectId = this.params['objectId'];

            services.users.getPostsById(objectId, function (postRow) {
                services.users.getById(postRow.createdBy.objectId, function (data) {

                    $.get('templates/hover_box.html', function (template) {

                        var output = Mustache.render(template, data);
                        $("#tooltip").html(output);
                        $(document).click(function () {
                            $("#tooltip").hide();
                        });

                    });

                }, function (error) {
                    showAjaxError("Cannot load user by id ", error)
                });//end getById


            }, function (error) {
                showAjaxError("Cannot load post class ", error);

            });//end getPostsById

        });//end Get User


    });//end Do Edit Profile


    //RUN///////////////
    app.router.run('#/');
    ////////////////////


    function showAjaxError(msg, error) {

        var errMsg = error.responseJSON;
        if (errMsg && errMsg.error) {

            showErrorMessage(msg + ": " + errMsg.error);
        } else {

            showErrorMessage(msg + ".");
        }
    }

    function showInfoMessage(msg) {
        noty({
                text: msg,
                type: 'info',
                layout: 'topCenter',
                timeout: 1000
            }
        );
    }

    function showErrorMessage(msg) {
        noty({
                text: msg,
                type: 'error',
                layout: 'topCenter',
                timeout: 5000
            }
        );
    }

}());