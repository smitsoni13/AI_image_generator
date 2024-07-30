const express = require('express');
const fileupload = require('express-fileupload');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
require ('dotenv').config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileupload());

const STABILITY_API_KEY = process.env.STABILITY_API_KEY; // Replace with your Stability AI API key
const STABILITY_API_URL = process.env.URL; // Replace with the correct API endpoint

app.post('/api/related-images', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            console.log('No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageFile = req.files.image;
        const prompt = req.body.prompt || 'Generate related images';
        const mode = req.body.mode || 'image-to-image';
        const strength = req.body.strength || '0.5';

        console.log('Uploaded file:', imageFile.name, imageFile.size);
        console.log('Prompt:', prompt);
        console.log('Mode:', mode);
        console.log('Strength:', strength);

        const relatedImages = await generateImage(imageFile, prompt, mode, strength);
        console.log('Related images:', relatedImages);

        res.json({
            message: 'File received',
            prompt,
            mode,
            strength,
            relatedImages,
        });

    } catch (err) {
        console.error('Error finding related images:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error finding related images', details: err.message });
        }
    }
});

async function generateImage(imageFile, prompt = 'default prompt', mode = 'default mode', strength = '0.5') {
    try {
        const formData = new FormData();
        formData.append('image', imageFile.data, imageFile.name);
        formData.append('prompt', prompt);
        formData.append('mode', mode);
        formData.append('strength', strength);

        console.log('Sending image to Stability AI API...');
        const response = await axios.postForm(
            STABILITY_API_URL,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${STABILITY_API_KEY}`,
                    ...formData.getHeaders()
                },
            }
        );

        console.log('API Response Status:', response.status);
        console.log('API Response Headers:', response.headers);
        console.log('API Response Data:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.artifacts) {
            return response.data.artifacts.map(artifact => artifact.url);
        } else {
            console.log('No artifacts found in the response');
            return [];
        }
    } catch (error) {
        console.error('Error generating image:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data:', error.response.data);
        }
        throw new Error(`Error generating image: ${error.message}`);
    }
}

app.listen(port, () => {
    console.log(`Server running at ${port}`);
});
