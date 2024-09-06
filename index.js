const ffmpeg = require('fluent-ffmpeg');
const { createCanvas } = require('canvas');
const fs = require('fs');

// Set the dimensions and color
const width = 300;  // Width of the image
const height = 50; // Height of the image
const color = 'rgb(0, 0, 0)'; // Color (e.g., red)

// Create a canvas
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Fill the canvas with the specified color
ctx.fillStyle = color;
ctx.fillRect(0, 0, width, height);

// Save the image to a file
const buffer = canvas.toBuffer('image/png');
const bgColor = 'bg_color.png';
fs.writeFileSync(bgColor, buffer);

// Paths to your input images
const backgroundImagePath = 'image-bg1.jpeg'; // Background image path
const foregroundImagePath1 = 'image1.png'; // Foreground image path
const foregroundImagePath2 = 'image2.png'; // Foreground image path
// Path to the output video
const outputVideoPath = 'output_video.mp4';

const duration = 6.5; // Duration of the video in seconds
const inputList = [bgColor, backgroundImagePath, foregroundImagePath1, foregroundImagePath2];

var chainedInputs = inputList.reduce(
    (result, inputItem) => result.addInput(inputItem).loop("-1"), ffmpeg());

// Create a video from the background image and overlay the foreground image
// 300 + (iw-300)*(1-t/5):50 + (ih-50)*(1-t/5):eval=frame

chainedInputs
    .duration(duration)
    .complexFilter([
        {
            "filter": "scale",
            "options": {
                "eval": "frame",
                "width": "if(gte(t,0.5),300,300+(iw-300)*(1-t/0.5))",
                "height": "if(gte(t,0.5),50,50+(ih-50)*(1-t/0.5))"
            },
            "inputs": '[1:v]',
            "outputs": 'bgResized'
        },
        {
            "filter": "scale",
            "options": {
                "width": "45",
                "height": "23"
            },
            "inputs": '[2]',
            "outputs": 'image1Resized'
        },
        {
            "filter": "scale",
            "options": {
                "width": 45,
                "height": 25
            },
            "inputs": '[3]',
            "outputs": 'image2Resized'
        },
        {
            "filter": "overlay",
            "options": {
                "x": "(W-w)/2",
                "y": "(H-h)/2"
            },
            "inputs": "[0][bgResized]",
            "outputs": "video1image"
        },
        {
            "filter": "overlay",
            "options": {
                "enable": "between(t,2.260,6.5)",
                "x": "247",
                "y": "2"
            },
            "inputs": "[video1image][image1Resized]",
            "outputs": "video2image"
        },
        {
            "filter": "overlay",
            "options": {
                "enable": "between(t,2.260,6.5)",
                "x": "247",
                "y": "20"
            },
            "inputs": "[video2image][image2Resized]",
            "outputs": "imagesAdded"
        },
        {
            "filter": "drawtext",
            "options": {
                "enable": "between(t,0.550,3.510)",
                "text": "LORUM IPSUM DOLO",
                "fontsize": 25,
                "fontcolor": "#ffffff",
                "fontfile": "yMHg_asset2-0.otf", //it is needed to download the font file
                "x": "min(9, -w + t*(w+9)/1.25)",
                "y": "13",
                "alpha": `if(lt(t,${2.98}),1, if(lt(t,${2.98 + 0.520}), 1-(t-${2.98})/${0.520}, 0))`,  // Fade out effect
            },
            "inputs": "[imagesAdded]",
            "outputs": "text1"
        },
        {
            "filter": "drawtext",
            "options": {
                "enable": "between(t,3.48,6.5)",
                "text": "DOLOR SIT AMET",
                "fontsize": 25,
                "fontcolor": "#09b97c",
                "fontfile": "yMHg_asset2-0.otf", //it is needed to download the font file
                "x": "9",
                "y": "13",
                "alpha": "if(lt(t,3.48),0, if(lt(t,4.08), (t-3.48)/0.6, 1))"

            },
            "inputs": "[text1]",
            "outputs": "text2"
        }
    ], 'text2')
    .outputOptions([
        '-c:v', 'libx264',        // Use H.264 codec
        '-t', `${duration}`,      // Set the duration to 5 seconds
        '-pix_fmt', 'yuv420p',    // Set pixel format
    ])
    .on('end', function () {
        console.log('Video created successfully');
    })
    .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
    })
    .save(outputVideoPath);