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
            window.AudioContext = AudioContext = window.AudioContext || window.webkitAudioContext;
            window.audio_context = audio_context = new AudioContext();
            $("#audiopreview").hide();

            function startUserMedia(stream) {
                var input = audio_context.createMediaStreamSource(stream);
                var recorder = new Recorder(input, {
                    numChannels: 1
                });

                $('#reset').on('click', function(ev) {
                    ev.preventDefault();
                    $('#state').off('click');
                    recorder.clear();
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
                            $that
                                .text('Recording...click to stop.')
                                .off('click')
                                .on('click', function(ev) {
                                    ev.preventDefault();
                                    console.log('stop recording');
                                    $that.text('Coverting to mp3, please wait...');
                                    $that.prop('disabled', true);
                                    recorder.stop();
                                    recorder.exportWAV(function(mp3Data) {
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
                                                        contentType: false
                                                    }).done(function(data) {
                                                        //console.log(data);
                                                        $that.text('Uploaded');
                                                        location.reload();
                                                        console.log('uploaded data, ' + data);
                                                    });
                                                };
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
        recorderClass: function() {
            return recordmp3.Recorder;
        },
    };
    return module;

});
