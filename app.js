(function () {
    "use strict"

    // Environmental Variables
    require('dotenv').config();

    // File System
    const path = require('path');
    const fs = require('fs')

    // Database System
    const mysql = require('mysql');
    const conn = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS
    });

    // Heartbeat the SQL Server to maintain connection.
    setInterval(function () {
        let query = 'SELECT * FROM karaoke.songs LIMIT 1';
        conn.query(query, function (err, result) {
            if (err) {
                console.log('Unable to pulse to SQL: ' + err.code + ' -> ' + err.sqlMessage);
                process.exit(1);
            } else {
                console.log('Successfully maintained pulse to SQL.');
            }
        });
    }, 60 * 1000);

    // Express
    const express = require('express')
    const app = express();

    // Body Parser
    const bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json());

    // Express Sessions
    const expressSession = require('express-session');
    const sessionSecret = process.env.EXPRESS_SESSION_SECRET;

    const expressSesssionInstance = expressSession({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
    });

    app.use(expressSesssionInstance);

    // HTTP Protocol Server
    const http = require('http');
    const https = require('https');

    const httpsServer = https.createServer({
        key: fs.readFileSync('letsencrypt/privkey.pem', 'utf8'),
        cert: fs.readFileSync('letsencrypt/cert.pem', 'utf8'),
        ca: fs.readFileSync('letsencrypt/fullchain.perm', 'utf8')
    }, app);

    const httpServer = http.createServer(app);

    // Socket IO
    const socketio = require('socket.io')(httpsServer);
    const socketSessions = require("express-socket.io-session");
    socketio.use(socketSessions(expressSesssionInstance));

    // Password Hashing
    const bcrypt = require('bcrypt');

    // Force HTTPS / Redirect HTTP to HTTPS
    app.use(function (req, res, next) {
        if (req.secure) {
            console.log(req.method, 'https://' + req.headers.host + req.url);
            next();
        } else {
            console.log(req.method, 'http://' + req.headers.host + req.url);
            res.redirect('https://' + req.headers.host + req.url);
        }
    });

    // Module Imports.
    require('./song-publisher') (app, mysql, conn);
    require('./solo-mode')(app, mysql, conn, socketio);
    require('./users/users')(app);

    // Uses all the folders in /static/
    app.use(express.static('static'));

    // Creates all the servers on port 443 (HTTPS) and 80 (HTTP).
    httpsServer.listen(443, function (err) {
        if (err)
            console.log(err);
        else
            console.log("HTTPS server on https://localhost:443");
    });

    httpServer.listen(80, function (err) {
        if (err)
            console.log(err);
        else
            console.log("HTTP server on http://localhost:80");
    });
}());