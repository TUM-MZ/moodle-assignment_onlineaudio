/**
   Based on the example 
*/
(function () {
  'use strict';

  console.log('MP3 conversion worker started.');
  importScripts('lame.min.js');

  var mp3Encoder, maxSamples = 1152, samplesLeft, samplesRight, config, dataBuffer;
  var clearBuffer = function () {
    dataBuffer = [];
  };

  var appendToBuffer = function (mp3Buf) {
    dataBuffer.push(new Int8Array(mp3Buf));
  };


  var init = function (prefConfig) {
    config = prefConfig || {debug: true};
    mp3Encoder = new lamejs.Mp3Encoder(1, config.sampleRate || 44100, config.bitRate || 123);
    clearBuffer();
  };

  var floatTo16BitPCM = function floatTo16BitPCM(input, output) {
    //var offset = 0;
    for (var i = 0; i < input.length; i++) {
      var s = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
  };

  var convertBuffer = function(arrayBuffer){
    var data = new Float32Array(arrayBuffer);
    var out = new Int16Array(arrayBuffer.length);
    floatTo16BitPCM(data, out)
    return out;
  };

  var encode = function (arrayBufferLeft, arrayBufferRight) {
    samplesLeft = convertBuffer(arrayBufferLeft);
    samplesRight = convertBuffer(arrayBufferRight);
    var remaining = samplesLeft.length;
    for (var i = 0; remaining >= 0; i += maxSamples) {
      var left = samplesLeft.subarray(i, i + maxSamples);
      var right = samplesRight.subarray(i, i + maxSamples);
      var mp3buf = mp3Encoder.encodeBuffer(left, right);
      appendToBuffer(mp3buf);
      remaining -= maxSamples;
    }
  };

  var finish = function () {
    appendToBuffer(mp3Encoder.flush());
    self.postMessage({
      cmd: 'end',
      buf: dataBuffer
    });
    if (config.debug) {
      console.log('Sending finished command');
    }
    clearBuffer(); //free up memory
  };

  self.onmessage = function (e) {
    switch (e.data.cmd) {
      case 'init':
        init(e.data.config);
        break;

      case 'encode':
        encode(e.data.bufferLeft, e.data.bufferRight);
        break;

    case 'finish':
      console.log('Worker finishing');
        finish();
        break;
    }
  };

})();
