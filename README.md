# ZYVORA STUDIO — Beginner Setup

This is a starter implementation of your private website-freelancing workspace.

## Included
- Premium warm plum / champagne / ivory interface
- Dashboard and 10-category prompt library
- Client details form that prepares tailored professional prompts
- Gemini AI website generation Netlify Function
- Website preview in a sandboxed iframe
- Save projects locally in this browser
- Download generated HTML
- Netlify publishing function (requires secure environment variables)
- Client handover checklist

## Important limitations in this first version
- Projects are saved in the current browser/device only. They are not cloud-synced yet.
- The app does not yet have a multi-device database or secure user login.
- Generated website download currently exports a standalone HTML file. Images loaded from external URLs still require internet access.
- Netlify direct publishing requires the server-side credentials below.
- You must review and test every AI-generated website before delivering it to a client.

## Easiest deployment route

Because this project uses Netlify Functions, deploy it as a Netlify site with functions enabled. The reliable beginner route is:
1. Put this project into a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Connect GitHub and select the repository.
4. Keep the build command empty; publish directory is `.`.
5. Deploy the site.

A simple drag-and-drop static deployment will not run the AI and publishing functions.

## Connect Gemini AI
1. Create your own API key at https://aistudio.google.com/app/apikey
2. In Netlify: Site configuration → Environment variables.
3. Add `GEMINI_API_KEY` with your key as the value.
4. Trigger a new deploy.

The app also allows saving a key in the current browser for testing. For a deployed private app, server-side environment variables are preferred. Do not share your key.

## Enable direct Netlify publishing
1. Create a Netlify personal access token at https://app.netlify.com/user/applications#personal-access-tokens
2. Choose the Netlify site that will receive generated client sites.
3. Find its Site ID in Site configuration → General → Site details.
4. In the workspace site's environment variables, add:
   - `NETLIFY_AUTH_TOKEN` = your personal access token
   - `NETLIFY_SITE_ID` = destination site ID
5. Redeploy.

Security: this initial direct-publish function deploys a generated site to one configured Netlify site. It is suitable for testing your own workflow, not yet a full multi-client ownership transfer system. For client ownership, deploy from the client's own Netlify account or transfer site ownership using Netlify's supported process. Never share personal access tokens.

## Local preview
Open `index.html` in a browser to inspect the interface. AI generation and Netlify publishing require Netlify Functions, so those features will not work from a plain local file.

## Next improvements
- Add Supabase authentication and cloud project storage
- Add ZIP export including local uploaded assets
- Add project editing and AI revision history
- Add separate Netlify site creation per client
- Add custom domain and client handover workflow
