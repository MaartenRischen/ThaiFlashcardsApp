#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { PrismaClient } from '@prisma/client';
import { isInvalidMnemonic } from '../app/lib/mnemonic-breakdown';

const prisma = new PrismaClient();

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Track processed sets to avoid duplicates (from previous Gemini runs)
const processedSets = new Set<string>([
  // First run - 216 sets
  'cma1buou5004fy1fv3uj0868h', 'cma1bxiqp004ty1fvjxnl3s33', 'cma1bvzrz004ly1fvv5jgxpgl',
  'cma1cr08b008fy1fv6xmm2tip', 'cmabasqtn0054l101by7pc2nv', 'cma9afjm2000dpp01vi9oqd2c',
  'cma1c1h4k0059y1fv4t95kjya', 'cma1c1pjo005by1fvb3t24sr9', 'cma9amskk000zpp012xhzpfy8',
  'cm9x5teyx0001rr014dqq8chd', 'cmabsfrti0001qo01kln1h1v0', 'cm9ygns8c0001pj01a9kyho2y',
  'cm9x9pql60001ph01xzpcrvb1', 'cm9x9s7h5000dph01o3fvu5ls', 'cm9xa2hj2000pph01wfsj4z80',
  'cma8heffg000imj01d5hw7ayv', 'cmabsixz3000dqo01v84wuvdz', 'cm9ylxo350002py01gu0twt6p',
  'cm9ymy4f00001o901bnkg2di6', 'cm9yp3520000ple01pn2xix93', 'cm9yp80jm0011le01z39rgqac',
  'cma1c2o7b005fy1fvdkz2epr8', 'cma1c36w1005hy1fvwdcrzgqg', 'cma1c40c8005ly1fvlafl6zwr',
  'cma1c4exw005ny1fvcbrfn5od', 'cm9yzemo80001p001rbvubzhr', 'cma1c6gzu005xy1fv4xqyst4a',
  'cma1c6qve005zy1fvl84ktykr', 'cma1c7xge0065y1fvjfntzf9e', 'cma1c97it006by1fvv7wmcps8',
  'cma1ca8ya006fy1fv265kg8a8', 'cma1ctuh4008ry1fvm608lxxq', 'cma1cafah006hy1fvzz9ddzh5',
  'cma1cbnbb006ny1fvgu4hd40b', 'cm9z15gi7000dp9014xta81fj', 'cm9z16buq000pp901g3mheqjr',
  'cm9z19k6v0011p901e1fk5zxu', 'cma8hf2ri0014mj01i19uhxpu', 'cm9z29om3000dp6014m1zo9yz',
  'cm9z29obk005gy1xngwejoqk8', 'cma8hfcyq001gmj017alonugw', 'cm9z39mk3000dnp018ydw927h',
  'cma1cv31i0095y1fv9kwub949', 'cm9z3aozi000rnp01b2iua5h7', 'cma1ccypq006ry1fv7c9i617o',
  'cma1cczw3006ty1fv8mcl3ufk', 'cma1chdti0079y1fv6bcl4nz3', 'cma1clr22007ty1fv7dwgpy3i',
  'cma1cn3uf007zy1fv2nfmgtoa', 'cma1ckbkt007ly1fvd723qvee', 'cma1cn01o007xy1fv4iax2ats',
  'cma1cvvv3009gy1fvddcbeiov', 'cm9z3aiq1006ey1xney3h5mbu', 'cm9z3b72e006qy1xnqwxb1iww',
  'cm9z3b9i1006sy1xnrfw2694t', 'cma9zi4lo0029o9019kw7pn2q', 'cm9z400ew000dmm01nbb6406k',
  'cma0lvj6z0001o901id1kq9g4', 'cma9ziux5002jo901eqx5naiu', 'cma0p0gbp0001y1ufujg23wge',
  'cma0p499g000dmo013blh8yvn', 'cma0pjfeq000pmo01m2ir53mc', 'cma0pkrhp0013mo01faz91o7a',
  'cma9zo98n002to901q2um7glr', 'cma1b3qtj000xy1fvsthqbg74', 'cma1b31cg0001y1fv17e9ykjv',
  'cma1bev6d001ty1fvpw6g45n4', 'cma1bpeja003ty1fvmu56tkuy', 'cma1bfd5x001vy1fvf3oq4os6',
  'cma1bnzns003ly1fvqlp8chn7', 'cma1cpsyc008by1fvm6f6sn4e', 'cma1cx9vo009zy1fvt78ojcrq',
  'cma1czaw100afy1fve39y5mw8', 'cma1czdau00ahy1fvl49c6nrk', 'cma1cznjg00any1fvgpdg8vej',
  'cma1czyyj00auy1fvuxd1m5at', 'cma1d0nmr00b2y1fvpuzdrpi7', 'cma1d0rj900b6y1fvwdyemu72',
  'cma9zsv0s003jo901hryxg78w', 'cma1d1txj00bey1fvznbi0s3l', 'cma1d1ytx00bjy1fvez6n0k1p',
  'cma1d2huo00bly1fv0f3s9gm9', 'cma9zsbbb0039o9014352jcwj', 'cma1ef6ox0001n601om0sw8ia',
  'cma1efr2r000dn601r9xtqciv', 'cma1l3kfl00bzy1fv6lojnkry', 'cma1eg7q8000fn60183qvgscg',
  'cma1l2zgi00bpy1fvosw3eswq', 'cmaabtbdv0001qk01rj9ft6f1', 'cmaae0lv4002lqk01b0r1l5i5',
  'cma1l4mtk00c8y1fvu4o7fe0c', 'cma1l5yvy00chy1fvkem774h8', 'cma1l64wv00cjy1fvroy9yp2r',
  'cma1l8swc00dey1fvh3kij97v', 'cma1l907r00dgy1fvrv20qkek', 'cma1l9ntz00dny1fvhbvmr7n5',
  'cma1lhvci00fay1fvq65ke8o7', 'cma1liohy0009y12yltqutmar', 'cma1livt9000ey12y3yslyxlk',
  'cma1lj0si00fjy1fviribf2x4', 'cma1ljor0000ly12yc3b6p6jq', 'cma1lkauo000ty12y6nay42sp',
  'cma1uvtwm00gsy1fv8o5317gf', 'cma1v7flx00gxy1fvbmjs1pe6', 'cma1vcz4r00h2y1fvs7vvdwth',
  'cma1veu7d00h7y1fvd9xh2y9s', 'cma1vsv9h00hhy1fvdrv8junf', 'cma1zq2hi00hny1fvhmm2hp88',
  'cma20gh6o00i5y1fvrxj4altq', 'cma20ydu700j2y1fvq2eshqx2', 'cma218dgb00jky1fvkqbeqykt',
  'cma218re900jny1fv0rd66ek0', 'cma219gjg00jty1fvhjtnicu1', 'cma21rras00k8y1fvuy9gq6dl',
  'cma2mbixh00khy1fvupsawv7f', 'cma9eclrl0001oz01tqvr4xxj', 'cma9efhu4000moz01c7e3jgkf',
  'cma9zuqhu003uo901x3bk695a', 'cma2nxfh200kky1fv6voskgo9', 'cma2nxo9e00kny1fvvpy9xaqh',
  'cma2ny3du00kqy1fvt6v7flk0', 'cma2nzzwt00l5y1fvokfu9hfx', 'cma2o0jrf00lby1fv1f0n4g4r',
  'cma2owsfy00lny1fvyfwngnwi', 'cma2oxwpy00lty1fvd681igu7', 'cma2p2irt00lwy1fvl83hr86k',
  'cma2p7m6x00mhy1fvh6yjr257', 'cma2p8i7s00mqy1fvrdfj4c4c', 'cma2p94go00mty1fv18jq7vtm',
  'cma2s31h90004mp01g688kgeu', 'cma2s3w55000dmp01xqbmrqmy', 'cma2s45ld000gmp01idtzedcr',
  'cma2surtm000pmp01239kkai1', 'cma2sv6gn000vmp012uh1uqnx', 'cma7st7820001pb01595e0ibs',
  'cma9eji8q000yoz0160gfgyld', 'cma8za11x006tmj01trgsu35j', 'cma8zbttw007fmj01v6ck65fd',
  'cmaagyrcq0005oz01psoxjbdu', 'cma9elndu001joz01ttnyt19j', 'cmaa0st87004bo901apy7t57n',
  'cmaa0x6yt004no901jfvfpi5p', 'cmaadpm1x000pqk01j3mg3d2p', 'cmaarrttv004bl101khy2zexd',
  'cmacristy000oqo017hji64d3', 'cmacrkqdq0010qo01xhn47cv7', 'cmaxml1kq000bju0ffqan1t6i',
  'cma7sy3wu000ipb01qi39bh5g', 'cma8zhe310088mj01mmvmtv5q', 'cma9g59gq0001pg01uwuowolp',
  'cma9g95qa0001y1ddxspus8kn', 'cmaa10htg004zo901h2snof0n', 'cma8z7xd90065mj013ynn4s4p',
  'cma8zfmjr007rmj01hwgv4x7l', 'cma8zlsm4008fmj01r4epfjk2', 'cma900hzb008wmj01ecyeyg79',
  'cma900tso0093mj01yy7puisc', 'cma904tqo00admj0116a6ia94', 'cmaadvwer0011qk01ua8s7le7',
  'cmaadwgua001dqk0179ph58ea', 'cmaadyrpg001pqk01dnuvsf8d', 'cma903bx0009pmj019v0etjm4',
  'cma904aym00a1mj01v782k9zc', 'cma9geeqi000dpg01bivfv0ob', 'cma9glxuv0001y1rs7q5pyb8y',
  'cma9gr9mc000dy1rss6efbron', 'cma9grzs8000oy1rsbcvg01gx', 'cma9gsaao0010y1rsnrs679uw',
  'cmaa376cf005bo901b01nfh5r', 'cmaa3iyjf005mo9016d0o6wf5', 'cmaa3vv4l0069o90158n3t4oo',
  'cmaadysp7001rqk01rol3kecg', 'cma7w43yh0001rs010bdw7wy5', 'cma905koo00azmj01tjsheyor',
  'cma906m5800bbmj010pev19jn', 'cma909iuh00bnmj01uvuflkiv', 'cma9xrxsu0001o9013or75s0j',
  'cma9y0equ000eo90117606sd5', 'cmaa3okmr005yo901qgl1dave', 'cmaae3xpp0032qk01nr1kr1wp',
  'cmaalbnim0001nz010yesstb0', 'cmaamjxmj0001l1018qoopu6w', 'cmaamuuho000kl101eyw9orux',
  'cmaano65g000wl1016863diej', 'cmaanonj00017l1013tk3wawk', 'cmaao2gye001wl101vdt4skv9',
  'cmaao526h0028l101wl0zk02u', 'cmaao6tpj002kl1014fz65kn5', 'cma9yhmt2000zo9013l7eugw5',
  'cmaaa70sp006lo901ay3n87j8', 'cma7waj7t0001k8015u5jmj76', 'cma7wcj5s000pk8013x6orcic',
  'cma7wdip90011k801ifm1u503', 'cma7wdxz6001dk801cunut7fu', 'cmaaa9d98006xo901y79lg9z1',
  'cma90e2d000clmj01cq315rda', 'cmaabkl5u007io901tjp83hya', 'cma7wgb4u002ek801aczezcwa',
  'cmaaeqw1j0043qk01obhvtx8f', 'cma7wht50003jk801gblezidg', 'cmaaeuekz004rqk01jfaow00k',
  'cma9yhnzc0011o901es2thlqk', 'cma9yimlx001lo901mclz35ok', 'cma99m1ax0001y1jfccuru209',
  'cmaaetkx1004fqk015k2hkbrt', 'cma9a3h460001pp01dtwsnusr', 'cmaaeuedp004pqk01xwhlwr5k',
  'cmaaexkln005dqk01ir441yju', 'cmaaey0lk005pqk01i6u1h8if', 'cmaao7jei002wl101u7p2amj6',
  'cmaao9toi0038l101ybb9r7oi', 'cmaapqdts003pl101nvxegrxo', 'cmaejh6620001r001g78j5wbk',
  'cma4rnaq80001y1pf5rw6z2gd', 'cmaeml9bo000dr001ow9sn437', 'default-weather-terms',
  // Second run - 26 additional sets
  'cma1buou5004fy1fv3uj0868h', 'cma1bxiqp004ty1fvjxnl3s33', 'cma1bvzrz004ly1fvv5jgxpgl',
  'cma1cr08b008fy1fv6xmm2tip', 'cmabasqtn0054l101by7pc2nv', 'cma9amskk000zpp012xhzpfy8',
  'cm9x5teyx0001rr014dqq8chd', 'cm9xa2hj2000pph01wfsj4z80', 'cma8heffg000imj01d5hw7ayv',
  'cmabsixz3000dqo01v84wuvdz', 'cm9ylxo350002py01gu0twt6p', 'cm9yp80jm0011le01z39rgqac',
  'cma1c2o7b005fy1fvdkz2epr8', 'cma1c36w1005hy1fvwdcrzgqg', 'cma1c40c8005ly1fvlafl6zwr',
  'cma1c4exw005ny1fvcbrfn5od', 'cm9yzemo80001p001rbvubzhr', 'cma1c6gzu005xy1fv4xqyst4a',
  'cm9z29om3000dp6014m1zo9yz', 'cm9z29obk005gy1xngwejoqk8', 'cma1cn01o007xy1fv4iax2ats',
  'cma1cvvv3009gy1fvddcbeiov', 'cm9z3aiq1006ey1xney3h5mbu', 'cm9z3b72e006qy1xnqwxb1iww',
  'cm9z3b9i1006sy1xnrfw2694t', 'cma0p0gbp0001y1ufujg23wge'
]);

