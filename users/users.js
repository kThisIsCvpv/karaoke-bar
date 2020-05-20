module.exports = function (app) {

    const crypto = require('crypto');
    const fs = require('fs');
    const path = require('path');
    const express = require('express');

    const nodemailer = require('nodemailer');
    const mg = require('nodemailer-mailgun-transport');
    const sgTransport = require('nodemailer-sendgrid-transport');

    const validator = require('validator');

    const bodyParser = require('body-parser');
    app.use(bodyParser.json());

    const Datastore = require('nedb');
    var users = new Datastore({ filename: 'db/users.db', autoload: true });

    // email verification: https://www.youtube.com/watch?v=gzDB0ZGOjA0
    const auth = {
        auth: {
            api_key: 'INSERT_API_KEY',
            domain: 'INSERT_DOMAIN.mailgun.org'
        }
    }

    var options = {
        auth: {
            api_user: 'INSERT_USER',
            api_key: 'INSERT_API_KEY'
        }
    }

    const nodemailerMailgun = nodemailer.createTransport(mg(auth));
    const client = nodemailer.createTransport(sgTransport(options));

    const cookie = require('cookie');

    function generateSalt() {
        return crypto.randomBytes(16).toString('base64');
    }

    function generateHash(password, salt) {
        var hash = crypto.createHmac('sha512', salt);
        hash.update(password);
        return hash.digest('base64');
    }

    app.use(function (req, res, next) {
        var username = (req.session.username) ? req.session.username : '';
        res.setHeader('Set-Cookie', cookie.serialize('username', username, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week in number of seconds
            secure: true,
            sameSite: true
        }));
        next();
    });

    app.use(express.static('static'));

    app.use(function (req, res, next) {
        console.log("HTTP request", req.method, req.url, req.body);
        next();
    });

    var isAuthenticated = function (req, res, next) {
        if (!req.session.username) return res.status(401).end("Access denied. User is not logged in.");
        next();
    };

    var sanitizeContent = function (req, res, next) {
        req.body.content = validator.escape(req.body.content);
        next();
    }

    var checkId = function (req, res, next) {
        if (!validator.isAlphanumeric(req.params.id)) return res.status(400).end("Invalid parameters detected. Please try again.");
        next();
    };

    var checkToken = function (req, res, next) {
        if (!validator.isAlphanumeric(req.params.token)) return res.status(400).end("Invalid parameters detected. Please try again.");
        next();
    };

    var checkUsername = function (req, res, next) {
        if (!validator.isAlphanumeric(req.body.username)) return res.status(400).end("Invalid parameters detected. Please try again.");
        next();
    };

    var checkEmail = function (req, res, next) {
        if (!validator.isEmail(req.body.email)) return res.status(400).end("Invalid parameters detected. Please try again.");
        next();
    };

    app.get('/activate/:token/', checkToken, function (req, res, next) {
        users.findOne({ token: req.params.token }, function (err, user) {
            if (err) return res.status(500).end(err);
            if (!user) return res.status(404).end("Email verification token '" + req.params.token + "' does not exists.");
            // activate the account and clear the token
            users.update({ _id: user._id }, { $set: { token: '', activated: true } }, { multi: false }, function (err, num) {
                res.json("Activated " + user._id + "'s account.");
            });
        });
    });
    //ex: {password:12345}
    app.post('/reset/:token/', checkToken, function (req, res, next) {
        let password = req.body.password;
        users.findOne({ token: req.params.token }, function (err, user) {
            if (err) return res.status(500).end(err);
            if (!user) return res.status(404).end("Password reset token '" + req.params.token + "' does not exists.");
            // hash password
            let salt = generateSalt();
            let hash = generateHash(password, salt);

            users.update({ _id: user._id }, { $set: { token: '', salt: salt, hash: hash } }, { multi: false }, function (err, num) {
                res.json(user._id + "'s new password is set.");
            });
        });
    });

    app.post('/forgetpassword/', checkEmail, function (req, res, next) {
        let email = req.body.email;
        users.findOne({ email: email }, function (err, user) {
            if (err) return res.status(500).end(err);
            if (!user) return res.status(404).end("User '" + email + "' does not exists.");
            if (!user.activated) return res.status(401).end("Please verify your email before resetting your password.");
            let token = crypto.randomBytes(16).toString('hex');
            client.sendMail({
                from: 'verify@cscc09project.com',
                to: email, // An array if you have multiple recipients
                subject: 'Karaoke Bar - Password Reset',
                //You can use "html:" to send HTML email content
                html: '<b>Reset password:</b> ' + user._id + ' -> <a href="https://karaokebar.live/reset/?token=' + token + '">https://karaokebar.live/reset/?token=' + token + "</a>",
            }, (err, info) => {
                if (err) {
                    console.log(`Error: ${err}`);
                }
                else {
                    console.log(`Response: ${info}`);
                }
            });

            // token is used for resetting password
            users.update({ email: email }, { $set: { token: token } }, { multi: false }, function (err) {
                if (err) return res.status(500).end(err);
                return res.json("You can reset " + user._id + "'s password. Check your email.");
            });
        });
    });

    // curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
    app.post('/signup/', checkUsername, checkEmail, function (req, res, next) {
        let username = req.body.username;
        let password = req.body.password;
        let email = req.body.email;
        users.findOne({ $or: [{ _id: username }, { email: email }] }, function (err, user) {
            if (err) return res.status(500).end(err);
            if (user && user.activated) return res.status(409).end("Username or email already exists.");
            let salt = generateSalt();
            let hash = generateHash(password, salt);
            let token = crypto.randomBytes(16).toString('hex');
            let activated = false;

            console.log(token);
            client.sendMail({
                from: 'verify@cscc09project.com',
                to: email, // An array if you have multiple recipients
                subject: 'Karaoke Bar - Email Verification',
                //You can use "html:" to send HTML email content
                html: '<b>Activate account</b> ' + username + ' -> <a href="https://karaokebar.live/activate/' + token + '">https://karaokebar.live/activate/' + token + '</a>',
            }, (err, info) => {
                if (err) {
                    console.log(`Error: ${err}`);
                }
                else {
                    console.log(`Response: ${info}`);
                }
            });

            // token is used for resetting password or verifying email
            users.update({ _id: username }, { _id: username, salt, hash, token, activated, email }, { upsert: true }, function (err) {
                if (err) return res.status(500).end(err);
                return res.status(200).json("User " + username + " signed up. Check your email.");
            });
        });
    });

    // curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
    app.post('/signin/', checkUsername, function (req, res, next) {
        var username = req.body.username;
        var password = req.body.password;
        // retrieve user from the database
        users.findOne({ _id: username }, function (err, user) {
            if (err) return res.status(500).end(err);
            if (!user) return res.status(401).end("Access denied. Invalid username or password.");
            if (!user.activated) return res.status(401).end("Access denied. Please verify your email.");
            if (user.hash !== generateHash(password, user.salt)) return res.status(401).end("Access denied. Invalid username or password."); // invalid password
            // start a session
            req.session.username = user._id;
            res.setHeader('Set-Cookie', cookie.serialize('username', user._id, {
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
            }));
            return res.json("User " + username + " signed in.");
        });
    });

    // curl -b cookie.txt -c cookie.txt localhost:3000/signout/
    app.get('/signout/', function (req, res, next) {
        req.session.destroy();
        res.setHeader('Set-Cookie', cookie.serialize('username', '', {
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
        }));
        res.redirect('/');
    });
}