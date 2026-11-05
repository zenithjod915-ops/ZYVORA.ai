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
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Netlify publishing credentials are not configured."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const html = body.html;

    if (!html || typeof html !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Website HTML is required." })
      };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const hash = await crypto
      .createHash("sha1")
      .update(html)
      .digest("hex");

    const deployResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          files: {
            "/index.html": hash
          }
        })
      }
    );

    const deploy = await deployResponse.json();

    if (!deployResponse.ok) {
      throw new Error(deploy.message || "Could not create deploy.");
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
      throw new Error("Website file upload failed.");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        deployId: deploy.id,
        message: "Website publishing started."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Publishing failed."
      })
    };
  }
};
