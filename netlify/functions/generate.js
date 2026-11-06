const { GoogleGenAI } = require('@google/genai');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        let userPrompt = body.prompt;

        if (!userPrompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Prompt is required' }),
            };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on Netlify environment variables.' }),
            };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const systemInstruction = "You are a web developer AI. Output ONLY one complete standalone clean HTML file with embedded CSS and JS. Do not include markdown formatting like ```html, no explanations, no chat text. Start directly with <!DOCTYPE html>.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemInstruction}\n\nUser Prompt: ${userPrompt}` }]
                }
            ],
            config: {
                maxOutputTokens: 4096,
                temperature: 0.7,
            }
        });

        let generatedText = response.text || "";
        generatedText = generatedText.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```$/g, '').trim();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: generatedText }),
        };

    } catch (error) {
        console.error('Server Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: error.message || 'Internal Server Error during generation.' 
            }),
        };
    }
};
