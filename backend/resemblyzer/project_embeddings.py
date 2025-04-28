#!/usr/bin/env python3
import sys
import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
from pathlib import Path

def main():
    if len(sys.argv) != 2:
        print("Usage: python project_embeddings.py <embeddings_json_file>", file=sys.stderr)
        sys.exit(1)

    # Load embeddings from JSON file
    embeddings_file = Path(sys.argv[1])
    if not embeddings_file.exists():
        print(f"File not found: {embeddings_file}", file=sys.stderr)
        sys.exit(1)

    with open(embeddings_file, 'r') as f:
        data = json.load(f)

    embeddings = np.array(data['embeddings'])
    labels = data['labels']
    ids = data['ids']

    print(f"Loaded {len(embeddings)} embeddings")
    
    if len(embeddings) < 2:
        print("Not enough embeddings for projection (minimum 2 required)")
        sys.exit(1)

    # Reduce dimensionality for visualization
    # First reduce to 50 dimensions with PCA (faster)
    if len(embeddings) > 2:
        print("Performing initial PCA reduction to 50 dimensions...")
        pca = PCA(n_components=min(50, len(embeddings) - 1))
        embeddings_50d = pca.fit_transform(embeddings)
        
        # Then use t-SNE for final 2D projection
        print("Performing t-SNE projection to 2D...")
        tsne = TSNE(n_components=2, perplexity=min(30, len(embeddings) - 1), 
                   n_iter=3000, random_state=42)
        embeddings_2d = tsne.fit_transform(embeddings_50d)
    else:
        # If only 2 embeddings, just use PCA
        print("Only 2 embeddings found, using PCA for direct 2D projection")
        pca = PCA(n_components=2)
        embeddings_2d = pca.fit_transform(embeddings)

    # Create a scatter plot
    plt.figure(figsize=(14, 12))
    
    # Extract speaker names for coloring (first part of each label before any space or parenthesis)
    speaker_names = []
    for label in labels:
        name = label.split(' ')[0].split('(')[0].split('-')[0]
        speaker_names.append(name)
    
    # Get unique speaker names for coloring
    unique_speakers = list(set(speaker_names))
    color_indices = [unique_speakers.index(name) for name in speaker_names]
    
    # Plot points
    scatter = plt.scatter(embeddings_2d[:, 0], embeddings_2d[:, 1], 
                          c=color_indices, cmap='tab20', s=100, alpha=0.8)
    
    # Add labels for each point
    for i, label in enumerate(labels):
        plt.annotate(label,
                    (embeddings_2d[i, 0], embeddings_2d[i, 1]),
                    textcoords="offset points",
                    xytext=(0, 7),
                    ha='center',
                    fontsize=9)
    
    # Add a legend with unique speaker names
    handles, _ = scatter.legend_elements(prop="colors")
    plt.legend(handles, unique_speakers, title="Speakers", loc="upper right")
    
    plt.title('Voice Profile Embeddings Projection')
    plt.xlabel('Dimension 1')
    plt.ylabel('Dimension 2')
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Save the plot
    output_file = "embeddings_projection.png"
    plt.tight_layout()
    plt.savefig(output_file, dpi=300)
    print(f"Plot saved to {output_file}")
    
    # Create an interactive plot if matplotlib backend supports it
    try:
        plt.show()
    except:
        print("Could not display interactive plot. Image file has been saved.")

if __name__ == "__main__":
    main() 