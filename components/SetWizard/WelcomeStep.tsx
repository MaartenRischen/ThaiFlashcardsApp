import React, { useState } from 'react';
import { useUser } from "@clerk/nextjs";

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { isSignedIn } = useUser();

  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Image with decorative background */}
      <div className="relative w-[300px] h-[210px] mb-6">
        {/* Gradient background circle */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-blue-400/20 to-blue-600/10 rounded-2xl blur-md"></div>
        
        {/* Subtle animated glow effect */}
        <div className="absolute inset-0 bg-blue-400/10 rounded-2xl animate-pulse"></div>
        
        {/* Loading text */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-blue-400">
            Cute gif loading...
          </div>
        )}
        
        {/* Image container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gifs/setwizardgif2.gif"
            alt="Set Wizard Introduction"
            width={285}
            height={195}
            className={`object-contain z-10 transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsImageLoaded(true)}
            style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
          />
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <div className="bg-[#1F1F1F] border border-blue-900/30 rounded-lg p-3">
          <p className="text-blue-100 text-sm leading-relaxed">
            Let&apos;s personalize your Thai learning journey! Answer a few quick questions to create your perfect flashcard set.
          </p>
        </div>
        
        {!isSignedIn && (
          <div className="bg-[#2C1810] border-2 border-[#8B4513] rounded-lg p-4">
            <p className="text-[#FFA07A] text-sm leading-relaxed">
              👋 You can explore the Set Wizard, but to save your custom sets you&apos;ll need to log in or register first.
            </p>
          </div>
        )}
        
        {/* Developer Note */}
        <div className="p-4 border-2 border-orange-600/80 rounded-lg bg-orange-900/30 text-orange-200 text-sm my-4 mx-2 shadow-lg">
          <p className="font-semibold mb-2">Note from the developer:</p>
          <p>
            I&apos;m on a holiday deep in the Amazon for five days until May 10. Not bringing any screens or devices, have been staring at them enough the past months and wanna stare at my wife instead. Decided to keep the app online for beta testing, but it&apos;s probably gonna break before I&apos;m back.<br /><br />
            So if your set creation doesn&apos;t work, if the generated pictures aren&apos;t funny or return placeholder images, if the app starts to insult your ancestors for no apparant reason; don&apos;t take it too personally and just wait a couple days for me to resurface and fix it. Maybe even put the screen away as well for now. Sabai sabai.<br /><br />
            And if the app magically keeps working without bugs: publish your best sets in the User Gallery! That&apos;d make me very happy on return from the jungle.<br /><br />
            Gracias - or however you say that in Thai -,<br />
            Maarten
          </p>
        </div>
        
        <p className="text-xs text-gray-500 italic">
          You can skip this and use the default set or import public sets anytime.
        </p>
      </div>

      <div className="flex justify-center pt-3 w-full">
        <button
          onClick={onNext}
          className="neumorphic-button text-blue-400 px-8"
        >
          Let&apos;s Go!
        </button>
      </div>
    </div>
  );
} 