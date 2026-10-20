/**
 * Pure JavaScript Inference Engine
 * Loads model.json into memory and performs TF-IDF vectorization,
 * sublinear term scaling, L2 normalization, Logistic Regression inference,
 * and token-level feature attribution (explainability).
 */

const fs = require('fs');
const path = require('path');
const { cleanText, extractNgrams, computeTermFrequencies } = require('./tokenizer');

class SpamClassifier {
  constructor() {
    this.model = null;
    this.vocab = null;
    this.idf = null;
    this.coef = null;
    this.intercept = 0;
    this.isLoaded = false;
  }

  loadModel(modelPath) {
    const targetPath = modelPath || path.join(__dirname, '../../model/model.json');
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Model weights file not found at: ${targetPath}`);
    }

    const raw = fs.readFileSync(targetPath, 'utf-8');
    this.model = JSON.parse(raw);
    this.vocab = this.model.vocabulary;
    this.idf = this.model.idf;
    this.coef = this.model.logisticRegression.coef;
    this.intercept = this.model.logisticRegression.intercept;
    this.isLoaded = true;

    console.log(`[ML Engine] Model loaded successfully:`);
    console.log(`   - Vocabulary size: ${Object.keys(this.vocab).length.toLocaleString()} n-grams`);
    console.log(`   - Logistic Regression Test Accuracy: ${(this.model.metrics.logisticRegression.accuracy * 100).toFixed(2)}%`);
    console.log(`   - Logistic Regression Test Precision: ${(this.model.metrics.logisticRegression.precision * 100).toFixed(2)}%`);
  }

  predict(text) {
    if (!this.isLoaded) {
      this.loadModel();
    }

    const startTime = performance.now();
    const cleaned = cleanText(text);
    const ngrams = extractNgrams(cleaned);
    const termFreqs = computeTermFrequencies(ngrams);

    // Vectorize using TF-IDF with sublinear TF: tfidf = (1 + ln(count)) * idf
    let normSq = 0;
    const activeFeatures = [];

    for (const [token, count] of Object.entries(termFreqs)) {
      if (Object.prototype.hasOwnProperty.call(this.vocab, token)) {
        const idx = this.vocab[token];
        const idfVal = this.idf[idx];
        const sublinearTf = 1 + Math.log(count);
        const tfidf = sublinearTf * idfVal;
        normSq += tfidf * tfidf;
        activeFeatures.push({
          index: idx,
          tfidf,
          word: token,
          count
        });
      }
    }

    const norm = Math.sqrt(normSq);
    let logit = this.intercept;
    const influentialWords = [];

    if (norm > 0) {
      for (const feat of activeFeatures) {
        const normalizedVal = feat.tfidf / norm;
        const weight = this.coef[feat.index];
        const contribution = normalizedVal * weight;
        logit += contribution;

        influentialWords.push({
          word: feat.word,
          weight: Math.round(weight * 1000) / 1000,
          contribution: Math.round(contribution * 1000) / 1000,
          impact: contribution > 0.05 ? 'SPAM' : (contribution < -0.05 ? 'HAM' : 'NEUTRAL')
        });
      }
    }

    // Logistic sigmoid: P(spam) = 1 / (1 + exp(-logit))
    const spamProb = 1 / (1 + Math.exp(-logit));
    const hamProb = 1 - spamProb;

    const isSpam = spamProb >= 0.5;
    const confidence = isSpam ? (spamProb * 100) : (hamProb * 100);

    // Sort influential words by absolute magnitude of contribution
    influentialWords.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      label: isSpam ? 'SPAM' : 'HAM',
      isSpam,
      confidence: Math.round(confidence * 10) / 10,
      spamProbability: Math.round(spamProb * 10000) / 10000,
      hamProbability: Math.round(hamProb * 10000) / 10000,
      logit: Math.round(logit * 1000) / 1000,
      influentialWords: influentialWords.slice(0, 12),
      detectedFeaturesCount: activeFeatures.length,
      latencyMs
    };
  }

  getStats() {
    if (!this.isLoaded) {
      this.loadModel();
    }
    return {
      modelType: this.model.modelType,
      activeModel: this.model.activeModel,
      createdAt: this.model.createdAt,
      datasetStats: this.model.datasetStats,
      metrics: this.model.metrics,
      topSpamWords: this.model.topSpamWords.slice(0, 20),
      topHamWords: this.model.topHamWords.slice(0, 20)
    };
  }
}

const classifier = new SpamClassifier();

module.exports = classifier;
