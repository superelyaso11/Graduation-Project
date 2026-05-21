/* eslint-env node, es2022 */
const { GoogleGenAI } = require('@google/genai'); //gemini sdk

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

//valid categories matching the database
const VALID_CATEGORIES = [
  'ELECTRONICS',
  'CLOTHING',
  'ACCESSORIES',
  'STATIONERY',
  'ID_CARDS',
  'SPORTS',
  'OTHER',
];

//analyze an image URL and return suggested category and description
const analyzeImage = async (imageUrl) => {
  try {
    //fetch the image and convert to base64
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64'); //convert to base64 for gemini input
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    const prompt = `You are analyzing an image of a lost or found item at a university campus.

        Your job is to:
        1. Identify what the item is
        2. Assign it to exactly one of these categories: ${VALID_CATEGORIES.join(', ')}
        3. Write a short description (max 20 words) of the item

        Respond ONLY with a valid JSON object in this exact format, no extra text:
        {
        "category": "CATEGORY_HERE",
        "description": "Short description here"
        }`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64, //send image to base64 for gemini input
          },
        },
        { text: prompt },
      ],
    });

    const text = result.candidates[0].content.parts[0].text.trim();

    //clean response in case Gemini adds markdown backticks
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    //validate category is one of the vlid categories
    if (!VALID_CATEGORIES.includes(parsed.category)) {
      parsed.category = 'OTHER'; //default to OTHER if invalid
    }

    return {
      category: parsed.category,
      description: parsed.description,
      success: true,
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return {
      category: null,
      description: null,
      success: false, //fail gracefully
    };
  }
};

module.exports = { analyzeImage };
