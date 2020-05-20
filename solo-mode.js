module.exports = function (app, mysql, mysql_conn, socketio) {

    let rooms = {};

    let isAuthenticated = function (req, res, next) {
        if (!req.session || !req.session.username) {
            return res.redirect(302, '/login');
        } else {
            return next();
        }
    }

    let isRoomCode = function (code) {
        if (!code)
            return false;

        let santize = code.replace(/[^a-z0-9]/gi, '');
        return santize.length > 16 && santize.length < 40;
    }

    let generateUUID = function () {
        // https://gist.github.com/6174/6062387
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    app.get('/solo/:code', function (req, res) {
        res.sendFile('/static/solo/template.html', { root: __dirname });
    });

    // Checks whether or not a given room code has valid syntax.
    app.get('/api/solo/validate/:code', function (req, res) {
        if (!req.params.code)
            res.status(400).json({ error: 'Missing parameters.' });
        else if (isRoomCode(req.params.code))
            res.status(400).json({ error: 'Invalid room code format.' });
        else
            res.status(200).json({ success: 'Valid room code format.' });
    });

    // Retrieves the leader (host) of a given room. 
    app.get('/api/solo/leader/:code', function (req, res) {
        if (!req.params.code)
            res.status(400).json({ error: 'Missing parameters.' });
        else if (!isRoomCode(req.params.code))
            res.status(400).json({ error: 'Invalid room code format.' });
        else {
            let roomDetails = rooms[req.params.code];
            if (!roomDetails)
                res.status(404).json({ error: 'Room does not exist.' });
            else if (!req.session || !req.session.username)
                res.status(403).json({ error: 'User not signed in.', name: roomDetails['leader'], leader: false });
            else if (roomDetails.leader.localeCompare(req.session.username) != 0)
                res.status(403).json({ error: 'You are not the leader.', name: roomDetails['leader'], leader: false });
            else
                res.status(200).json({ success: 'You are the leader.', name: roomDetails['leader'], leader: true });
        }
    });

    // Create a new private room.
    app.get('/api/solo/createroom', function (req, res) {
        if (!req.session || !req.session.username)
            res.status(403).json({ error: 'User not signed in.' });
        else {
            let keys = Object.keys(rooms);

            for (let key of keys) {
                let value = rooms[key];
                if (value.leader.localeCompare(req.session.username) == 0)
                    return res.status(409).json({ error: 'Room already exists.', room: key });
            }

            let newCode = generateUUID();
            while (!isRoomCode(newCode) || rooms[newCode])
                newCode = generateUUID();

            let newRoom = {}
            newRoom['code'] = newCode;
            newRoom['leader'] = req.session.username;
            /**
             * 0 = Lobby
             * 1 = Broadcasting
             * 2 = Post Match
             */
            newRoom['status'] = 0;
            newRoom['sockets'] = [];
            newRoom['header'] = null;
            newRoom['state'] = null;
            newRoom['song'] = null;

            rooms[newCode] = newRoom;

            res.status(200).json({ success: 'New room created.', room: newCode });
        }
    });

    // Deletes an existing room.
    app.delete('/api/solo/deleteroom', function (req, res) {
        if (!req.session || !req.session.username)
            res.status(403).json({ error: 'User not signed in.' });
        else if (!req.body.id)
            res.status(400).json({ error: 'Missing room identifier.' });
        else if (!isRoomCode(req.body.id))
            res.status(400).json({ error: 'Invalid room identifier.' });
        else {
            if (!rooms[req.body.id])
                res.status(404).json({ error: 'Room not found.' });
            else if (rooms[req.body.id]['leader'] && rooms[req.body.id]['leader'].localeCompare(req.session.username) == 0) {
                delete rooms[req.body.id];
                res.status(200).json({ success: 'Room removed.' });
            } else
                res.status(409).json({ error: 'No permissions.' });
        }
    });

    let findRoom = function (socket) {
        let keys = Object.keys(rooms);

        for (let key of keys) {
            let value = rooms[key];

            for (let i = 0; i < value['sockets'].length; i++)
                if (value['sockets'][i] == socket)
                    return rooms[key];
        }

        return null;
    }

    socketio.on('connection', function (socket) {
        console.log('connection found');

        // The socket is attempting to join a given room code.
        socket.on('solo-join-room', function (id) {
            if (isRoomCode(id)) {
                let currentRoom = findRoom(socket);
                if (!currentRoom) {
                    let room = rooms[id];
                    if (room)
                        room['sockets'].push(socket);
                }
            }
        });

        if (socket.handshake.session && socket.handshake.session.username) {

            // The host is sending the header packet to start the audio stream.
            socket.on('solo-header', function (packet) {
                let currentRoom = findRoom(socket);
                console.log('solo-header');
                if (currentRoom && currentRoom['leader'].localeCompare(socket.handshake.session.username) == 0) {
                    currentRoom['header'] = packet;
                    currentRoom['sockets'].forEach(function (audience, index) {
                        audience.emit('solo-header', packet);
                    });
                }
            });

            // The host is sending a packet to continuously broadcast the audio stream.
            socket.on('solo-stream', function (packet) {
                let currentRoom = findRoom(socket);
                console.log('solo-stream');
                if (currentRoom && currentRoom['leader'].localeCompare(socket.handshake.session.username) == 0) {
                    currentRoom['sockets'].forEach(function (audience, index) {
                        audience.emit('solo-stream', packet);
                        console.log('sending to 1 user');
                    });
                }
            });

            // The host is updating the game state.
            socket.on('solo-state', function (packet) {
                let currentRoom = findRoom(socket);
                if (currentRoom && currentRoom['leader'].localeCompare(socket.handshake.session.username) == 0) {
                    currentRoom['sockets'].forEach(function (audience, index) {
                        audience.emit('solo-state', packet);
                    });
                }
            });

            // The host is playing a new song.
            socket.on('solo-play-song', function (packet) {
                let currentRoom = findRoom(socket);
                if (currentRoom && currentRoom['leader'].localeCompare(socket.handshake.session.username) == 0) {
                    currentRoom['song'] = packet;
                    currentRoom['sockets'].forEach(function (audience, index) {
                        audience.emit('solo-play-song', packet);
                    });
                }
            });

            // The host has stopped playing the current song.
            socket.on('solo-end-song', function () {
                let currentRoom = findRoom(socket);
                if (currentRoom && currentRoom['leader'].localeCompare(socket.handshake.session.username) == 0) {
                    currentRoom['song'] = null;
                    currentRoom['sockets'].forEach(function (audience, index) {
                        audience.emit('solo-end-song');
                    });
                }
            });
        }

        // The spectator is requesting the state of the room.
        socket.on('solo-request-state', function () {
            let currentRoom = findRoom(socket);
            if (currentRoom) {
                if (currentRoom['header'])
                    socket.emit('solo-header', currentRoom['header']);

                if (currentRoom['song'])
                    socket.emit('solo-play-song', currentRoom['song']);
            }
        });

        socket.on('disconnect', function () {
            let keys = Object.keys(rooms);

            for (let key of keys) {
                let value = rooms[key];
                let found = -1;

                for (let i = 0; i < value['sockets'].length; i++)
                    if (value['sockets'][i] == socket) {
                        found = i;
                        break;
                    }

                if (found != -1) {
                    value['sockets'].splice(found, 1);

                    if (value['leader'].localeCompare(socket.handshake.session.username) == 0) {
                        value['song'] = null;
                        value['sockets'].forEach(function (audience, index) {
                            audience.emit('solo-end-song');
                        });
                    }

                    break;
                }
            }
        });
    });
}