import { useSet } from '@/app/context/SetContext';
import { getToneLabel } from '@/app/lib/utils';
import { SetMetaData } from '@/app/lib/storage';

          {availableSets.map(set => {
            // ... (existing logic like isDefault, imgUrl, etc.) ...
            
            return (
              <div 
                key={set.id}
                // ... (existing card container styling) ...
              >
                {/* ... (existing Image and title rendering) ... */}
                
                {/* ADDED: Proficiency and Tone Level */}
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                  {set.level && <span>Level: <span className="font-medium text-[#A9C4FC]">{set.level}</span></span>}
                  {set.toneLevel !== undefined && 
                    <span>Tone: <span className="font-medium text-[#A9C4FC]">{getToneLabel(set.toneLevel)}</span></span>
                  }
                </div>
                
                {/* Phrase Count */}
                <p className="text-xs text-gray-400 mt-0.5">{set.phraseCount} cards</p>

                {/* ... (existing buttons/actions) ... */}
              </div>
            );
          })} 