(function() {
    const root = document.querySelector('.bgm-control');
    if (!root) return;

    const button = root.querySelector('.bgm-control__button');
    const hint = root.querySelector('.bgm-control__hint');
    const icon = button.querySelector('i');
    const audioSrc = root.getAttribute('data-audio-src');
    const stateKey = 'richardf-bgm-enabled';

    let audio = null;
    let audioFailed = false;
    let synth = null;
    let playing = false;
    let warmed = false;
    const isTouchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

    function setState(isPlaying, message) {
        playing = isPlaying;
        root.classList.toggle('is-playing', isPlaying);
        button.setAttribute('aria-pressed', String(isPlaying));
        icon.className = isPlaying ? 'fas fa-volume-high' : 'fas fa-music';
        hint.textContent = message || (isPlaying ? 'Playing' : 'Click to play');
        localStorage.setItem(stateKey, isPlaying ? 'on' : 'off');
    }

    function createAudio() {
        if (!audio && audioSrc) {
            audio = new Audio(audioSrc);
            audio.loop = true;
            audio.preload = 'metadata';
            audio.volume = 0.34;
            audio.setAttribute('playsinline', '');
            audio.addEventListener('error', function() {
                audioFailed = true;
                if (playing) startSynth();
            });
            audio.addEventListener('canplaythrough', function() {
                if (!playing) hint.textContent = 'Ready';
            }, { once: true });
        }
        return audio;
    }

    function warmAudio() {
        const track = createAudio();
        if (!track || warmed) return;
        warmed = true;
        track.preload = 'auto';
        hint.textContent = 'Loading';
        try {
            track.load();
        } catch (e) {
            hint.textContent = 'Click to play';
        }
    }

    function makeSynth() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return null;

        const context = new AudioContext();
        const master = context.createGain();
        master.gain.value = 0.045;
        master.connect(context.destination);

        const notes = [146.83, 174.61, 220.00, 196.00];
        const oscillators = [];
        const gains = [];
        const timers = [];

        notes.forEach(function(freq, index) {
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = index % 2 ? 'triangle' : 'sine';
            osc.frequency.value = freq;
            gain.gain.value = index === 0 ? 0.6 : 0.18;
            osc.connect(gain);
            gain.connect(master);
            osc.start();
            oscillators.push(osc);
            gains.push(gain);
        });

        let step = 0;
        const progression = [
            [146.83, 174.61, 220.00, 293.66],
            [130.81, 164.81, 196.00, 261.63],
            [110.00, 146.83, 174.61, 220.00],
            [123.47, 155.56, 196.00, 246.94]
        ];

        function shiftChord() {
            const chord = progression[step % progression.length];
            chord.forEach(function(freq, index) {
                oscillators[index].frequency.setTargetAtTime(freq, context.currentTime, 0.08);
            });
            step += 1;
        }

        shiftChord();
        timers.push(window.setInterval(shiftChord, 3200));

        return {
            context,
            stop: function() {
                timers.forEach(window.clearInterval);
                gains.forEach(function(gain) {
                    gain.gain.setTargetAtTime(0, context.currentTime, 0.08);
                });
                window.setTimeout(function() {
                    oscillators.forEach(function(osc) {
                        try { osc.stop(); } catch (e) {}
                    });
                    context.close();
                }, 180);
            },
            resume: function() {
                return context.resume();
            }
        };
    }

    function startSynth() {
        if (!synth) synth = makeSynth();
        if (!synth) {
            setState(false, 'Music unavailable');
            return Promise.resolve(false);
        }
        return synth.resume().then(function() {
            setState(true, 'Epic ambience');
            return true;
        });
    }

    function isAutoplayBlocked(error) {
        return error && (error.name === 'NotAllowedError' || error.name === 'AbortError');
    }

    function play(options) {
        const opts = options || {};
        const track = createAudio();
        if (track && !audioFailed) {
            hint.textContent = 'Loading';
            return track.play().then(function() {
                setState(true, 'Playing');
                return true;
            }).catch(function(error) {
                if (isAutoplayBlocked(error)) {
                    if (opts.autoplay) {
                        setState(false, 'Click to play');
                        return false;
                    }
                    hint.textContent = 'Click again';
                    return false;
                }
                audioFailed = true;
                return startSynth();
            });
        }
        return startSynth();
    }

    function stop() {
        if (audio) audio.pause();
        if (synth) {
            synth.stop();
            synth = null;
        }
        setState(false, 'Paused');
    }

    button.addEventListener('click', function() {
        if (playing) {
            stop();
            return;
        }
        play();
    });

    const savedState = localStorage.getItem(stateKey);
    if (savedState === 'off') {
        hint.textContent = 'Paused';
    } else {
        window.addEventListener('load', function() {
            const prepareMusic = function() {
                warmAudio();
                window.setTimeout(function() {
                    play({ autoplay: true });
                }, isTouchDevice ? 1800 : 500);
            };

            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(prepareMusic, { timeout: 2500 });
            } else {
                window.setTimeout(prepareMusic, 1200);
            }
        }, { once: true });
    }
}());
