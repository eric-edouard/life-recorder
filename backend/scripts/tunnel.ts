import * as fs from "node:fs";
import * as path from "node:path";
import * as ngrok from "ngrok";

(async (): Promise<void> => {
	console.log("🌍 Starting ngrok ...");

	const url: string = await ngrok.connect({
		addr: 3000,
		authtoken: process.env.NGROK_AUTH_TOKEN, // Optional if you've already authed locally
	});

	console.log("🌍 ngrok URL:", url);

	const frontendPath: string = path.resolve(
		__dirname,
		"../../app/src/constants/backendUrl.ts",
	);
	const content: string = `export const backendUrl = "${url}";\n`;

	fs.writeFileSync(frontendPath, content, "utf8");
	console.log("✅ Updated backendUrl.ts");

	// Keep the tunnel open
})();
