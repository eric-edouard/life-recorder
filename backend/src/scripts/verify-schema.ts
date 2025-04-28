import { sql } from "drizzle-orm";
import { db } from "../db/db";

async function verifyUtterancesSchema() {
	try {
		// Query the information schema to get column details
		const result = await db.execute(sql`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'utterances' AND column_name = 'user_id'
    `);

		console.log("Utterances user_id column information:");
		console.log(result.rows);

		// Check for any NULL values in the user_id column
		const nullCount = await db.execute(sql`
      SELECT COUNT(*) FROM utterances WHERE user_id IS NULL
    `);

		console.log(
			"Number of NULL values in user_id column:",
			nullCount.rows[0].count,
		);

		process.exit(0);
	} catch (error) {
		console.error("Error verifying schema:", error);
		process.exit(1);
	}
}

verifyUtterancesSchema();
