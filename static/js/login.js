(function () {
    "use strict";

    window.addEventListener('load', function () {

        // Request focus on the form when the page loads.
        let userBox = document.querySelector('input[name="username"]');
        let emailBox = document.querySelector('input[name="email"]');

        if (userBox)
            userBox.focus();
        else if (emailBox)
            emailBox.focus();

        function send(method, url, data, callback) {
            let xhr = new XMLHttpRequest();
            xhr.onload = function () {
                // if (xhr.status !== 200) callback("[" + xhr.status + "]" + xhr.responseText, null);
                if (xhr.status !== 200) callback(xhr.responseText, null);
                else callback(null, JSON.parse(xhr.responseText));
            };
            xhr.open(method, url, true);
            if (!data) xhr.send();
            else {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(data));
            }
        }

        let getUsername = function () {
            return document.cookie.replace(/(?:(?:^|.*;\s*)username\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        }

        function onError(err) {
            console.error("[Error]", err);
            // let error_box = document.querySelector('#error_box');
            // error_box.innerHTML = err;
            // error_box.style.visibility = "visible";
            swal('Error', err, 'error');
        }

        function submit() {
            console.log(document.querySelector("form").checkValidity());

            if (document.querySelector("form").checkValidity()) {
                let el = null;
                let password = '';
                let username = '';
                let email = '';
                let action = document.querySelector("form [name=action]").value;
                el = document.querySelector("form [name=username]");
                if (el) username = el.value;
                el = document.querySelector("form [name=password]");
                if (el) password = el.value;
                el = document.querySelector("form [name=email]");
                if (el) email = el.value;
                let body = {};
                let apiurl = '';
                let onUserUpdate = function (res) { };

                switch (action) {
                    case 'reset':
                        body = { password };
                        const params = new URLSearchParams(document.location.search);
                        let token = params.get("token");

                        apiurl = '/reset/' + token + '/';
                        onUserUpdate = function (res) {
                            // go back to login page to let user login with their new password
                            window.location.href = '/login/';
                        };
                        break;
                    case 'signin':
                        body = { username, password };
                        apiurl = '/signin/';
                        onUserUpdate = function (res) {
                            // go back to home page if login is successful
                            if (getUsername()) window.location.href = '/';
                        };
                        break;
                    case 'signup':
                        body = { username, email, password };
                        apiurl = '/signup/'
                        onUserUpdate = function (res) {
                            // stay in this page and tell user to check email

                            // let error_box = document.querySelector('#error_box');
                            // error_box.innerHTML = 'check your email to activate your account';
                            // error_box.style.visibility = "visible";

                            console.log(res);

                            // swal({
                            //     title: 'Welcome',
                            //     text: 'Please check your email to activate your account!',
                            //     type: 'success'
                            // }).then(function () {
                            //     window.location.replace('/login/');
                            // });

                            swal('Welcome', 'Please check your email to activate your account!', 'success').then(function () {
                                window.location.replace('/login/');
                            });
                        };
                        break;
                    case 'forgetpassword':
                        body = { email };
                        apiurl = '/forgetpassword/';
                        onUserUpdate = function (res) {
                            // stay in this page and tell user to check email

                            // let error_box = document.querySelector('#error_box');
                            // error_box.innerHTML = 'check your email to reset your password';
                            // error_box.style.visibility = "visible";

                            console.log(res);

                            // swal({
                            //     title: 'Verification',
                            //     text: 'Please check your email to reset your password!',
                            //     type: 'success'
                            // }).then(function () {
                            //     window.location.replace('/login/');
                            // });

                            swal('Verification', 'Please check your email to reset your password!', 'success').then(function () {
                                window.location.replace('/login/');
                            });
                        };
                        break;
                }

                send("POST", apiurl, body, function (err, res) {
                    if (err) return onError(err);
                    onUserUpdate(res);
                });

            }
        }

        let resetbtn = document.querySelector('#reset');
        let signupbtn = document.querySelector('#signup');
        let forgetbtn = document.querySelector('#forget');
        let signinbtn = document.querySelector('#signin');

        if (resetbtn) {
            document.querySelector('#reset').addEventListener('click', function (e) {
                document.querySelector("form [name=action]").value = 'reset';
                submit();
            });
        }
        if (signupbtn) {
            document.querySelector('#signup').addEventListener('click', function (e) {
                document.querySelector("form [name=action]").value = 'signup';
                submit();
            });
        }
        if (forgetbtn) {
            document.querySelector('#forget').addEventListener('click', function (e) {
                document.querySelector("form [name=action]").value = 'forgetpassword';
                submit();
            });
        }
        if (signinbtn) {
            document.querySelector('#signin').addEventListener('click', function (e) {
                document.querySelector("form [name=action]").value = 'signin';
                submit();
            });
        }

        document.querySelector('form').addEventListener('submit', function (e) {
            e.preventDefault();
        });
    });
}())


