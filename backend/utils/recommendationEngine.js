/**
 * Minimal TF-IDF and Cosine Similarity implementation in plain JavaScript.
 * Suitable for a university Final Year Project without relying on heavy external ML libraries.
 */

// 1. Text Preprocessing: tokenize, lowercase, remove punctuation.
export const preprocessText = (text) => {
    if (!text) return [];
    // Convert to lowercase, remove non-alphanumeric, split by spaces
    return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => word.length > 1);
};

// 2. Compute Term Frequency (TF) for a document
export const computeTF = (tokens) => {
    const tf = {};
    const totalTokens = tokens.length;
    if (totalTokens === 0) return tf;

    tokens.forEach(token => {
        tf[token] = (tf[token] || 0) + 1;
    });

    Object.keys(tf).forEach(token => {
        tf[token] = tf[token] / totalTokens;
    });

    return tf;
};

// 3. Compute Inverse Document Frequency (IDF) for a corpus
export const computeIDF = (corpusTokensList) => {
    const idf = {};
    const N = corpusTokensList.length;

    // Get unique tokens for each document
    const uniqueTokensList = corpusTokensList.map(tokens => [...new Set(tokens)]);

    uniqueTokensList.forEach(tokens => {
        tokens.forEach(token => {
            idf[token] = (idf[token] || 0) + 1;
        });
    });

    Object.keys(idf).forEach(token => {
        // Smoothing added to avoid division by zero
        idf[token] = 1 + Math.log(N / (1 + idf[token]));
    });

    return idf;
};

// 4. Compute TF-IDF vector given TF and corpus IDF
export const computeTFIDF = (tf, idf, vocab) => {
    const vector = {};
    vocab.forEach(token => {
        const tfVal = tf[token] || 0;
        const idfVal = idf[token] || 0;
        vector[token] = tfVal * idfVal;
    });
    return vector;
};

// 5. Cosine Similarity between two vectors
export const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

    allKeys.forEach(key => {
        const aVal = vecA[key] || 0;
        const bVal = vecB[key] || 0;
        dotProduct += aVal * bVal;
        normA += aVal * aVal;
        normB += bVal * bVal;
    });

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
