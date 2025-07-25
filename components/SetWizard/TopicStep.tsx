import React, { useState, useEffect } from 'react';

// Pool of extremely weird topics
const weirdTopicsPool = [
  "Hosting a silent auction for thoughts that never existed",
  "Teaching meditation to a caffeine molecule on its third espresso",
  "Negotiating a peace treaty between your left and right nostril",
  "Explaining TikTok to a medieval knight's ghost",
  "Running a customer service hotline for disappointed shadows",
  "Convincing a WiFi router to pursue its dreams of becoming a toaster",
  "Teaching quantum physics to a rubber duck in a bathtub",
  "Filing a divorce petition between ketchup and mustard",
  "Hosting a therapy session for anxious punctuation marks",
  "Explaining cryptocurrency to a time-traveling pirate",
  "Running a dating app for lonely electrons",
  "Convincing a banana to unpeel itself",
  "Teaching salsa dancing to a paranoid cactus",
  "Filing taxes for your imaginary friend's imaginary business",
  "Hosting a book club for books that refuse to be read",
  "Explaining the concept of 'silence' to a screaming tea kettle",
  "Running a gym for procrastinating sloths",
  "Convincing gravity to take a vacation",
  "Teaching stand-up comedy to introverted mushrooms",
  "Filing a restraining order against Monday mornings",
  "Hosting a spelling bee for dyslexic ghosts",
  "Explaining social media algorithms to a confused abacus",
  "Running a rehab center for addicted alarm clocks",
  "Convincing your reflection to switch places with you",
  "Teaching interpretive dance to a constipated robot",
  "Filing a missing persons report for your sense of purpose",
  "Hosting a speed dating event for commitment-phobic atoms",
  "Explaining the plot of Inception to a goldfish with amnesia",
  "Running a fashion show for invisible clothes critics",
  "Convincing a doorknob to become a window",
  "Teaching anger management to a passive-aggressive volcano",
  "Filing a complaint about the taste of purple",
  "Hosting a karaoke night for mute buttons",
  "Explaining democracy to a dictatorship of ants",
  "Running a detective agency for missing socks' emotional support",
  "Convincing your past self to stop texting your future self",
  "Teaching philosophy to a nihilistic fortune cookie",
  "Filing for custody of your neighbor's WiFi password",
  "Hosting a protest against the tyranny of alphabetical order",
  "Explaining personal space to an overly attached shadow",
  "Running a travel agency for agoraphobic planets",
  "Convincing Tuesday to identify as Thursday",
  "Teaching yoga to a hyperactive semicolon",
  "Filing an insurance claim for damaged dreams",
  "Hosting a support group for rejected autocorrect suggestions",
  "Explaining veganism to a carnivorous plant with feelings",
  "Running a makeover show for depressed emojis",
  "Convincing the number 7 that it's actually an 8",
  "Teaching mindfulness to a multitasking octopus on caffeine",
  "Filing a noise complaint against your own thoughts",
  "Hosting a TED talk for bacteria about personal growth",
  "Explaining personal hygiene to a soap bar with commitment issues",
  "Running a cooking show where all ingredients are concepts",
  "Convincing your childhood imaginary friend to pay back rent",
  "Teaching conflict resolution to arguing taste buds",
  "Filing for emancipation from your own bad decisions",
  "Hosting a wedding between common sense and chaos",
  "Explaining inflation to a balloon with an economics degree",
  "Running a gym where you only exercise your right to remain silent",
  "Convincing winter to warm up to the idea of being summer",
  "Teaching a masterclass on overthinking to anxious overthinkers",
  "Filing a patent for a machine that creates awkward silences",
  "Hosting a funeral for all your unfinished projects",
  "Explaining the concept of 'fun' to a spreadsheet",
  "Running a restaurant that only serves food for thought",
  "Convincing your keyboard to stop judging your typing",
  "Teaching time management to a procrastinating time traveler",
  "Filing a complaint about gravity being too clingy",
  "Hosting a reality show where mirrors compete for best reflection",
  "Explaining boundaries to an overly enthusiastic exclamation mark",
  "Running a daycare for adult tantrums",
  "Convincing silence to speak up for itself",
  "Teaching a GPS system to find itself emotionally",
  "Filing for a refund on wasted time",
  "Hosting a debate between your brain at 3 AM and 3 PM",
  "Explaining the stock market to a financially anxious piggy bank",
  "Running a hospital for sick burns",
  "Convincing your phone to stop autocorrecting your existence",
  "Teaching self-defense to passive-aggressive sticky notes",
  "Filing a lawsuit against déjà vu for copyright infringement",
  "Hosting a game show where contestants guess what color math is",
  "Explaining social cues to a socially awkward doorbell",
  "Running a prison for escaped responsibilities",
  "Convincing your alarm clock to let you finish your dream",
  "Teaching small talk to antisocial elevator music",
  "Filing for bankruptcy of emotional availability"
];

