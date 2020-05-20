let fftRange = 512;

let analyzer = null;
let spectrum = new Uint8Array(fftRange);
let radius = 100;

let voiceMic = null;
let voiceFFT = null;

let player = null;
let isSpectator = false;

window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
let rec = new window.SpeechRecognition();
rec.lang = 'en-US';
rec.interimResults = false;
rec.continuous = true;

function setup() {
    createCanvas(300, 300);

    voiceMic = new p5.AudioIn();
    voiceMic.start();

    voiceFFT = new p5.FFT();
    voiceFFT.bins = fftRange;
    voiceFFT.setInput(voiceMic);
}

function draw() {
    clear();

    if (isSpectator)
        return;

    let centerX = width / 2;
    let centerY = height / 2;

    let voiceSpectrum = null;

    if (voiceFFT) {
        voiceSpectrum = voiceFFT.analyze();

        stroke(color(0, 255, 0));
        noFill();
        beginShape();

        for (let i = 0; i < fftRange; i++) {
            let rad = (Math.PI * i) / fftRange;
            rad -= (Math.PI / 2);
            let dist = map(voiceSpectrum[i], 0, 255, 0, radius);

            let x = dist * Math.cos(rad);
            let y = dist * Math.sin(rad);

            vertex(centerX + x, centerY + y);
        }

        for (let i = (fftRange - 1); i >= 0; i--) {
            let rad = (Math.PI * i) / fftRange;
            rad -= (Math.PI / 2);
            let dist = map(voiceSpectrum[i], 0, 255, 0, radius);

            let x = dist * Math.cos(rad);
            let y = dist * Math.sin(rad);

            vertex(centerX - x, centerY + y);
        }

        endShape();
    }

    if (analyzer) {
        analyzer.getByteFrequencyData(spectrum);

        stroke(color(0, 255, 255));
        noFill();
        beginShape();

        for (let i = 0; i < fftRange; i++) {
            let rad = (Math.PI * i) / fftRange;
            rad -= (Math.PI / 2);
            let dist = map(spectrum[i], 0, 255, 0, radius);

            let x = dist * Math.cos(rad);
            let y = dist * Math.sin(rad);

            vertex(centerX + x, centerY + y);
        }

        for (let i = (fftRange - 1); i >= 0; i--) {
            let rad = (Math.PI * i) / fftRange;
            rad -= (Math.PI / 2);
            let dist = map(spectrum[i], 0, 255, 0, radius);

            let x = dist * Math.cos(rad);
            let y = dist * Math.sin(rad);

            vertex(centerX - x, centerY + y);
        }

        endShape();
    }

    let score = 0;
    let thresh = 20;

    textSize(20);
    noStroke();
    fill('white');

    textAlign(CENTER, CENTER);

    if (voiceFFT && analyzer) {
        for (let i = 0; i < fftRange; i++) {
            if (spectrum[i] >= thresh && voiceSpectrum[i] >= thresh)
                score++;
            else if (spectrum[i] <= thresh && voiceSpectrum[i] <= thresh)
                score++;
        }

        score /= fftRange;
        score = score.toFixed(2) * 100;
        score = parseInt(score, 10);

        text(score + '%', centerX, centerY);
    } else {
        text('Waiting...', centerX, centerY);
    }
}

