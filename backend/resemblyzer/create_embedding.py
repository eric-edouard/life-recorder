# create_embedding.py
import sys, struct, io, json, contextlib
import soundfile as sf
from resemblyzer import VoiceEncoder

with contextlib.redirect_stdout(sys.stderr):
    encoder = VoiceEncoder()
print("VoiceEncoder loaded", file=sys.stderr, flush=True)

def read_exactly(n: int) -> bytes:
    buf = b''
    while len(buf) < n:
        chunk = sys.stdin.buffer.read(n - len(buf))
        if not chunk:
            raise EOFError("Unexpected end of stream")
        buf += chunk
    return buf

while True:
    try:
        id_bytes   = read_exactly(4)      # 4-byte unsigned int
        size_bytes = read_exactly(4)
        req_id     = struct.unpack('>I', id_bytes)[0]
        size       = struct.unpack('>I', size_bytes)[0]

        wav_data   = read_exactly(size)
        wav, sr    = sf.read(io.BytesIO(wav_data))
        if sr != 16000:
            raise ValueError(f"Expected 16 kHz sampling rate, got {sr}")

        emb = encoder.embed_utterance(wav).tolist()
        sys.stdout.write(json.dumps({"id": req_id, "embedding": emb}) + "\n")
        sys.stdout.flush()

    except Exception as e:
        # always tag the error with the same ID so JS can reject the right promise
        err_id = locals().get("req_id", -1)
        sys.stdout.write(json.dumps({"id": err_id, "error": str(e)}) + "\n")
        sys.stdout.flush()