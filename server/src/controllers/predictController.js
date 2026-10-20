const classifier = require('../services/classifier');

const SAMPLES = [
  {
    id: 'sample-phish-1',
    category: 'Spam / Phishing',
    title: 'Urgent Bank Verification Phishing',
    text: 'URGENT: Your Bank of America account access has been suspended due to unauthorized login attempts. Click here to verify your identity and restore access immediately: http://secure-banking-auth-login.com. Failure to verify within 24 hours will result in permanent account termination.'
  },
  {
    id: 'sample-lottery-2',
    category: 'Spam / Lottery',
    title: 'International Prize Lottery Winner',
    text: 'CONGRATULATIONS! Your mobile number was selected as the lucky winner of $1,500,000 cash in the 2026 International Mobile Draw! To claim your prize money, send your full name, bank details, and telephone to claim@euromillion-draw.org immediately. Free entry guaranteed!'
  },
  {
    id: 'sample-crypto-3',
    category: 'Spam / Crypto',
    title: 'High-Yield Crypto Investment Offer',
    text: 'Exclusive Bitcoin Investment Opportunity: Guaranteed 350% daily return on your crypto deposit. Join thousands of investors making daily passive profits. Click the link now to register your free wallet and deposit $250 to start automated trading: http://bit-yield-bot.trade'
  },
  {
    id: 'sample-ham-meeting',
    category: 'Ham / Business',
    title: 'Quarterly Project Sprint Review Meeting',
    text: 'Hi Team, please find attached the slide deck for our quarterly sprint review meeting scheduled for tomorrow at 3:00 PM. We will review our API milestones, frontend performance bottlenecks, and deployment timelines. Let me know if you have any questions or additions to the agenda.'
  },
  {
    id: 'sample-ham-casual',
    category: 'Ham / Personal',
    title: 'Casual Weekend Coffee & Catchup',
    text: 'Hey Alex, hope you are having a productive week! Are we still meeting for lunch or coffee this Saturday around 1 PM at the downtown cafe? Let me know if that time works for you or if we should reschedule.'
  },
  {
    id: 'sample-ham-invoice',
    category: 'Ham / Corporate',
    title: 'Vendor Contract & Payment Confirmation',
    text: 'Dear John, thank you for sending over the signed consulting agreement. I have forwarded the invoice to our accounts payable department for processing. Payment will be released by Friday via ACH transfer as discussed.'
  }
];

exports.predict = (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a non-empty text string in the request body.'
      });
    }

    const result = classifier.predict(text);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during text classification.'
    });
  }
};

exports.getStats = (req, res) => {
  try {
    const stats = classifier.getStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve model statistics.'
    });
  }
};

exports.getSamples = (req, res) => {
  return res.status(200).json({
    success: true,
    data: SAMPLES
  });
};