(function () {
    "use strict"

    /**
     * Edit Distance Algorithm (using Dynamic Programming)
     * https://www.geeksforgeeks.org/edit-distance-dp-5/
     */
    function edit_distance(source, dest) {
        let dp = new Array(source.length + 1);
        for (let i = 0; i < dp.length; i++)
            dp[i] = new Array(dest.length + 1);

        for (let i = 0; i <= source.length; i++) {
            for (let j = 0; j <= dest.length; j++) {
                if (i == 0)
                    dp[i][j] = j;
                else if (j == 0)
                    dp[i][j] = i;
                else if (source[i - 1].localeCompare(dest[j - 1]) == 0)
                    dp[i][j] = dp[i - 1][j - 1];
                else
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
            }
        }

        return dp[source.length][dest.length];
    }

    function removeLoadingLogo() {
        if (document.querySelector('.loading-header'))
            document.querySelector('.loading-header').remove();
    }

    function addDefaultLogo(parent) {
        let element = document.createElement('div');
        element.classList.add('logo-header');

        let image = document.createElement('img');
        image.setAttribute('src', '/assets/logo.png');
        element.appendChild(image);

        parent.appendChild(element);
    }

    function connectAudio(player) {
        if (!analyzer) {
            let defaultOut = player.audioOutput;
            defaultOut.connect(ScarletsMedia.audioContext.destination);

            analyzer = ScarletsMedia.audioContext.createAnalyser();
            defaultOut.connect(analyzer);
        }
    }

    let currentSong = null;
    let highestScore = 0;

    function displaySong(song) {
        document.querySelector('.playlist-divider').remove();

        let entry = document.createElement('div');
        entry.classList.add('spectator-divider');
        entry.innerHTML = '<div class="song-image"> <img src="https://i3.ytimg.com/vi/IGrhyOtikQ0/maxresdefault.jpg"/> </div><div class="song-details"> <h1>Something Comforting</h1> <h2>Porter Robinson</h2> </div><div class="song-lyrics"> <p>If I send this void away...</p></div>';

        entry.querySelector('h1').innerText = song.title;
        entry.querySelector('h2').innerText = song.artists;
        entry.querySelector('p').innerText = song.lyrics;

        let uuid = song.uuid;
        uuid = uuid.substring(uuid.lastIndexOf('/') + 1);
        entry.querySelector('img').setAttribute('src', 'https://i3.ytimg.com/vi/' + uuid + '/maxresdefault.jpg');

        document.querySelector('.body-style').appendChild(entry);
        document.querySelector('body').scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });

        document.querySelector('.session-state').innerHTML = '<h1>Live!</h1>';
        document.querySelector('.session-prompt').innerHTML = '<h3>Score: 0</h3>';

        rec.stop();

        currentSong = song;
        highestScore = 0;

        let words = song.lyrics.split(' ');
        let lyricsArray = [];
        for (let i = 0; i < words.length; i++) {
            let word = words[i].trim().replace(/[^a-z0-9]/gi, '');
            if (word.length > 0)
                lyricsArray.push(word);
        }

        rec.onresult = function (e) {
            let heardWords = [];

            for (let i = 0; i < e.results.length; i++) {
                let words = e.results[i][0].transcript.trim().split(' ');
                for (let j = 0; j < words.length; j++) {
                    let word = words[j].trim().replace(/[^a-z0-9]/gi, '');
                    if (word.length > 0)
                        heardWords.push(word);
                }
            }

            let edit = edit_distance(heardWords, lyricsArray);
            let score = Math.max(lyricsArray.length - edit, 0);
            highestScore = Math.max(highestScore, score);

            document.querySelector('.session-prompt').innerHTML = '<h3>Score: ' + highestScore + '</h3>';
        }

        rec.start();
    }

    function addEntry(divider, song, player, socket) {
        let entry = document.createElement('div');
        entry.classList.add('playlist-entry');
        entry.innerHTML = '<div class="entry-image"> <img src="https://i3.ytimg.com/vi/IGrhyOtikQ0/maxresdefault.jpg"/> </div><div class="entry-info"> <h1>Something Comforting</h1> <h2>Porter Robinson</h2> <p>If I send this void away...</p></div><div class="entry-controls"> <a class="entry-control" href="#" target="_blank"> <img class="youtube-controls" src="assets/youtube-logo.webp" title="View on YouTube" /> </a> <img class="entry-control" src="assets/audio-icon.png" title="Play Audio"/> <img class="entry-control" src="assets/document-audio-icon.png" title="Play Instrumental"/> </div>';

        let uuid = song.uuid;
        uuid = uuid.substring(uuid.lastIndexOf('/') + 1);

        // Updates the image logo.
        entry.querySelector('.entry-image').querySelector('img').setAttribute('src', 'https://i3.ytimg.com/vi/' + uuid + '/maxresdefault.jpg');
        // let query = 'SELECT title, artists, uuid, lyrics FROM karaoke.songs WHERE state = \'completed\' ORDER BY id DESC';

        // Updates the song's attributes.
        entry.querySelector('h1').innerText = song.title;
        entry.querySelector('h2').innerText = song.artists;
        entry.querySelector('p').innerText = song.lyrics;
        entry.querySelector('a').setAttribute('href', song.uuid);

        // Add the audio handlers.
        entry.querySelector("img[title='Play Audio']").addEventListener('click', function (e) {
            e.preventDefault();

            let mp3 = '/song/uuid/' + uuid;
            player.prepare(mp3, function () {
                player.play();
                connectAudio(player);
                socket.emit('solo-play-song', { song: song, url: mp3 });
                displaySong(song);
            });
        });

        entry.querySelector("img[title='Play Instrumental']").addEventListener('click', function (e) {
            e.preventDefault();

            let mp3 = '/song/uuid/' + uuid + '-no-audio';
            player.prepare(mp3, function () {
                player.play();
                connectAudio(player);
                socket.emit('solo-play-song', { song: song, url: mp3 });
                displaySong(song);
            });
        });

        divider.appendChild(entry);
    }

    function setupSockets() {
        let socket = io();

        var presenterMedia = new ScarletsMediaPresenter({
            audio: {
                channelCount: 1,
                echoCancellation: false
            }
        }, 1000);

        presenterMedia.onRecordingReady = function (packet) {
            socket.emit('solo-header', packet);
        }

        presenterMedia.onBufferProcess = function (packet) {
            if (player != null)
                socket.emit('solo-stream', { packet: packet, time: player.currentTime });
        }

        presenterMedia.startRecording();
    }

    window.addEventListener('load', function () {
        let url = window.location.href;
        let urlSplit = url.lastIndexOf('/');
        let roomCode = urlSplit > 0 ? url.substring(urlSplit + 1) : '';

        let clipboardTimeout = -1;

        document.querySelector('.share-links').addEventListener('click', function (e) {
            e.preventDefault();
            navigator.clipboard.writeText(url);

            if (clipboardTimeout != -1)
                clearTimeout(clipboardTimeout);

            document.getElementById('share-link').innerText = 'Copied!';
            clipboardTimeout = setTimeout(function () {
                document.getElementById('share-link').innerText = 'Copy to Clipboard!';
            }, 1000);
        })

        if (roomCode.length == 0) { // Invalid Link.
            swal("Error", "The room code provided does not exist!", "error").then(function () {
                window.location.href = '/';
            });

            return;
        }

        api.fetch(function (err, songs) {
            if (err) {
                console.log('An error has occured while fetching songs: ' + err);
                location.reload();
            }

            api.leader(roomCode, function (callback) {
                if (!callback) {
                    swal("Error", "An error occured while trying to load the room details.", "error").then(function () {
                        window.location.href = '/';
                    });

                    return;
                } else if (!callback.name) {
                    swal("Error", callback.error, "error").then(function () {
                        window.location.href = '/';
                    });

                    return;
                }

                removeLoadingLogo();

                let bodyElement = document.querySelector('.body-style');

                addDefaultLogo(bodyElement);

                let sessionElement = document.createElement('div');
                sessionElement.classList.add('session-divider');
                sessionElement.innerHTML = '<div class="session-details"> <div class="session-name"> <h1>User\'s Room</h1> </div><div class="session-state"> <h1>Song Selection</h1> </div></div><div class="session-prompt"> <h3>Please select a song to sing.</h3> </div>';
                sessionElement.querySelector('h1').innerText = callback.name + "'s Room";
                bodyElement.appendChild(sessionElement);

                // Load the player details.

                let socket = io();
                player = new ScarletsMediaPlayer(document.querySelector('audio'));
                player.volume(0.2);

                player.on('error', function (e) {
                    swal("Error", "Unable to load this song!\nPlease try again later.", "error");
                });

                player.on('progress', function (e) {
                    // console.log(e);
                });

                player.on('ended', function (e) {
                    // console.log('ended');
                    // console.log(e);
                    socket.emit('solo-end-song');
                    rec.stop();

                    document.querySelector('.spectator-divider').remove();

                    let sessionElement = document.createElement('div');
                    sessionElement.classList.add('game-state');
                    sessionElement.innerHTML = '<div class="game-info"> <h1 id="game-title">Something Comforting</h1> <h2 id="game-artist">Porter Robinson</h2> </div><a href="https://www.youtube.com/watch?v=IGrhyOtikQ0" target="_blank"> <img src="https://i3.ytimg.com/vi/IGrhyOtikQ0/maxresdefault.jpg"/> </a> <h1 id="final-score">Final Score: 8123</h1> <button type="button" id="join-room-button">Return to Song Selection</button>';

                    let song_uuid = currentSong.uuid;
                    song_uuid = song_uuid.substring(song_uuid.lastIndexOf('/') + 1);

                    sessionElement.querySelector('#game-title').innerText = currentSong.title;
                    sessionElement.querySelector('#game-artist').innerText = currentSong.artists;
                    sessionElement.querySelector('a').setAttribute('href', currentSong.uuid);
                    sessionElement.querySelector('img').setAttribute('src', 'https://i3.ytimg.com/vi/' + song_uuid + '/maxresdefault.jpg');
                    sessionElement.querySelector('#final-score').innerText = 'Final Score: ' + highestScore;

                    sessionElement.querySelector('button').addEventListener('click', function (e) {
                        e.preventDefault();
                        document.querySelector('.game-state').remove();

                        let playlist = document.createElement('div');
                        playlist.classList.add('playlist-divider');

                        for (let i = 0; i < songs.length; i++)
                            addEntry(playlist, songs[i], player, socket);

                        document.querySelector('.body-style').appendChild(playlist);

                        document.querySelector('.session-prompt').innerHTML = '<h3>Please select a song to sing.</h3>';
                        document.querySelector('.session-state').innerHTML = '<h1>Song Selection</h1>';
                    });

                    document.querySelector('.body-style').appendChild(sessionElement);

                    document.querySelector('.session-prompt').innerHTML = '<h3>Showing Results...</h3>';
                    document.querySelector('.session-state').innerHTML = '<h1>Post Match Results</h1>';
                });

                if (callback.leader) { // User is the leader of this room.
                    socket.emit('solo-join-room', roomCode);

                    var presenterMedia = new ScarletsMediaPresenter({
                        audio: {
                            channelCount: 1,
                            echoCancellation: false
                        }
                    }, 100);

                    presenterMedia.onRecordingReady = function (packet) {
                        socket.emit('solo-header', packet);
                    }

                    presenterMedia.onBufferProcess = function (packet) {
                        if (player != null)
                            socket.emit('solo-stream', { packet: packet, time: player.currentTime });
                    }

                    presenterMedia.startRecording();

                    let playlist = document.createElement('div');
                    playlist.classList.add('playlist-divider');

                    for (let i = 0; i < songs.length; i++)
                        addEntry(playlist, songs[i], player, socket);

                    bodyElement.appendChild(playlist);
                } else { // User is a spectator.
                    sessionElement.querySelector('.session-prompt').innerHTML = '';
                    sessionElement.querySelector('.session-state').innerHTML = '<h1>Join Channel</h1>';

                    let stateElement = document.createElement('div');
                    stateElement.classList.add('game-state');
                    stateElement.innerHTML = '<h1>Welcome to the Channel!</h1> <img src="assets/party.png"/> <button type="button" id="join-room-button">Join Room</button>';
                    bodyElement.appendChild(stateElement);

                    document.querySelector('#join-room-button').addEventListener('click', function (e) {
                        e.preventDefault();

                        sessionElement.querySelector('.session-state').innerHTML = '<h1>Spectating</h1>';
                        document.querySelector('#join-room-button').remove();

                        let stream = new ScarletsAudioStreamer(100);
                        stream.playStream();

                        socket.on('solo-header', function (packet) {
                            stream.setBufferHeader(packet);
                        });

                        socket.on('solo-stream', function (packet) {
                            // stream.receiveBuffer(packet.packet);
                            stream.realtimeBufferPlay(packet.packet);

                            if (voiceMic)
                                voiceMic.stop();

                            // console.log(packet.time, player.currentTime);

                            let delay = 0.200;
                            let realTime = player.currentTime + delay;
                            let absTime = Math.abs(realTime - packet.time);
                            if (absTime > delay)
                                player.currentTime = Math.max(packet.time - delay, 0);
                        });

                        socket.on('solo-play-song', function (data) {
                            player.prepare(data.url, function () {
                                player.play();
                                connectAudio(player);
                            });
                        });

                        socket.on('solo-end-song', function () {
                            player.stop();
                        });

                        socket.emit('solo-join-room', roomCode);
                        socket.emit('solo-request-state');
                    });

                    if (voiceMic)
                        voiceMic.stop();
                    isSpectator = true;
                }
            });
        });
    });
}());