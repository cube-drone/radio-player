/*
_ __ ___   __ _ _ __ __ _ _   _  ___  ___
| '_ ` _ \ / _` | '__/ _` | | | |/ _ \/ _ \
| | | | | | (_| | | | (_| | |_| |  __/  __/
|_| |_| |_|\__,_|_|  \__, |\__,_|\___|\___|
                        |_|

*/
var marqueeRadio = (stream) => {

    var POLL_INTERVAL = 5000;

    var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    var gainNode = audioCtx.createGain();
    var analyser = audioCtx.createAnalyser();
    var bufferLength = 1;
    var dataArray = new Uint8Array(1);
    var playing = false;
    $(document).ready(function(){
        $("#marqueeRadio").append(`
            <div id='playwrapper'>
                <div id='songinfo'>
                    <div id='songtitle'></div>
                    &mdash;
                    <div id='songartist'></div>
                    &nbsp;
                    <small>
                    (
                    <div id='listeners'></div>
                    :
                    <div id='listener-peak'></div>
                    )
                    </small>
                    <div id='stream-location'></div>
                </div>
                <div id='play'></div>
            </div>
            <canvas id='waveform' />
            <div id='audioplayer'>

            </div>
        `);

        var canvas = $("#waveform").get(0);
        canvas.width = document.body.clientWidth;
        canvas.height = 600;
        var canvasCtx = canvas.getContext("2d");


        console.log('hi');

        let updateMetadata = () => {
            axios.get('/status-json.xsl')
                .then((data)=>{
                    //console.log(data);
                    //console.log(data.data.icestats.source[0].artist);
                    //console.log(data.data.icestats.source[0].title);
                    let artist = data.data.icestats.source[1].artist;
                    let title = data.data.icestats.source[1].title;
                    let listeners = data.data.icestats.source[1].listeners;
                    let listener_peak = data.data.icestats.source[1].listener_peak;
                    if(title.toLowerCase() !== "unknown"){
                        $("#songartist").html(artist);
                        $("#songtitle").html(title);
                    } else {
                        $("#songartist").html("Promo");
                        $("#songtitle").html("Hex Hello World");
                    }
                    $("#listeners").html(listeners);
                    $("#listener-peak").html(listener_peak);
                    $("#stream-location").html(window.location + "/groove.ogg");
                })
                .catch((err)=>{
                    console.error(err);
                });

        };

        setInterval(updateMetadata, POLL_INTERVAL);
        updateMetadata();

        $("#play").click(()=>{
            if(playing === false){
                var timestamp = + new Date();
                $("#audioplayer").append(`
                <audio id="source-${timestamp}" autoplay>
                    <source src="/${stream}?id=${timestamp}" type="audio/ogg">
                </audio>`);

                var audioElement = $("#source-"+timestamp).get(0)
                var source = audioCtx.createMediaElementSource(audioElement);
                source.connect(gainNode);
                gainNode.connect(analyser);
                analyser.connect(audioCtx.destination);
                analyser.fftSize = 2048;
                bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                playing = true;
            } else {
                $("#audioplayer").html('');
                playing = false;
            }
        });

        //canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        function draw() {
            var drawVisual = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
            canvasCtx.beginPath();

            var sliceWidth = canvas.width * 1.0 / bufferLength;
            var x = 0;
            for(var i = 0; i < bufferLength; i++){
                var v = dataArray[i] / 128.0;
                var y = v * canvas.height/2;

                if(i === 0){
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height/2);
            canvasCtx.stroke();
        };

        draw();
    });
};
