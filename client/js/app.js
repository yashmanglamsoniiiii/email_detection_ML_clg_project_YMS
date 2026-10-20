/**
 * Frontend Application Controller
 * Handles UI events, API requests, preset loading, result rendering, and 3D coordination.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Holographic Scanner
  init3DScene('threejs-canvas-wrapper');

  // DOM Elements
  const emailInput = document.getElementById('email-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const clearBtn = document.getElementById('clear-btn');
  const charCount = document.getElementById('char-count');
  const presetContainer = document.getElementById('preset-chips');
  const resultCard = document.getElementById('result-card');
  const verdictTitle = document.getElementById('verdict-title');
  const confidenceNum = document.getElementById('confidence-num');
  const probHamPct = document.getElementById('prob-ham-pct');
  const probSpamPct = document.getElementById('prob-spam-pct');
  const probBarFill = document.getElementById('prob-bar-fill');
  const keywordContainer = document.getElementById('keyword-chips-container');
  const latencyBadge = document.getElementById('latency-badge');
  const modal = document.getElementById('model-modal');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // 2. Character & Word Counter
  emailInput.addEventListener('input', () => {
    const text = emailInput.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    charCount.textContent = `${words} words | ${chars} chars`;
  });

  // 3. Clear Input
  clearBtn.addEventListener('click', () => {
    emailInput.value = '';
    charCount.textContent = '0 words | 0 chars';
    if (window.scanner3D) {
      window.scanner3D.setState('idle');
    }
    resultCard.style.display = 'none';
    emailInput.focus();
  });

  // 4. Fetch Sample Presets
  fetch('/api/samples')
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        renderPresets(res.data);
      }
    })
    .catch(err => console.warn('Could not load samples:', err));

  function renderPresets(samples) {
    presetContainer.innerHTML = '';
    samples.forEach(sample => {
      const chip = document.createElement('button');
      const isSpamSample = sample.category.toLowerCase().includes('spam');
      chip.className = `chip ${isSpamSample ? 'spam-chip' : 'ham-chip'}`;
      chip.textContent = sample.title;
      chip.title = sample.category;
      chip.addEventListener('click', () => {
        emailInput.value = sample.text;
        emailInput.dispatchEvent(new Event('input'));
        analyzeMessage();
      });
      presetContainer.appendChild(chip);
    });
  }

  // 5. Fetch Model Stats & Populate Modal
  fetch('/api/stats')
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        populateModelStats(res.data);
      }
    })
    .catch(err => console.warn('Could not load stats:', err));

  function populateModelStats(data) {
    const totalSamplesEl = document.getElementById('stat-total-samples');
    const accuracyEl = document.getElementById('stat-accuracy');
    const precisionEl = document.getElementById('stat-precision');
    const f1El = document.getElementById('stat-f1');
    const headerAccuracy = document.getElementById('header-accuracy-badge');

    if (data.datasetStats && totalSamplesEl) {
      totalSamplesEl.textContent = data.datasetStats.totalSamples.toLocaleString();
    }

    if (data.metrics && data.metrics.logisticRegression) {
      const lr = data.metrics.logisticRegression;
      const accPct = (lr.accuracy * 100).toFixed(1) + '%';
      if (accuracyEl) accuracyEl.textContent = accPct;
      if (precisionEl) precisionEl.textContent = (lr.precision * 100).toFixed(1) + '%';
      if (f1El) f1El.textContent = (lr.f1 * 100).toFixed(1) + '%';
      if (headerAccuracy) headerAccuracy.textContent = `${accPct} Accuracy (LR)`;
    }

    // Populate Top Signals in Modal
    const spamSignalsEl = document.getElementById('modal-top-spam');
    const hamSignalsEl = document.getElementById('modal-top-ham');

    if (spamSignalsEl && data.topSpamWords) {
      spamSignalsEl.innerHTML = data.topSpamWords.slice(0, 15).map(w => 
        `<span class="word-chip spam">${w.word} <span class="score">+${w.weight}</span></span>`
      ).join('');
    }

    if (hamSignalsEl && data.topHamWords) {
      hamSignalsEl.innerHTML = data.topHamWords.slice(0, 15).map(w => 
        `<span class="word-chip ham">${w.word} <span class="score">${w.weight}</span></span>`
      ).join('');
    }
  }

  // 6. Analyze Message Execution
  analyzeBtn.addEventListener('click', analyzeMessage);

  function analyzeMessage() {
    const text = emailInput.value.trim();
    if (!text) {
      alert('Please paste or type an email/SMS message to analyze.');
      emailInput.focus();
      return;
    }

    // Set 3D state to Scanning
    if (window.scanner3D) {
      window.scanner3D.setState('scanning');
    }

    // UI Loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span>? ANALYZING MESSAGE...</span>';

    const reqStartTime = performance.now();

    fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
      .then(r => r.json())
      .then(res => {
        // Enforce a minimum 500ms delay so user can enjoy the 3D laser scan sweep
        const elapsed = performance.now() - reqStartTime;
        const remainingDelay = Math.max(0, 500 - elapsed);

        setTimeout(() => {
          analyzeBtn.disabled = false;
          analyzeBtn.innerHTML = '<span>SCAN & VERIFY MESSAGE</span>';

          if (res.success && res.data) {
            renderPrediction(res.data);
          } else {
            alert('Error: ' + (res.error || 'Unable to classify message.'));
            if (window.scanner3D) window.scanner3D.setState('idle');
          }
        }, remainingDelay);
      })
      .catch(err => {
        console.error('API Error:', err);
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span>SCAN & VERIFY MESSAGE</span>';
        alert('Server connection error. Make sure the backend server is running on port 5000.');
        if (window.scanner3D) window.scanner3D.setState('idle');
      });
  }

  // 7. Render Verdict & Analysis Details
  function renderPrediction(data) {
    resultCard.style.display = 'flex';
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const isSpam = data.isSpam;

    // Trigger 3D scanner state change
    if (window.scanner3D) {
      window.scanner3D.setState(isSpam ? 'spam' : 'ham');
    }

    // Card styling
    resultCard.className = `result-card ${isSpam ? 'verdict-spam' : 'verdict-ham'}`;

    // Verdict Title
    verdictTitle.className = `verdict-title ${isSpam ? 'spam' : 'ham'}`;
    verdictTitle.innerHTML = isSpam 
      ? '<span>?? MALICIOUS SPAM / PHISHING DETECTED</span>'
      : '<span>??? SAFE / LEGITIMATE MESSAGE (HAM)</span>';

    // Confidence
    confidenceNum.textContent = `${data.confidence.toFixed(1)}%`;

    // Latency
    if (latencyBadge) {
      latencyBadge.textContent = `${data.latencyMs}ms inference`;
    }

    // Probabilities
    const hamPercent = (data.hamProbability * 100).toFixed(1);
    const spamPercent = (data.spamProbability * 100).toFixed(1);

    probHamPct.textContent = `Ham: ${hamPercent}%`;
    probSpamPct.textContent = `Spam: ${spamPercent}%`;

    probBarFill.className = `prob-bar-fill ${isSpam ? 'spam' : 'ham'}`;
    probBarFill.style.width = isSpam ? `${spamPercent}%` : `${hamPercent}%`;

    // Influential Keywords Chips
    keywordContainer.innerHTML = '';
    if (data.influentialWords && data.influentialWords.length > 0) {
      data.influentialWords.forEach(item => {
        const chip = document.createElement('span');
        const isSpamWord = item.impact === 'SPAM' || item.contribution > 0;
        chip.className = `word-chip ${isSpamWord ? 'spam' : 'ham'}`;
        chip.innerHTML = `<strong>${escapeHtml(item.word)}</strong> <span class="score">${item.contribution > 0 ? '+' : ''}${item.contribution}</span>`;
        chip.title = `Feature weight: ${item.weight} | Net impact on score: ${item.contribution}`;
        keywordContainer.appendChild(chip);
      });
    } else {
      keywordContainer.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">No high-impact vocabulary triggers found (Neutral content).</span>';
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 8. Modal Handlers
  openModalBtn.addEventListener('click', () => {
    modal.classList.add('open');
  });

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
});
