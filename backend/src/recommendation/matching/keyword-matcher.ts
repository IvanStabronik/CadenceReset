import { ProtocolName } from './protocol-name.enum';

export interface MatchRule {
  keyword: string;
  protocolName: ProtocolName;
}

export const MATCH_RULES: MatchRule[] = [
  { keyword: 'meeting', protocolName: ProtocolName.PhysiologicalSigh },
  { keyword: 'deadline', protocolName: ProtocolName.BoxBreathing },
];

export const DEFAULT_PROTOCOL_NAME = ProtocolName.BoxBreathing;

/**
 * Matches a trigger context string against keyword rules.
 * Input is expected to be pre-normalized (trimmed + lowercased) from DTO @Transform.
 * Returns the protocol name for the first matching rule, or the default.
 */
export function matchTriggerContext(triggerContext: string): ProtocolName {
  for (const rule of MATCH_RULES) {
    if (triggerContext.includes(rule.keyword)) {
      return rule.protocolName;
    }
  }
  return DEFAULT_PROTOCOL_NAME;
}
