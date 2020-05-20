let fftRange = 512;

let analyzer = null;
let spectrum = new Uint8Array(fftRange);
let radius = 100;

let voiceMic = null;
let voiceFFT = null;

// let rec = new window.SpeechRecognition();
// rec.lang = 'en-US';
// rec.interimResults = false;
// rec.continuous = true;
// rec.onresult = function(e) { console.log(e); }
// rec.start();
// rec.stop();

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

    function addEntry(divider, song, player) {
        let entry = document.createElement('div');
        entry.classList.add('playlist-entry');
        entry.innerHTML = '<div class="entry-image"> <img src="https://i3.ytimg.com/vi/IGrhyOtikQ0/maxresdefault.jpg"/> </div><div class="entry-info"> <h1>Something Comforting</h1> <h2>Porter Robinson</h2> <p>If I send this void away...</p></div><div class="entry-controls"> <a class="entry-control" href="#" target="_blank"> <img src="assets/youtube-logo.webp" title="View on YouTube" /> </a> <img class="entry-control" src="assets/audio-icon.png" title="Play Audio"/> <img class="entry-control" src="assets/document-audio-icon.png" title="Play Instrumental"/> </div>';

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
            });
        });

        entry.querySelector("img[title='Play Instrumental']").addEventListener('click', function (e) {
            e.preventDefault();

            let mp3 = '/song/uuid/' + uuid + '-no-audio';
            player.prepare(mp3, function () {
                player.play();
                connectAudio(player);
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
            console.log("Recording started!");
            console.log(packet);
            socket.emit('bufferHeader', packet);
        }

        presenterMedia.onBufferProcess = function (packet) {
            console.log(packet);
            socket.emit('stream', packet);
        }

        presenterMedia.startRecording();
    }

    window.addEventListener('load', function () {
        window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

        setupSockets();

        api.fetch(function (err, songs) {
            if (err) {
                console.log('An error has occured while fetching songs: ' + err);
                location.reload();
            }

            removeLoadingLogo();

            let bodyElement = document.querySelector('.body-style');

            if (!bodyElement) {
                console.log('Unable to find body element.');
                return;
            }

            addDefaultLogo(bodyElement);

            let player = new ScarletsMediaPlayer(document.querySelector('audio'));

            player.on('error', function (e) {
                swal("Error", "Unable to load this song!\nPlease try again later.", "error");
            });

            player.on('progress', function (e) {
                console.log(e);
            });

            let playlist = document.createElement('div');
            playlist.classList.add('playlist-divider');

            for (let i = 0; i < songs.length; i++)
                addEntry(playlist, songs[i], player);

            bodyElement.appendChild(playlist);
        });
    });
}());