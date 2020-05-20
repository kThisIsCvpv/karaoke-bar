function setup() {
    createCanvas(0, 0);
}

(function() {
    "use strict"

    window.addEventListener('load', function() {
        let started = false;

        function start_audio() {
            if (started)
                return;

            started = true;

            let mic = new p5.AudioIn();
            mic.start();
            mic.amp(1.0);

            let fft = new p5.FFT();
            fft.setInput(mic);

            let audioElement = new Audio();
            let audioCtx = null;
            let audioSrc = null;

            function printStatus() {
                if (getAudioContext().state == 'suspended') {
                    getAudioContext().resume();
                    audioCtx = getAudioContext();
                }

                let vol = mic.getLevel();
                // console.log(vol);
                // console.log(mic.getLevel);

                let spectrum = fft.analyze();

                console.log(vol + " | " + spectrum.length);

                let val_all = "";
                for (let i = 0; i < spectrum.length; i++) {
                    if (val_all.length > 0)
                        val_all += ", ";
                    val_all += spectrum[i];
                }

                console.log("[" + val_all + "]");

                audioSrc = audioCtx.createBufferSource();

                audioCtx.decodeAudioData(spectrum, function(buffer) {
                    audioSrc.buffer = buffer;
                    audioSrc.connect(audioCtx.destination);
                    audioSrc.start(50);
                }, function (err) {
                    console.log(err);
                });
            }

            setInterval(printStatus, 100);
        }

        document.getElementById('start-audio').addEventListener('click', function(e) {
            e.preventDefault();
            start_audio();
        });

        start_audio();

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