// Function to get random weird topics
function getRandomWeirdTopics(count: number): string[] {
  const shuffled = [...weirdTopicsPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function TopicStep({ 
  value,
  onNext,
  onBack 
}: { 
  value: string,
  onNext: (value: string) => void,
  onBack: () => void
}) {
  const [topic, setTopic] = useState(value);
  const [randomWeirdTopics, setRandomWeirdTopics] = useState<string[]>([]);

  // Get 2 random weird topics on component mount
  useEffect(() => {
    setRandomWeirdTopics(getRandomWeirdTopics(2));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">
          What do you want to learn about?
        </h3>
        <p className="text-sm text-gray-400">
          Choose a topic or enter your own
        </p>
      </div>

      {/* Custom Topic Input */}
      <div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter your topic..."
          className="w-full p-4 rounded-xl bg-gray-800/50 border border-gray-700 
                   text-gray-100 placeholder-gray-500 focus:border-blue-500 
                   focus:outline-none transition-colors"
        />
      </div>

      {/* Suggested Topics */}
      <div className="space-y-4">
        {/* Common Section */}
        <div className="space-y-2">
          <span className="text-sm text-gray-400">Common Topics</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNext("Shopping")}
              className="text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 
                       transition-colors text-sm"
            >
              Shopping
            </button>
            <button
              onClick={() => onNext("Restaurant")}
              className="text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 
                       transition-colors text-sm"
            >
              Restaurant
            </button>
            <button
              onClick={() => onNext("Travel")}
              className="text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 
                       transition-colors text-sm"
            >
              Travel
            </button>
            <button
              onClick={() => onNext("Daily conversation")}
              className="text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 
                       transition-colors text-sm"
            >
              Daily conversation
            </button>
          </div>
        </div>

        {/* Practical Section */}
        <div className="space-y-2">
          <span className="text-sm text-gray-400">Practical</span>
          <div className="space-y-2">
            <button
              onClick={() => onNext("Simple commands & requests (polite)")}
              className="w-full text-left p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 
                       transition-colors text-sm"
            >
              Simple commands & requests (polite)
            </button>
          </div>
        </div>

        {/* Weird Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-400">Or Be Weird</span>
            <button
              onClick={() => setRandomWeirdTopics(getRandomWeirdTopics(2))}
              className="text-xs text-purple-400/70 hover:text-purple-400 transition-colors"
            >
              🎲 Shuffle
            </button>
          </div>
          <div className="space-y-2">
            {randomWeirdTopics.map((weirdTopic, index) => (
              <button
                key={index}
                onClick={() => onNext(weirdTopic)}
                className="w-full text-left p-3 rounded-lg bg-purple-900/20 hover:bg-purple-800/30 
                         transition-colors text-sm text-purple-100 border border-purple-800/30"
              >
                {weirdTopic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 
                   transition-colors text-gray-300"
        >
          Back
        </button>
        <button
          onClick={() => onNext(topic || "General conversation")}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 
                   transition-colors text-white"
          disabled={!topic.trim()}
        >
          Next
        </button>
      </div>
    </div>
  );
} 