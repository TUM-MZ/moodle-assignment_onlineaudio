define(['jquery'], function($) {
  "use strict";
  var module = {
    init: function(upload_url) {
      var WORKER_PATH = './submission/onlineaudio/amd/src/workers/worker-realtime.js';
      var currCallback;

      var Recorder = function(stream, cfg) {
        var config = cfg || {};
        var bufferLen = config.bufferLen || 4096;
        var numChannels = config.numChannels || 2;
        var AudioContext, source;
        window.AudioContext = AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioContext = new AudioContext();
        var worker = new Worker(config.workerPath || WORKER_PATH);

        var initWorker = function() {
          worker.postMessage({
            cmd: 'init',
            config: {
              sampleRate: 48000, // alternative: audioContext.sampleRate
              numChannels: numChannels,
              debug: true,
            }
          });
        }

        initWorker();

        var onaudioprocessHandler = function(e) {
          var bufferLeft = e.inputBuffer.getChannelData(0);
          var bufferRight = e.inputBuffer.getChannelData(1);
          worker.postMessage({
            cmd: 'encode',
            bufferLeft: bufferLeft,
            bufferRight: bufferRight,
          });
        }

        this.record = function() {
          source = audioContext.createMediaStreamSource(stream);
          this.node = (audioContext.createScriptProcessor ||
            AudioContext.createJavaScriptNode).call(audioContext,
            bufferLen, numChannels, numChannels);
          this.node.onaudioprocess = onaudioprocessHandler;

          source.connect(this.node);
          this.node.connect(audioContext.destination);
        }

        this.stop = function() {
          this.node.onaudioprocess = null;
          source.disconnect();
          this.node.disconnect();
        }

        this.reset = function() {
          initWorker();
        }

        this.getMP3Blob = function(cb) {
          currCallback = cb || config.callback;
          if (!currCallback) throw new Error('Callback not set');
          worker.postMessage({
            cmd: 'finish',
          });
        }

        //Mp3 conversion
        worker.onmessage = function(e) {
          var mp3Blob = new Blob(e.data.buf, {
            type: 'audio/mp3'
          });
          currCallback(mp3Blob);

        };
      };
      module.Recorder = Recorder;
    },
  };

  return module;
});
