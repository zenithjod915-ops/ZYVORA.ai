
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method not allowed. Please use POST."
      })
    };
  }

  try {
    // Get Gemini API key from Netlify environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Gemini API key is not configured in Netlify."
        })
      };
    }

    // Read incoming request
    let body;

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Invalid JSON request body."
        })
      };
    }

    const prompt = body.prompt;

    if (
      !prompt ||
      typeof prompt !== "string" ||
      !prompt.trim()
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "A valid prompt is required."
        })
      };
    }

    // Call Gemini 3.8 Flash
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Create a complete, responsive, professional single-page website using HTML, CSS and JavaScript. " +
                    "Return only the complete HTML document. " +
                    "Include all CSS and JavaScript inside the HTML. " +
                    "Make the design premium, modern, mobile-friendly and fully functional. " +
                    "User website requirements: " +
                    prompt
                }
              ]
            }
          ]
        })
      }
    );

    // Read Gemini response safely
    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        "Gemini returned an invalid response. Please try again."
      );
    }

    // Handle Gemini API errors
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error:
            data.error?.message ||
            "Gemini API request failed."
        })
      };
    }

    // Extract generated HTML
    const code = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!code) {
      throw new Error(
        "Gemini returned an empty website response."
      );
    }

    // Return generated website to frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        code: code
      })
    };

  } catch (error) {
    console.error("Generate function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          error.message ||
          "Something went wrong while generating the website."
      })
    };
  }
};
