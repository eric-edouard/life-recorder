import { migrateUtterancesUserId } from "../db/migrations/add_not_null_to_utterances_user_id";

async function main() {
	try {
		console.log(
			"Running migration to add NOT NULL constraint to utterances.user_id",
		);
		await migrateUtterancesUserId();
		console.log("Migration completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

main();
