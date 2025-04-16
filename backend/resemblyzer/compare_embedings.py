# resemblyzer/compare_embeddings.py
import sys
import numpy as np
from numpy.linalg import norm

THRESHOLD = 0.75  # typical voice match threshold

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return np.dot(a, b) / (norm(a) * norm(b))

def main():
    if len(sys.argv) != 3:
        print("Usage: python compare_embeddings.py <embedding1.npy> <embedding2.npy>")
        sys.exit(1)

    emb1 = np.load(sys.argv[1])
    emb2 = np.load(sys.argv[2])

    similarity = cosine_similarity(emb1, emb2)
    print(f"Cosine similarity: {similarity:.4f}")

    if similarity > THRESHOLD:
        print("✅ Match")
    else:
        print("❌ Not a match")

if __name__ == "__main__":
    main()