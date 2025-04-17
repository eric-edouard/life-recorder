const lt = require('localtunnel');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    const tunnel = await lt({ port: 3000, subdomain: 'life-recorder' });

    const url = tunnel.url;
    console.log("🌍 LocalTunnel URL:", url);

    const frontendPath = path.resolve(__dirname, '../../app/src/constants/backendUrl.ts');
    const content = `export const backendUrl = "${url}";\n`;

    fs.writeFileSync(frontendPath, content, 'utf8');
    console.log("✅ Updated backendUrl.ts");

    tunnel.on('close', () => {
        console.log('LocalTunnel closed');
    });

    // Keep the tunnel open
})();