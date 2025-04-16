# resemblyzer/resemblyzer.py
import sys
import json
from resemblyzer import VoiceEncoder, preprocess_wav
import numpy as np
from pathlib import Path

def main():
    if len(sys.argv) != 2:
        print("Usage: python resemblyzer.py <audio_path>", file=sys.stderr)
        sys.exit(1)

    audio_path = Path(sys.argv[1])
    if not audio_path.exists():
        print(f"File not found: {audio_path}", file=sys.stderr)
        sys.exit(1)

    wav = preprocess_wav(audio_path)
    encoder = VoiceEncoder()
    embed = encoder.embed_utterance(wav)

    # Convert numpy array to list for JSON serialization
    print(json.dumps(embed.tolist()))

if __name__ == "__main__":
    main()