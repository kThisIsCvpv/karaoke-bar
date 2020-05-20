function setup() {
    createCanvas(1024, 200);
}

let started = false;
let fft;

function draw() {
    background('red');

    if (!started)
        return;

    let spectrum = fft.analyze();

    noStroke();
    fill(0, 0, 255);

    for (let i = 0; i < spectrum.length; i++) {
        let x = map(i, 0, spectrum.length, 0, width);
        let h = -height + map(spectrum[i], 0, 255, height, 0);
        rect(x, height, width / spectrum.length, h)
    }
}

(function () {
    "use strict"

    window.addEventListener('load', function () {
        function startAudio() {
            if (started)
                return;

            let soundFile = new p5.SoundFile('/samples/After Rain.mp3', function (success) {
                console.log('Done loading!');

                let audioCtx = getAudioContext();
                if (audioCtx.state == 'suspended') {
                    audioCtx.resume();
                }

                fft = new p5.FFT();
                fft.setInput(soundFile);
                soundFile.play();

                started = true;
            }, function (error) {
                console.log('Something went wrong.');
            });
        }

        document.getElementById('start-audio').addEventListener('click', function (e) {
            e.preventDefault();
            startAudio();
        });

        // startAudio();

        // let mic = new p5.AudioIn();
        // // let fft = new p5.FFT();

        // mic.start();
        // console.log('Yeet.');
        // // mic.start(function() {
        // // console.log("Hello!");
        // // });

        // mic.amp(1.0);

        // // fft.setInput(mic);
        // console.log(mic);
    });
}());