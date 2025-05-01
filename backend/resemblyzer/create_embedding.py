import sys
import struct
import io
import json
from resemblyzer import VoiceEncoder
import soundfile as sf
import contextlib

# Redirect stdout during model init to avoid polluting stdout
with contextlib.redirect_stdout(sys.stderr):
    encoder = VoiceEncoder()
print("VoiceEncoder loaded", file=sys.stderr, flush=True)

def read_exactly(n):
    buf = b''
    while len(buf) < n:
        chunk = sys.stdin.buffer.read(n - len(buf))
        if not chunk:
            raise EOFError("Unexpected end of stream")
        buf += chunk
    return buf

while True:
    try:
        size_bytes = read_exactly(4)
        size = struct.unpack('>I', size_bytes)[0]
        wav_data = read_exactly(size)

        wav_io = io.BytesIO(wav_data)
        wav, sr = sf.read(wav_io)
        if sr != 16000:
            raise ValueError(f"Expected 16kHz sampling rate, got {sr}")

        embedding = encoder.embed_utterance(wav)
        print(json.dumps(embedding.tolist()), flush=True)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr, flush=True)
        sys.exit(1)