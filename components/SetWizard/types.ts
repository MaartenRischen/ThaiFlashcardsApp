export type ProficiencyLevelString = 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';

export interface ProficiencyValue {
  levelEstimate: ProficiencyLevelString;
  canDoSelections: string[];
}

export interface SelectedTopic {
  type: 'scenario' | 'goal' | 'weird';
  value: string;
}

export interface Topic {
  type: 'scenario' | 'goal' | 'weird';
  value: string;
  label: string;
  emoji: string;
}

export interface SetWizardState {
  mode?: 'auto' | 'manual';
  selectedTopic: SelectedTopic | null;
  proficiency: ProficiencyValue;
  additionalContext: string;
  tone: number;
  cardCount: number;
  manualPhrases?: Array<{
    english: string;
    thai: string;
    pronunciation: string;
    mnemonic?: string;
  }>;
}

export const convertSelectedTopicToTopic = (selectedTopic: SelectedTopic | null): Topic | null => {
  if (!selectedTopic) return null;
  return {
    value: selectedTopic.value,
    type: selectedTopic.type,
    label: selectedTopic.value,
    emoji: '📝'
  };
};

export const convertTopicToSelectedTopic = (topic: Topic | null): SelectedTopic | null => {
  if (!topic) return null;
  return {
    value: topic.value,
    type: topic.type
  };
}; 