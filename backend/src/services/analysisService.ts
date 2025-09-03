interface MessageAnalysis {
  text: string;
  userId: string;
  chatId?: string;
  username?: string;
}

interface AnalysisResult {
  isFraud: boolean;
  reason: string;
  confidence?: number;
}

// List of common pump-and-dump keywords and phrases
const FRAUD_KEYWORDS = [
  'pump', 'dump', 'moon', 'to the moon', '🚀', 'mooning', '100x',
  '1000x', 'lambo', 'yolo', 'fomo', 'fud', 'hodl', 'whale',
  'whales', 'pumpamentals', 'pumpamentals', 'pumpamentals',
  'pump group', 'pump signal', 'pump it', 'pump soon', 'pump incoming'
];

// List of suspicious patterns
const SUSPICIOUS_PATTERNS = [
  /\b(join|join us|join now|get in early|early entry|limited spots)\b/gi,
  /\b(private group|exclusive group|VIP group|premium group)\b/gi,
  /\b(guaranteed|risk-free|sure profit|no risk|easy money|quick profit)\b/gi,
  /\$[A-Za-z]+/g, // Ticker symbols like $BTC, $ETH
  /\b(buy now|buy the dip|buy before|don't miss out|last chance)\b/gi
];

/**
 * Analyzes a message for potential pump-and-dump schemes
 */
export async function analyzeMessage(message: MessageAnalysis): Promise<AnalysisResult> {
  const { text } = message;
  let isFraud = false;
  const reasons: string[] = [];
  let confidence = 0;

  // Check for exact keyword matches
  const matchedKeywords = FRAUD_KEYWORDS.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );

  // Check for suspicious patterns
  const matchedPatterns: string[] = [];
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matchedPatterns.push(...matches);
  });

  // Calculate confidence score (0-1)
  if (matchedKeywords.length > 0) {
    confidence += matchedKeywords.length * 0.1;
    reasons.push(`Contains suspicious keywords: ${matchedKeywords.join(', ')}`);
  }

  if (matchedPatterns.length > 0) {
    confidence += matchedPatterns.length * 0.15;
    reasons.push(`Matches suspicious patterns: ${matchedPatterns.join(', ')}`);
  }

  // Check for excessive emojis or ALL CAPS
  const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  const capsRatio = (text.replace(/[^A-Z]/g, '').length / text.length) || 0;

  if (emojiCount > 3) {
    confidence += 0.2;
    reasons.push(`Excessive emoji use (${emojiCount} emojis)`);
  }

  if (capsRatio > 0.5 && text.length > 20) {
    confidence += 0.2;
    reasons.push(`Excessive use of ALL CAPS`);
  }

  // Check for ticker symbols
  const tickerSymbols = text.match(/\$[A-Za-z0-9]+/g) || [];
  if (tickerSymbols.length > 0) {
    confidence += 0.1 * tickerSymbols.length;
    reasons.push(`Mentions ticker symbols: ${tickerSymbols.join(', ')}`);
  }

  // Threshold for considering a message as fraud
  isFraud = confidence > 0.3;

  return {
    isFraud,
    reason: reasons.join('\n') || 'No suspicious patterns detected',
    confidence: Math.min(Math.round(confidence * 100) / 100, 1) // Cap at 1.0
  };
}

// Example usage:
// analyzeMessage({
//   text: "🚀🚀 $PND to the moon! Join our VIP group for the next pump! 🚀🚀",
//   userId: '12345',
//   username: 'pump_king'
// }).then(console.log);