async function generateMnemonicWithOpenRouter(
  thai: string,
  english: string,
  pronunciation: string
): Promise<string> {
  const prompt = `Create a memorable, creative mnemonic to help remember that "${pronunciation}" means "${english}" in Thai.

The mnemonic should:
1. Use sound associations from the pronunciation
2. Create a vivid, memorable mental image
3. Connect to the meaning naturally
4. Be concise (1-2 sentences)

For long/complex sentences, break them down into key components and provide separate mnemonics for each part using this format:
For "[English phrase]":

Remember these key parts:
• "[Thai]" → "[pronunciation]" = "[meaning]"
  → [Individual mnemonic for this part]
• "[Thai]" → "[pronunciation]" = "[meaning]"
  → [Individual mnemonic for this part]

Return ONLY the mnemonic, no explanations.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://donkeybridge.world',
        'X-Title': 'Thai Flashcards Mnemonic Generator'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content: 'You are a creative mnemonic generator for Thai language learning. Create memorable, vivid associations between Thai pronunciations and English meanings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response structure from OpenRouter');
    }
  } catch (error) {
    console.error('Error generating mnemonic with OpenRouter:', error);
    throw error;
  }
}

async function fixMnemonics() {
  try {
    console.log('Starting mnemonic fix process with OpenRouter...');
    console.log(`Skipping ${processedSets.size} already processed sets`);
    
    // Get all flashcard sets with their phrases
    const sets = await prisma.flashcardSet.findMany({
      include: { phrases: true },
      where: {
        id: {
          notIn: Array.from(processedSets)
        }
      }
    });
    
    console.log(`Found ${sets.length} sets to check`);
    
    let totalFixed = 0;
    let totalChecked = 0;
    const fixedSets: string[] = [];
    let apiCallCount = 0;
    
    for (const set of sets) {
      console.log(`\n\nChecking set: ${set.name} (${set.id})`);
      let setFixed = false;
      
      for (const phrase of set.phrases) {
        totalChecked++;
        
        // Check if mnemonic needs fixing
        if (phrase.mnemonic && phrase.pronunciation && phrase.english) {
          if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
            console.log(`\n  - Fixing mnemonic for: "${phrase.english}"`);
            console.log(`    Old mnemonic: "${phrase.mnemonic}"`);
            
            try {
              // Add rate limiting to avoid hitting OpenRouter limits
              if (apiCallCount > 0 && apiCallCount % 10 === 0) {
                console.log(`    [Rate limiting: waiting 2 seconds after ${apiCallCount} API calls...]`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              // Generate new mnemonic with OpenRouter
              const newMnemonic = await generateMnemonicWithOpenRouter(
                phrase.thai,
                phrase.english,
                phrase.pronunciation
              );
              
              apiCallCount++;
              console.log(`    New mnemonic: "${newMnemonic}"`);
              
              // Update the phrase with new mnemonic
              await prisma.phrase.update({
                where: { id: phrase.id },
                data: { mnemonic: newMnemonic }
              });
              
              totalFixed++;
              setFixed = true;
            } catch (error) {
              console.error(`    Failed to fix mnemonic for phrase ${phrase.id}:`, error);
              // Continue with next phrase instead of stopping
            }
          }
        }
      }
      
      if (setFixed) {
        fixedSets.push(set.id);
      }
      
      // Progress update every 10 sets
      if (sets.indexOf(set) > 0 && sets.indexOf(set) % 10 === 0) {
        console.log(`\n--- Progress: ${sets.indexOf(set)}/${sets.length} sets processed, ${totalFixed} mnemonics fixed so far ---`);
      }
    }
    
    console.log('\n\n===== SUMMARY =====');
    console.log(`Total phrases checked: ${totalChecked}`);
    console.log(`Total mnemonics fixed: ${totalFixed}`);
    console.log(`Sets updated: ${fixedSets.length}`);
    console.log(`API calls made: ${apiCallCount}`);
    if (fixedSets.length > 0) {
      console.log(`Updated set IDs: ${fixedSets.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error fixing mnemonics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMnemonics().catch(console.error);
