
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Gemini API key is not configured."
        })
      };
    }

    let body;

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Invalid JSON request."
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
          error: "A valid website prompt is required."
        })
      };
    }

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

    const startTime = Date.now();
    const maxDuration = 27000;

    let lastError = "Gemini API request failed.";

    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = maxDuration - (Date.now() - startTime);

      if (remaining < 1500) {
        break;
      }

      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        remaining - 500
      );

      let response;

      try {
        response = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
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
                      "Create a complete, professional, responsive " +
                      "single-page website using HTML, CSS and JavaScript. " +
                      "Return only the complete HTML document. " +
                      "Include all CSS and JavaScript inside the HTML. " +
                      "Make it premium, modern, mobile-friendly and functional. " +
                      "Website requirements: " +
                      prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192
            }
          })
        });

        const responseText = await response.text();

        let data;

        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            "Gemini returned an invalid response."
          );
        }

        if (!response.ok) {
          lastError =
            data.error?.message ||
            "Gemini API request failed.";

          if (
            response.status === 503 &&
            attempt === 0 &&
            Date.now() - startTime < maxDuration - 2000
          ) {
            console.log(
              "Gemini is busy. Retrying once..."
            );

            await sleep(700);
            continue;
          }

          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({
              error:
                response.status === 503
                  ? "Gemini is experiencing high demand. Please try again shortly."
                  : response.status === 429
                  ? "Gemini API rate limit reached. Please try again later."
                  : lastError
            })
          };
        }

        const candidate = data.candidates?.[0];

        if (candidate?.finishReason === "MAX_TOKENS") {
          return {
            statusCode: 502,
            headers,
            body: JSON.stringify({
              error: "Website response was too long. Try a shorter prompt."
            })
          };
        }

        const code = candidate?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (!code) {
          throw new Error(
            "Gemini returned an empty website response."
          );
        }

        const cleanCode = code
          .replace(/^```(?:html)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        console.log("Website generated successfully.");

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            code: cleanCode
          })
        };

      } catch (error) {
        lastError = error.message || "Unknown API error.";

        console.error("Gemini request error:", lastError);

        if (error.name === "AbortError") {
          return {
            statusCode: 504,
            headers,
            body: JSON.stringify({
              error: "Gemini took too long to respond. Please try again."
            })
          };
        }

        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({
            error: "Could not connect to Gemini. Please try again."
          })
        };

      } finally {
        clearTimeout(timeout);
      }
    }

    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: "Gemini is busy. Please try again shortly."
      })
    };

  } catch (error) {
    console.error("Generate function error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Something went wrong while generating the website."
      })
    };
  }
};
