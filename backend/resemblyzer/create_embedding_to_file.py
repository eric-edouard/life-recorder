# resemblyzer/create_embedding.py
import sys
from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path
import numpy as np

def main():
    if len(sys.argv) != 3:
        print("Usage: python create_embedding.py <input_mp3> <output_embedding.npy>")
        sys.exit(1)

    mp3_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    if not mp3_path.exists():
        print(f"Input file not found: {mp3_path}")
        sys.exit(1)

    wav = preprocess_wav(mp3_path)
    encoder = VoiceEncoder()
    embedding = encoder.embed_utterance(wav)

    np.save(output_path, embedding)
    print(f"Saved embedding to {output_path}")

if __name__ == "__main__":
    main()