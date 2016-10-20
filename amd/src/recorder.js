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
  var module = {
    init: function(upload_url, id, sid) {
      var AudioContext, audio_context;
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
              console.log('start recording');
              ev.preventDefault();
            recorder.record();
            var secPassed = 0;
            var updateText = function() {
              var minutes = Math.floor(secPassed / 60);
              var seconds = ('0' + secPassed % 60).slice(-2);
              $that.text('Recording (' + minutes + ':' + seconds + ')...click to stop');
            }
            updateText();
            var timer = setInterval(function() {
              ++secPassed;
              updateText();
            }, 1000);
              $that
                .off('click')
                .on('click', function(ev) {
                  ev.preventDefault();
                  clearInterval(timer);
                  console.log('stop recording');
                  $that.text('Coverting to mp3, please wait...');
                  $that.prop('disabled', true);
                  recorder.stop();
                  recorder.getMP3Blob(function(mp3Data) {
                    var url = URL.createObjectURL(mp3Data);
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
                          console.log("mp3name = " + mp3Name);
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
                            console.log('uploaded data, ' + data);
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
            })
            .text('Start recording');
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
        console.log('No live audio present: ' + err);
      });
    },
  };
  return module;
});
