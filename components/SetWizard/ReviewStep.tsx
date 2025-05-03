import React from 'react';
import { SetWizardState } from './SetWizardModal';

const getLabelFromValue = (value: number): string => {
  switch (value) {
    case 1: return 'Textbook realism';
    case 2: return 'Serious & practical';
    case 3: return 'Sorta funny, but like your \'funny\' uncle';
    case 4: return 'Actually funny';
    case 5: return 'A little too much maybe';
    case 6: return 'Definitely too much';
    case 7: return 'Woah now';
    case 8: return 'Ehrm..';
    case 9: return 'You sure about this?';
    case 10: return '̷̛̤̖̯͕̭͙̏̀̏̑̔̆͝Ǫ̶̬̩͇̼͖͖͈̯̳͎͛̀̐͌̅̿̈́̏̾̏̽̎H̶̼̹͓̩̥͈̞̫̯͋̓̄́̓̽̈́̈́̈́͛̎͒̿͜H̴̘͎̗̮̱̗̰̱͓̪̘͛̅̅̐͌̑͆̆̐͐̈́͌̚O̴̖̥̺͎̰̰̠͙̹̔̑̆͆͋̀̐̄̈́͝ͅI̴̢̛̩͔̺͓̯̯̟̱͎͓̾̃̅̈́̍͋̒̔̚͜͠͠͝͝Ḋ̵̻͓̹̼̳̻̼̼̥̳͍͛̈́̑̆̈́̈́̅͜͝͝͠͝Ǫ̶͔̯̟͙̪͗̆͛̍̓̒̔̒̎̄̈́̅͜͝͠N̵̢̢̩̫͚̪̦̥̳̯͚̺̍̏͂͗̌̍̿̾̿́̓͌͛͝K̷̨̨̟̺͔̻̮̯̰̤̬͇̟̙̆͆͗̀̈́̔̅͒͛͊͘͝͠I̶̡̢̡̛͔͎͍̤̤̪͍͙̜͚̓̀͋́̈́̈́̿͂̈́̐͘͘͜E';
    default: return 'Textbook realism';
  }
};

export function ReviewStep({ state, onConfirm, onBack, onCardCountChange }: {
  state: SetWizardState,
  onConfirm: () => void,
  onBack: () => void,
  onCardCountChange: (newCount: number) => void;
}) {
  const selectedTopicDisplay = state.selectedTopic 
    ? state.selectedTopic.value 
    : 'None Selected';

  const topicTypeDisplay = state.selectedTopic
    ? state.selectedTopic.type.charAt(0).toUpperCase() + state.selectedTopic.type.slice(1)
    : '';

  const cardOptions = [5, 10, 15, 20];

  return (
    <div className="space-y-3 px-2">
      <div className="space-y-1 text-center mb-4">
        <h3 className="text-lg font-medium text-white">
          Almost Ready!
        </h3>
      </div>

      <div className="space-y-3">
        {/* Proficiency Level Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Proficiency Level</h4>
            <span className="text-xs text-gray-500">Your current skill</span>
          </div>
          <div className="text-gray-300 text-sm font-medium text-center">{state.proficiency.levelEstimate}</div>
        </div>

        {/* Updated Selected Topic Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Selected Topic</h4>
            <span className="text-xs text-gray-500">What you&apos;ll learn</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {state.selectedTopic ? (
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${state.selectedTopic.type === 'weird' ? 'bg-purple-400' : 'bg-blue-400'}`}></span>
                <span className="text-gray-300 text-sm">{selectedTopicDisplay}</span> 
                <span className="text-xs text-gray-500">({topicTypeDisplay})</span>
              </div>
            ) : (
              <span className="text-gray-400 text-sm italic">No topic selected</span>
            )}
          </div>
        </div>
        
        {/* Card Count Dropdown Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Set Size</h4>
             <span className="text-xs text-gray-500">Number of cards</span>
          </div>
          <div className="flex justify-center">
            <select
              value={state.cardCount} 
              onChange={(e) => onCardCountChange(parseInt(e.target.value, 10))}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1.5 neumorphic-select"
            >
              {cardOptions.map(count => (
                <option key={count} value={count}>
                  {count} Cards
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Learning Style Section */}
        <div className="bg-[#1e1e1e]/50 rounded-lg p-3">
          <div className="flex justify-center items-baseline gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">Learning Style</h4>
            <span className="text-xs text-gray-500">How you&apos;ll learn</span>
          </div>
          <div className="text-gray-300 text-sm font-medium text-center">
            {getLabelFromValue(state.tone)} ({state.tone}/10)
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-3">
        <button
          onClick={onBack}
          className="text-[#8AB4F8] neumorphic-button"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="text-[#8AB4F8] neumorphic-button"
        >
          Create My Set
        </button>
      </div>
    </div>
  );
} 