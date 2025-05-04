export type Word = {
	confidence: number;
	end: number;
	language?: string;
	punctuated_word: string;
	speaker: number;
	speaker_confidence: number;
	start: number;
	word: string;
};

export type Words = Word[];
