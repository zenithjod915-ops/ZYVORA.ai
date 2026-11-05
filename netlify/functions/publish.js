
const crypto = require("crypto");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const token = process.env.NETLIFY_AUTH_TOKEN;
    const siteId = process.env.NETLIFY_SITE_ID;

    if (!token || !siteId) {
      throw new Error("Netlify environment variables are missing");
    }

    const body = JSON.parse(event.body || "{}");
    const html = body.html || body.code;

    if (!html || typeof html !== "string") {
      throw new Error("Website HTML code is missing");
    }

    const hash = crypto
      .createHash("sha1")
      .update(html)
      .digest("hex");

    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          files: {
            "/index.html": hash
          }
        })
      }
    );

    const deploy = await deployResponse.json();

    if (!deployResponse.ok) {
      throw new Error(
        deploy.message || "Netlify deploy creation failed"
      );
    }

    const uploadResponse = await fetch(
      `https://api.netlify.com/api/v1/deploys/${deploy.id}/files/index.html`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream"
        },
        body: html
      }
    );

    if (!uploadResponse.ok) {
      throw new Error("Website file upload failed");
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        message: "Website published successfully",
        deployId: deploy.id,
        url: deploy.ssl_url || deploy.url
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
