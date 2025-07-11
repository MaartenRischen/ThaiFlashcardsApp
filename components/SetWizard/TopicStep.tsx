import React from 'react';

export function TopicStep({ 
  value,
  onNext,
  onBack 
}: { 
  value: string,
  onNext: (value: string) => void,
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          What would you like to learn?
        </h3>
        <p className="text-sm text-gray-400">
          Choose a topic that interests you
        </p>
      </div>

      {/* Custom Goal Input */}
      <div className="neumorphic p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-2xl">◎</span>
          <span className="text-blue-400">Define Your Own Goal (Recommended!)</span>
        </div>
        <input
          type="text"
          placeholder="e.g., Talk about my holiday plans"
          value={value}
          onChange={(e) => onNext(e.target.value)}
          className="w-full bg-transparent text-gray-300 placeholder-gray-600 focus:outline-none"
        />
        <p className="text-xs text-gray-500">
          Enter your specific learning goal for a personalized experience
        </p>
      </div>

      {/* Scenarios Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xl">✨</span>
          <span className="text-blue-400">Or Choose a Scenario</span>
        </div>
        
        {/* Scrollable container for scenarios */}
        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <button
            onClick={() => onNext("Essential greetings & leave-takings (polite)")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Essential greetings & leave-takings (polite)
          </button>
          <button
            onClick={() => onNext("Introducing yourself (simple)")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Introducing yourself (simple)
          </button>
          <button
            onClick={() => onNext("Basic numbers (1-100 & zero)")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Basic numbers (1-100 & zero)
          </button>
          <button
            onClick={() => onNext("Identifying common objects (classroom/home)")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Identifying common objects (classroom/home)
          </button>
          <button
            onClick={() => onNext("Basic question words & simple answers")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Basic question words & simple answers
          </button>
          <button
            onClick={() => onNext('Saying "Thank You" & "Sorry/Excuse Me" (polite)')}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Saying "Thank You" & "Sorry/Excuse Me" (polite)
          </button>
          <button
            onClick={() => onNext("Basic colors")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Basic colors
          </button>
          <button
            onClick={() => onNext("Simple commands & requests (polite)")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Simple commands & requests (polite)
          </button>
        </div>
      </div>

      {/* Weird Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-xl">⚡</span>
          <span className="text-purple-400">Or Be Weird</span>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => onNext("Hosting a silent auction for thoughts")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Hosting a silent auction for thoughts
          </button>
          <button
            onClick={() => onNext("Teaching meditation to a caffeine molecule")}
            className="w-full text-left p-4 rounded-xl neumorphic hover:bg-gray-800/30 transition-colors"
          >
            Teaching meditation to a caffeine molecule
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="neumorphic-button text-gray-400"
        >
          Back
        </button>
        <button
          onClick={() => onNext(value)}
          className="neumorphic-button text-blue-400"
        >
          Next
        </button>
      </div>
    </div>
  );
} 