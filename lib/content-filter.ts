/**
 * Content filter for user-submitted contact messages.
 * Blocks explicit threats, severe slurs, and link spam.
 * Intentionally narrow — better to miss an edge case than block a real inquiry.
 */

// Direct threats of violence or death
const THREAT_PATTERNS: RegExp[] = [
  /\b(will|gonna|going\s+to|about\s+to)\s+(kill|murder|shoot|stab|rape|hurt)\s+(you|u)\b/i,
  /\bi\s+know\s+where\s+you\s+(live|stay|are)\b/i,
  /\byou'?re?\s+(dead|going\s+to\s+die|gonna\s+die)\b/i,
  /\bkill\s+yourself\b/i,
  /\bkys\b/i,
]

// Severe slurs — only terms with no benign alternate meaning
// Written as patterns to catch common leet-speak substitutions
const SLUR_PATTERNS: RegExp[] = [
  /\bn[i1!][g9]{2}[ae3]r/i,
  /\bf[a4@]+g+[o0]?t/i,
  /\btr[a4@]nn[yi1e]/i,
]

export function containsHarmfulContent(subject: string, message: string): boolean {
  const combined = `${subject}\n${message}`

  for (const re of THREAT_PATTERNS) {
    if (re.test(combined)) return true
  }

  for (const re of SLUR_PATTERNS) {
    if (re.test(combined)) return true
  }

  // Link spam: 5 or more URLs in a single message
  if ((message.match(/https?:\/\//gi) ?? []).length >= 5) return true

  return false
}
