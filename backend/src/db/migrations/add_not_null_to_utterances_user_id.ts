import { sql } from "drizzle-orm";
import { db } from "../db";

export async function migrateUtterancesUserId() {
	try {
		console.log(
			"Starting migration: Adding NOT NULL constraint to utterances.user_id",
		);

		// 1. Update any NULL user_id values to the specified user ID
		await db.execute(sql`
      UPDATE utterances 
      SET user_id = 'tkV0j1bnYVeY9VB3qqinjCxlYbAQIezE' 
      WHERE user_id IS NULL
    `);

		console.log("Updated NULL user_id values to the specified user ID");

		// 2. Add NOT NULL constraint to the user_id column
		await db.execute(sql`
      ALTER TABLE utterances 
      ALTER COLUMN user_id SET NOT NULL
    `);

		console.log("Added NOT NULL constraint to user_id column");
		console.log("Migration completed successfully");
	} catch (error) {
		console.error("Migration failed:", error);
		throw error;
	}
}

// Run migration if this file is executed directly
if (require.main === module) {
	migrateUtterancesUserId()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
