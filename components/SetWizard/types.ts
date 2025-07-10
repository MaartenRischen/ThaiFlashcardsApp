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

export interface SelectedTopic {
  type: 'scenario' | 'goal' | 'weird';
  value: string;
}

export interface SetWizardState {
  selectedTopic: Topic | null;
  proficiency: ProficiencyValue;
  additionalContext: string;
  tone: number;
  cardCount: number;
}

export const convertSelectedTopicToTopic = (selectedTopic: SelectedTopic | null): Topic | null => {
  if (!selectedTopic) return null;
  return {
    value: selectedTopic.value,
    label: selectedTopic.value,
    emoji: '📝'
  };
}; 