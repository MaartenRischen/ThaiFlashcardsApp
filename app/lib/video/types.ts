export interface AudioTiming {
  phraseIndex: number;
  type: 'english' | 'thai' | 'mnemonic' | 'pause';
  startTime: number;
  endTime: number;
  isActive?: boolean;
  repetition?: number;
  instructionText?: string; // Added for guided lessons
}