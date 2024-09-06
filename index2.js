const ffmpeg = require('fluent-ffmpeg');

const inputImage = 'image1.png';   // Your input image
const outputVideo = 'output.mp4';  // Output video file
const duration = 5;                 // Duration for the animation
const targetWidth = 300;            // Target width
const targetHeight = 50;            // Target height

// Create an FFmpeg command
ffmpeg(inputImage)
    .inputOptions('-loop 1')            // Loop the image to create a video stream
    .duration(duration)                  // Set the duration for the output video
    .complexFilter([
        {
            "filter": 'scale',
            "options": `if(lte(t,${duration}), 
        300 + (iw - 300) * (t / ${duration}): 
        ${targetHeight} + (ih - ${targetHeight}) * (t / ${duration}), 
        300): 
        ${targetHeight}`,
            "inputs": '[0:v]',
            "outputs": 'scaled'
        }
    ])
    .map('scaled')                       // Map the scaled output
    .outputOptions('-pix_fmt yuv420p')  // Set pixel format for compatibility
    .videoCodec('libx264')              // Use H.264 codec
    .fps(25)                             // Set frame rate to 25 fps
    .save(outputVideo)                   // Specify output file
    .on('end', function() {
        console.log('Scale down animation to 300x50 complete');
    })
    .on('error', function(err) {
        console.error('Error: ' + err.message);
    });