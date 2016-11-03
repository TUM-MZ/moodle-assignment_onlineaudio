/**
 * Load the navigation tree javascript.
 *
 * @module     assignsubmission_onlineaudio/recorder
 * @package    assignsubmission_onlineaudio
 * @copyright  me
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'assignsubmission_onlineaudio/recordmp3'], function($, recordmp3) {
  "use strict";
  var timer;
  var module = {
    init: function(upload_url, id, sid) {
      recordmp3.init(upload_url);
      var Recorder = recordmp3.Recorder;
      $("#audiopreview").hide();

      function startUserMedia(stream) {
        var recorder = new Recorder(stream);

        $('#reset').on('click', function(ev) {
          ev.preventDefault();
          $('#state').off('click');
          recorder.reset();
          bindStateClick();
          $('#download').attr('href', '#');
          $('#audioplayer').attr('src', '');
          $('#audiopreview').hide();
        });

        function bindStateClick() {
          $('#state').on('click', function(ev) {
              var $that = $(this);
              ev.preventDefault();
              recorder.record();
              module.setState('recording');
              $that
                .off('click')
                .on('click', function(ev) {
                  ev.preventDefault();
                  module.setState('converting');
                  $that.text('Coverting to mp3, please wait...');
                  $that.prop('disabled', true);
                  recorder.stop();
                  recorder.getMP3Blob(function(mp3Data) {
                    var url = URL.createObjectURL(mp3Data);
                    module.setState('submit');
                    $that
                      .off('click')
                      .text('Submit')
                      .prop('disabled', false)
                      .on('click', function(ev) {
                        ev.preventDefault();
                        $that
                          .prop('disabled', true)
                          .text('Uploading...');
                        var reader = new FileReader();
                        reader.onload = function(event) {
                          var fd = new FormData();
                          var mp3Name = encodeURIComponent('audio_recording_' + new Date().getTime() + '.mp3');
                          fd.append('fname', mp3Name);
                          fd.append('assignment_file', event.target.result);
                          $.ajax({
                            type: 'POST',
                            url: upload_url,
                            data: fd,
                            processData: false,
                            contentType: false,
                          }).done(function(data) {
                            $that.text('Uploaded');
                            location.reload();
                          });
                        }
                        reader.readAsDataURL(mp3Data);
                      });

                    $('#download')
                      .attr('href', url)
                      .attr('download', "recorded.mp3")
                      .html('Download Ready');
                    $('#audioplayer').attr('src', url);
                    $("#audiopreview").css('display', 'flex');
                  });
                })
          });
          module.setState('start');
        }
        bindStateClick();
      }

      navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
      navigator.getUserMedia({
        audio: true
      }, startUserMedia, function(err) {
        console.error('No live audio present: ' + err);
      });
    },
    setState: function(state) {
      var $that = $('#state');
      var states = {
        start: function() {
          $that.text('Start recording').removeClass().addClass('start');
        },
        recording: function() {
          var secPassed = 0;
          $that.removeClass().addClass('recording');
          var updateText = function() {
            var minutes = Math.floor(secPassed / 60);
            var seconds = ('0' + secPassed % 60).slice(-2);
            $that.text('Recording (' + minutes + ':' + seconds + ')...click to stop');
          }
          updateText();
          timer = setInterval(function() {
            ++secPassed;
            updateText();
          }, 1000);
        },
        converting: function() {
          clearInterval(timer);
          $that
            .removeClass().addClass('converting')
            .text('Coverting to mp3...please wait')
            .prop('disabled', true);
        },
        submit: function() {
          $that
            .removeClass().addClass('submit')
            .text('Submit')
            .prop('disabled', false);
        }
      };
      states[state]();
    }
  };
  return module;
});
