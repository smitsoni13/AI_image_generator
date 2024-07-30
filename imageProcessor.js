const axios = require('axios');
const FormData = require('form-data');

const OPENAI_API_KEY = 'sk-proj-yAGHmHSL6Hy4CAAbUNMnT3BlbkFJtLTvPQy84AXjxk3Vqwtu';

async function generateImage(prompt, buffer) {
  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image', buffer, 'image.png');
    formData.append('n', 1);
    formData.append('size', '1024x1024');
    formData.append('model', 'dall-e-2');

    const response = await axios.post('https://api.openai.com/v1/images/generations', formData, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    const relatedImages = response.data.data.map((image) => image.url);
    return relatedImages;
  } catch (error) {
    console.error('Error generating image:', error.message);
    throw error; // Propagate error back to caller for handling
  }
}

module.exports = {
  generateImage,
};
