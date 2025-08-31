import { generateImageViaOpenRouter } from './ideogram-openrouter';

export interface ComicPanel {
  prompt: string;
  imageUrl?: string;
}

export interface ComicStrip {
  id: string;
  title: string;
  panels: ComicPanel[];
}

// Comic strip story templates with funny donkey bridge adventures
export function getComicStoryTemplates(): Array<{ title: string; panels: string[] }> {
  return [
    {
      title: "The Wobbly Bridge",
      panels: [
        "A confident cartoon donkey approaches a rope bridge over a canyon, wearing a superhero cape",
        "The donkey steps onto the bridge which wobbles wildly, cape flying everywhere, eyes wide with surprise",
        "The donkey crawls across on all fours, looking embarrassed while a bird laughs from a tree",
        "The donkey celebrates on the other side, cape torn but victorious, doing a victory dance"
      ]
    },
    {
      title: "Bridge Toll Negotiations",
      panels: [
        "A smiling donkey meets a grumpy troll at a bridge entrance holding a 'TOLL: 5 CARROTS' sign",
        "The donkey empties pockets showing only 3 carrots, looking hopeful with puppy dog eyes",
        "The troll and donkey play rock-paper-scissors, both very intense and competitive",
        "The donkey wins and crosses while the troll eats the 3 carrots happily, both now friends"
      ]
    },
    {
      title: "The Bridge Inspector",
      panels: [
        "A donkey wearing a hard hat and clipboard inspects a rickety wooden bridge very seriously",
        "The donkey writes 'UNSAFE' on clipboard as a heavy elephant walks across the bridge behind them",
        "The bridge holds perfectly fine under the elephant while the donkey looks shocked",
        "The embarrassed donkey changes the report to 'VERY SAFE' while the elephant gives a thumbs up"
      ]
    },
    {
      title: "Bridge Traffic Jam",
      panels: [
        "Two donkeys meet in the middle of a narrow bridge, both refusing to back up",
        "They argue dramatically with exaggerated gestures while a line of animals forms on both sides",
        "A clever rabbit suggests they both turn sideways and shuffle past each other",
        "Success! Both donkeys high-five while the other animals cheer and cross normally"
      ]
    },
    {
      title: "The Fancy New Bridge",
      panels: [
        "A donkey admires a shiny modern glass bridge with LED lights and handrails",
        "The donkey struts confidently onto the glass, sees through to the canyon below, freezes in terror",
        "The donkey army-crawls across the see-through bridge, other animals walking normally around them",
        "Safe on the other side, the donkey kisses the ground while others take selfies on the bridge"
      ]
    },
    {
      title: "Bridge Building 101",
      panels: [
        "An enthusiastic donkey with blueprints directs other animals building a bridge",
        "The bridge is built upside down, with the donkey looking confused at the blueprints",
        "All the animals hang from the upside-down bridge like a jungle gym, having fun",
        "They decide to keep it as a playground, with the donkey awarded 'Most Creative Design'"
      ]
    },
    {
      title: "The Bridge Race",
      panels: [
        "A donkey and a rabbit line up for a race across a long bridge, crowd cheering",
        "The rabbit zooms ahead while the donkey plods slowly but steadily",
        "The rabbit takes a nap near the end, the donkey tiptoes past very quietly",
        "The donkey wins! But wakes up the rabbit to celebrate together with confetti"
      ]
    },
    {
      title: "Musical Bridge",
      panels: [
        "A donkey discovers each plank of a bridge plays a different musical note when stepped on",
        "The donkey starts jumping around playing 'Twinkle Twinkle Little Star' badly",
        "Other animals join in, creating a chaotic but fun bridge orchestra",
        "They all take a bow as passing birds drop flowers like a real concert"
      ]
    },
    {
      title: "The Drawbridge Surprise",
      panels: [
        "A donkey waits patiently at a drawbridge with a 'Press Button to Lower' sign",
        "The donkey presses the button, the bridge lowers... but from the wrong side, blocking the path",
        "The confused donkey presses more buttons, bridges appear everywhere except where needed",
        "Finally gets it right but there are now 10 bridges in random places, donkey shrugs and crosses"
      ]
    },
    {
      title: "Bridge Yoga",
      panels: [
        "A zen donkey does yoga poses on a bridge at sunrise, very peaceful and serene",
        "Wind blows strongly, the donkey wobbles trying to maintain tree pose",
        "The donkey gets tangled up in their own legs, looking like a pretzel",
        "Gives up and just lies flat on the bridge for 'corpse pose', finally at peace"
      ]
    }
  ];
}

export async function generateComicStrip(storyIndex?: number): Promise<ComicStrip> {
  const stories = getComicStoryTemplates();
  const story = stories[storyIndex ?? Math.floor(Math.random() * stories.length)];
  
  const comicId = `comic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const panels: ComicPanel[] = [];

  // Generate each panel
  for (const panelPrompt of story.panels) {
    const artPrompt = `Cartoon comic panel style, simple and colorful: ${panelPrompt}. Cute, expressive, family-friendly, no text or speech bubbles.`;
    
    try {
      const imageUrl = await generateImageViaOpenRouter(artPrompt);
      panels.push({
        prompt: panelPrompt,
        imageUrl: imageUrl || undefined
      });
    } catch (error) {
      console.error('Failed to generate panel:', error);
      panels.push({
        prompt: panelPrompt,
        imageUrl: undefined
      });
    }
  }

  return {
    id: comicId,
    title: story.title,
    panels
  };
}
