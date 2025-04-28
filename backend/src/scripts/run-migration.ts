import { db } from "@backend/src/db/db";
import { utterancesTable } from "@backend/src/db/schema";

async function main() {
	try {
		const speakerId = "tkV0j1bnYVeY9VB3qqinjCxlYbAQIezE";

		// Update all utterances to have the specified speaker ID
		await db.update(utterancesTable).set({
			speakerId,
		});

		console.log("Migration completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

main();
