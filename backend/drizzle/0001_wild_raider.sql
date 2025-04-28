ALTER TABLE "utterances" RENAME COLUMN "non_identified_speaker" TO "non_identified_deepgram_speaker";--> statement-breakpoint
ALTER TABLE "utterances" ADD COLUMN "speaker_id" text;--> statement-breakpoint
ALTER TABLE "utterances" ADD CONSTRAINT "utterances_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE no action ON UPDATE no action;