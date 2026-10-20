/**
 * Text Preprocessing & Tokenizer
 * Replicates Python clean_text & TfidfVectorizer tokenizer with 100% mathematical parity.
 */

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let s = text.toLowerCase();
  // Strip HTML tags
  s = s.replace(/<[^>]+>/g, ' ');
  // Replace URLs with <URL> token
  s = s.replace(/(https?:\/\/\S+|www\.\S+)/gi, ' <url> ');
  // Replace Email addresses with <EMAIL> token
  s = s.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi, ' <email> ');
  // Replace currency signs with <CURRENCY> token
  s = s.replace(/[$????]/g, ' <currency> ');
  // Replace long numbers/phone numbers with <NUMBER> token
  s = s.replace(/\b\d{4,}\b/g, ' <number> ');
  // Replace special characters / punctuation with spaces
  s = s.replace(/[^a-z0-9<>]/g, ' ');
  // Collapse multiple whitespaces
  s = s.replace(/\s+/g, ' ').trim();
  
  return s;
}

function extractNgrams(cleanedText) {
  if (!cleanedText) return [];
  const words = cleanedText.split(' ').filter(w => w.length > 0);
  const ngrams = [];
  
  // Unigrams
  for (let i = 0; i < words.length; i++) {
    ngrams.push(words[i]);
  }
  
  // Bigrams
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.push(words[i] + ' ' + words[i + 1]);
  }
  
  return ngrams;
}

function computeTermFrequencies(ngrams) {
  const tf = {};
  for (const token of ngrams) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

module.exports = {
  cleanText,
  extractNgrams,
  computeTermFrequencies
};
