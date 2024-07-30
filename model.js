let  fs = require('fs');
let path = require('path');
let tf = require('@tensorflow/tfjs-node');

let model;

async function loadmodel(){
    model =await tf.loadGraphModel('./../model');
    console.log('Model loaded successfully');
}

async function extractFeatures(imagePath){
    if(!model){
        await loadmodel()
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const decodedImage = tf.node.decodeImage(imageBuffer);
    const inputTensor = decodedImage.expandDims(0).toFloat().div(tf.scalar(255));
    const features = model.predict(inputTensor);

    return features.arraySync();
}

async function findSimilarImages(features) {
    // Implement your logic to find similar images based on the features
    // For demonstration, return dummy data
    return ['path_to_related_image1.jpg', 'path_to_related_image2.jpg'];
}

module.exports = {
    extractFeatures,
    findSimilarImages
}