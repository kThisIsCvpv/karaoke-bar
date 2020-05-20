module.exports = function (app, mysql, conn) {

    const fs = require('fs');

    let sqlConnected = false;
    let mysqlEsc = require('mysql-escape-array');

    conn.connect(function (err) {
        if (err) {
            console.error('MySQL error connecting: ' + err.stack);
            return;
        }

        console.log('MySQL connected as id: ' + conn.threadId);
        sqlConnected = true;
    });

    app.get('/publisher', function (req, res, next) {
        if (!req.session || !req.session.username) {
            return res.redirect(302, '/login');
        } else {
            return next();
        }
    });

    // Retrieve all the songs requested by a user.
    app.get('/api/publisher', function (req, res, next) {
        if (!req.session || !req.session.username)
            return res.status(403).json({ error: 'User not signed in.' });

        let username = req.session.username;

        if (!sqlConnected)
            return res.status(500).json({ error: 'No database connection.' });

        console.log('MySQL State: ' + conn.state);

        let query = 'SELECT id, title, artists, query_url, state FROM karaoke.songs WHERE publisher=' + mysql.escape(username) + ' ORDER BY date DESC';

        conn.query(query, function (err, result) {
            if (err) {
                console.log('An error occured while selecting: ' + err.code + ' -> ' + err.sqlMessage);
                res.status(500).json({ error: 'Internal server error.' });
            } else {
                res.status(200).json(result);
            }
        });
    });

    // Requests a new song to be added to the site.
    app.post('/api/publisher/queue', function (req, res, next) {
        if (!req.session || !req.session.username)
            return res.status(403).json({ error: 'User not signed in.' });

        let username = req.session.username;

        if (!sqlConnected)
            return res.status(500).json({ error: 'No database connection.' });

        console.log('MySQL State: ' + conn.state);

        let title = req.body.title;
        let author = req.body.author;
        let address = req.body.address;
        let lyrics = req.body.lyrics;

        if (!title || !author || !address || !lyrics)
            return res.status(400).json({ error: 'Missing parameters.' });

        let values = [username, new Date(), title, author, address, lyrics, address, null, 'waiting'];
        let query = 'INSERT INTO karaoke.songs (publisher, date, title, artists, query_url, lyrics, uuid, log, state) VALUES ' + mysqlEsc(values);

        conn.query(query, function (err, result) {
            if (err) {
                if (err.code == 'ER_DUP_ENTRY') {
                    res.status(409).json({ error: 'Duplicate song exists.' });
                } else {
                    console.log('An error occured while inserting: ' + err.code + ' -> ' + err.sqlMessage);
                    res.status(500).json({ error: 'Internal server error.' });
                }
            } else {
                res.status(200).json({ success: 'Successfully queued.' });
            }
        });
    });

    // Views the status log of the song render request. Users can only view their own song requests.
    app.post('/api/publisher/log', function (req, res, next) {
        if (!req.session || !req.session.username)
            return res.status(403).json({ error: 'User not signed in.' });

        let username = req.session.username;

        if (!sqlConnected)
            return res.status(500).json({ error: 'No database connection.' });

        let id = req.body.id;

        if (!id)
            return res.status(400).json({ error: 'Missing parameters.' });

        console.log('MySQL State: ' + conn.state);

        let query = 'SELECT log FROM karaoke.songs WHERE id=' + mysql.escape(id) + ' AND publisher=' + mysql.escape(username);

        conn.query(query, function (err, result) {
            if (err) {
                console.log('An error occured while selecting: ' + err.code + ' -> ' + err.sqlMessage);
                res.status(500).json({ error: 'Internal server error.' });
            } else if (result.length == 0) {
                res.status(404).json({ error: 'No songs found.' });
            } else if (result[0].log) {
                res.status(200).json({ success: result[0].log });
            } else {
                res.status(200).json({ success: '...' });
            }
        });
    });

    // Retrieves the MP3 of a song, given their unique id.
    app.get('/song/uuid/:uuid', function (req, res, next) {
        if (!req.params.uuid)
            res.status(400).json({ error: 'Missing parameters.' });
        else {
            let validator = req.params.uuid;
            validator = validator.replace(/[^a-zA-Z0-9_\-]/gi, '');
            if (validator.length == 0)
                res.status(400).json({ error: 'Invalid unique identifier.' });
            else {
                let path = __dirname + '/music/' + validator + '.mp3';
                if (!fs.existsSync(path))
                    res.status(404).json({ error: 'Music track not found.' });
                else {
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.status(200).sendFile(path);
                }
            }
        }
    });

    // Retrieve all the successfully rendered (and playable) songs in the database.
    app.get('/api/songs', function (req, res, next) {
        if (!sqlConnected)
            return res.status(500).json({ error: 'No database connection.' });

        console.log('MySQL State: ' + conn.state);

        let query = 'SELECT title, artists, uuid, lyrics FROM karaoke.songs WHERE state = \'completed\' ORDER BY id DESC';

        conn.query(query, function (err, result) {
            if (err) {
                console.log('An error occured while selecting: ' + err.code + ' -> ' + err.sqlMessage);
                res.status(500).json({ error: 'Internal server error.' });
            } else {
                res.status(200).json({ success: result });
            }
        });
    });
}