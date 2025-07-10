export type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

export interface ProficiencyValue {
  levelEstimate: ProficiencyLevelString;
  canDoSelections: string[];
}

export interface Topic {
  value: string;
  label: string;
  emoji: string;
}

export type Tone = number; 