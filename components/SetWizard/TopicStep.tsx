import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Pool of common topics
const commonTopicsPool = [
  "Shopping", "Restaurant", "Travel", "Daily conversation",
  "At the hotel", "Asking for directions", "At the market", "Transportation",
  "Meeting new people", "Ordering food", "Emergency situations", "Banking",
  "At the doctor", "Job interview", "Making appointments", "Weather talk",
  "Family gatherings", "School/University", "Sports activities", "Entertainment",
  "Buying groceries", "Renting accommodation", "Airport check-in", "Taxi conversations",
  "Coffee shop orders", "Pharmacy visits", "Post office", "Hair salon",
  "Gym membership", "Library visits", "Museum tours", "Concert tickets"
];

// Pool of practical topics
const practicalTopicsPool = [
  "Simple commands & requests (polite)",
  "Asking for help in emergencies",
  "Ordering food at street vendors",
  "Negotiating prices at markets",
  "Getting directions when lost",
  "Making hotel reservations",
  "Asking about public transportation",
  "Requesting medical assistance",
  "Introducing yourself professionally",
  "Asking for the bill at restaurants",
  "Booking taxi or ride services",
  "Asking about WiFi passwords",
  "Requesting help with language barriers",
  "Making small talk with locals",
  "Asking about local customs",
  "Requesting recommendations for places to visit",
  "Reporting lost items to police",
  "Asking for vegetarian food options",
  "Requesting room service at hotels",
  "Asking about visa requirements"
];

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

// Function to get random topics from any pool
function getRandomTopics(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Function to get random weird topics
function getRandomWeirdTopics(count: number): string[] {
  return getRandomTopics(weirdTopicsPool, count);
}

// Function to get random common topics
function getRandomCommonTopics(count: number): string[] {
  return getRandomTopics(commonTopicsPool, count);
}

// Function to get random practical topics
function getRandomPracticalTopics(count: number): string[] {
  return getRandomTopics(practicalTopicsPool, count);
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
  const [randomCommonTopics, setRandomCommonTopics] = useState<string[]>([]);
  const [randomPracticalTopics, setRandomPracticalTopics] = useState<string[]>([]);
  const [showCommonModal, setShowCommonModal] = useState(false);
  const [showPracticalModal, setShowPracticalModal] = useState(false);

  // Get random topics on component mount
  useEffect(() => {
    setRandomWeirdTopics(getRandomWeirdTopics(2));
    setRandomCommonTopics(getRandomCommonTopics(4));
    setRandomPracticalTopics(getRandomPracticalTopics(2));
  }, []);

  // Modal component for full list
  const TopicListModal = ({ 
    isOpen, 
    onClose, 
    title, 
    topics 
  }: { 
    isOpen: boolean, 
    onClose: () => void, 
    title: string, 
    topics: string[] 
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]" onClick={onClose}>
        <div className="bg-[#1F1F1F] rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-hidden relative flex flex-col border border-[#404040] shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#E0E0E0]">{title}</h3>
            <button
              onClick={onClose}
              className="text-[#BDBDBD] hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
            {topics.map((topicItem, index) => (
              <button
                key={index}
                onClick={() => {
                  onNext(topicItem);
                  onClose();
                }}
                className="neumorphic-card-static text-left p-3 text-sm text-[#E0E0E0] rounded-xl hover:border-[#BB86FC]/30 transition-colors"
              >
                {topicItem}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="neumorphic-button px-4 py-2 text-[#BDBDBD] rounded-lg text-sm"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(topic || "General conversation")}
          className="px-4 py-2 rounded-lg bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!topic.trim()}
        >
          Next →
        </button>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-[#E0E0E0]">
          In what situation do you want to speak Thai?
        </h3>
      </div>

      {/* Custom Topic Input */}
      <div className="neumorphic p-4 rounded-xl space-y-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter topic or situation..."
          className="neumorphic-input w-full placeholder-[#BDBDBD]"
        />
      </div>

      {/* Or Choose Label */}
      <div className="text-center">
        <span className="text-sm text-[#BDBDBD] font-medium">Or choose:</span>
      </div>

      {/* Suggested Topics */}
      <div className="space-y-4">
        {/* Common Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#BDBDBD] font-medium">Common Topics</span>
            <button
              onClick={() => setShowCommonModal(true)}
              className="text-xs text-[#BDBDBD]/70 hover:text-[#BDBDBD] transition-colors"
            >
              📋 Full List
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {randomCommonTopics.map((commonTopic, index) => (
              <button
                key={index}
                onClick={() => onNext(commonTopic)}
                className="neumorphic-card-static text-left p-3 text-sm text-[#E0E0E0] rounded-xl"
              >
                {commonTopic}
              </button>
            ))}
          </div>
        </div>

        {/* Practical Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#BDBDBD] font-medium">Practical</span>
            <button
              onClick={() => setShowPracticalModal(true)}
              className="text-xs text-[#BDBDBD]/70 hover:text-[#BDBDBD] transition-colors"
            >
              📋 Full List
            </button>
          </div>
          <div className="space-y-2">
            {randomPracticalTopics.map((practicalTopic, index) => (
              <button
                key={index}
                onClick={() => onNext(practicalTopic)}
                className="neumorphic-card-static w-full text-left p-3 text-sm text-[#E0E0E0] rounded-xl"
              >
                {practicalTopic}
              </button>
            ))}
          </div>
        </div>

        {/* Weird Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#BB86FC] font-medium">Or Be Weird</span>
            <button
              onClick={() => setRandomWeirdTopics(getRandomWeirdTopics(2))}
              className="text-xs text-[#BB86FC]/70 hover:text-[#BB86FC] transition-colors"
            >
              🎲 Shuffle
            </button>
          </div>
          <div className="space-y-2">
            {randomWeirdTopics.map((weirdTopic, index) => (
              <button
                key={index}
                onClick={() => onNext(weirdTopic)}
                className="neumorphic-card-static w-full text-left p-3 text-sm text-[#BB86FC] rounded-xl border-[#BB86FC]/20"
              >
                {weirdTopic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="neumorphic-button px-6 py-3 text-[#BDBDBD] rounded-xl"
        >
          ← Back
        </button>
        <button
          onClick={() => onNext(topic || "General conversation")}
          className="px-6 py-3 rounded-xl bg-[#BB86FC] hover:bg-[#A374E8] 
                   transition-colors text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!topic.trim()}
        >
          Next →
        </button>
      </div>

      {/* Modals */}
      <TopicListModal
        isOpen={showCommonModal}
        onClose={() => setShowCommonModal(false)}
        title="All Common Topics"
        topics={commonTopicsPool}
      />
      <TopicListModal
        isOpen={showPracticalModal}
        onClose={() => setShowPracticalModal(false)}
        title="All Practical Topics"
        topics={practicalTopicsPool}
      />
    </div>
  );
} 