const ngrok = require('ngrok');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    console.log("🌍 Starting ngrok ...");

    const url = await ngrok.connect({
        addr: 3000,
        authtoken: process.env.NGROK_AUTH_TOKEN, // Optional if you've already authed locally
    });

    console.log("🌍 ngrok URL:", url);

    const frontendPath = path.resolve(__dirname, '../../app/src/constants/backendUrl.ts');
    const content = `export const backendUrl = "${url}";\n`;

    fs.writeFileSync(frontendPath, content, 'utf8');
    console.log("✅ Updated backendUrl.ts");

    // Keep the tunnel open
})();