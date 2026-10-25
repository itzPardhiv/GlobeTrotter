/**
 * GlobeTrotter: The Lost Relic - Gamification & Exploration Engine
 * Implements Exploration XP, Relic Collectibles (4 categories),
 * Discovery Journal, 10 Verified Achievements, and HUD event notifications.
 */

import Phaser from 'phaser';
import { saveManager } from './SaveManager';
import { REWARD_CONFIG } from './GameplayRules';

export type RelicCategory = 'fragment' | 'record' | 'treasure' | 'clue';

export interface RelicItem {
  id: string;
  category: RelicCategory;
  name: string;
  description: string;
  location: string;
  lore?: string;
  icon?: string;
}

export interface JournalEntry {
  id: string;
  category: 'story' | 'relic' | 'inscription' | 'location' | 'puzzle' | 'secret';
  title: string;
  description: string;
  location: string;
  translation?: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const RELIC_REGISTRY: Record<string, RelicItem> = {
  relic_sun_disc_fragment: {
    id: 'relic_sun_disc_fragment',
    category: 'fragment',
    name: 'Surya-Chakra Core Relic',
    description: 'An ancient carved sandstone disc engraved with celestial solar rays. Required to open the sealed sanctum mechanism.',
    location: 'Sanctum Entrance · Varanasi Ruins',
    lore: 'Discovered near the ancient stone threshold. Its central indentation pulses faintly with astronomical energy.',
    icon: '☀️',
  },
  relic_vedic_sapphire: {
    id: 'relic_vedic_sapphire',
    category: 'treasure',
    name: 'Vedic Star Sapphire',
    description: 'A radiant cobalt gemstone polished by ancient lapidaries, preserved on a secluded vimana shrine altar.',
    location: 'Secret Elevated Vimana Alcove (Zone 4)',
    lore: 'Mentioned in temple records as an offering made during the solar eclipse ceremonies of antiquity.',
    icon: '💎',
  },
  record_gita_karma: {
    id: 'record_gita_karma',
    category: 'record',
    name: 'Rock Inscription: Karma Yoga',
    description: 'Deeply incised Brahmi-Sanskrit text on the hypostyle mandapa wall.',
    location: 'Colonnade Bay (Zone 2)',
    lore: '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥ — "You have a right to your duty, but never to the fruits thereof." (Bhagavad Gita 2.47)',
    icon: '📜',
  },
  record_satya_inscr: {
    id: 'record_satya_inscr',
    category: 'record',
    name: 'Threshold Seal: Satyam Eva Jayate',
    description: 'Monumental carved lintel scripture above the subterranean mechanism chamber.',
    location: 'Sealed Mechanism Gateway (Zone 3)',
    lore: '॥ सत्यमेव जयते नानृतम् ॥ — "Truth alone triumphs, not falsehood." (Mundaka Upanishad 3.1.6)',
    icon: '📜',
  },
  clue_surya_alignment: {
    id: 'clue_surya_alignment',
    category: 'clue',
    name: 'Solar Dial Alignment Codex',
    description: 'Astronomical quadrant engraving revealing how the subterranean mirrors channel sunlight.',
    location: 'Chamber Mechanism Alcove',
    lore: 'When the core relic engages the planetary axle, the sequential torch counterweights release.',
    icon: '🔍',
  },
  treasure_gold_urn: {
    id: 'treasure_gold_urn',
    category: 'treasure',
    name: 'Aged Bronze Temple Urn',
    description: 'Intact ceremonial vessel with lotus filigree, buried beneath fallen masonry.',
    location: 'Chasm Overlook Ledge',
    lore: 'Contained fragrant resin and ritual temple offerings from thousands of years ago.',
    icon: '🏺',
  },
  relic_ancient_map: {
    id: 'relic_ancient_map',
    category: 'clue',
    name: 'Cartography of the Sunken Sanctum',
    description: 'Weathered parchment map showing coordinates 24°18\'N 82°45\'E and the legend of 1,000,000,000 gold coins.',
    location: 'Bounty Campsite (Sequence 4)',
    lore: 'Marked with ancient celestial coordinates. Warns that the temple relic is a protective cosmic balance key, not mere gold.',
    icon: '🗺️',
  },
};

export const JOURNAL_ENTRIES: Record<string, JournalEntry> = {
  entry_bounty_target: {
    id: 'entry_bounty_target',
    category: 'story',
    title: 'The Bounty of Vikram',
    description: 'Rudhra tracked Vikram to an isolated jungle campsite. Cornered, Vikram revealed he was hunting a legend of one billion gold coins before encountering something terrifying.',
    location: 'Remote Jungle Campsite (Sequence 3)',
  },
  entry_ancient_map: {
    id: 'entry_ancient_map',
    category: 'relic',
    title: 'Coordinates of the Forgotten Sanctum',
    description: 'The recovered map marks the path across the expedition trail to an ancient subterranean temple buried for millennia.',
    location: 'Bounty Campsite (Sequence 4)',
  },
  entry_arrival: {
    id: 'entry_arrival',
    category: 'story',
    title: 'Arrival at the Sunken Threshold',
    description: 'Rudhra arrives at the ancient archaeological site outside Varanasi. The air carries the scent of damp stone and forgotten time.',
    location: 'Archaeological Entrance (Zone 1)',
  },
  entry_artifact_found: {
    id: 'entry_artifact_found',
    category: 'relic',
    title: 'The Lost Relic Fragment',
    description: 'Near the broken entrance pillars, Rudhra recovered an intricately carved solar disc relic. It aligns with monumental mechanisms deeper inside.',
    location: 'Ruins Threshold',
  },
  entry_lantern_descent: {
    id: 'entry_lantern_descent',
    category: 'location',
    title: 'Descent into Darkness',
    description: 'Stepping down ancient stone stairs, natural light gives way to pitch black subterranean halls. The handheld brass lantern reveals towering pillars and dark chasms.',
    location: 'Hypostyle Mandapa (Zone 2)',
  },
  entry_gita_karma: {
    id: 'entry_gita_karma',
    category: 'inscription',
    title: 'Inscription: The Duty of the Seeker',
    description: 'Authentic stone inscription: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन". A timeless reminder that the explorer must act with integrity without being blinded by greed.',
    location: 'Zone 2 Wall',
    translation: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
  },
  entry_mechanism_solved: {
    id: 'entry_mechanism_solved',
    category: 'puzzle',
    title: 'Awakening of the Sunken Sanctum',
    description: 'Inserting the solar relic into the monumental wall mechanism triggered sequential counterweights, lighting sanctuary torches and revealing hidden bridges.',
    location: 'Chamber Mechanism (Zone 3)',
  },
  entry_vimana_secret: {
    id: 'entry_vimana_secret',
    category: 'secret',
    title: 'The Hidden Vimana Shrine',
    description: 'Scaling precarious crumbling platforms high above the main passage, Rudhra discovered a concealed shrine housing the legendary Vedic Star Sapphire.',
    location: 'Vimana Alcove (Zone 4)',
  },
  entry_surya_vault: {
    id: 'entry_surya_vault',
    category: 'story',
    title: 'The Surya Mandala Portal',
    description: 'The monumental double gate etched with celestial dials opened, unlocking the path towards the Jungle Temple and the greater mystery of The Lost Relic.',
    location: 'Grand Surya Vault (Zone 7)',
  },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Finish the first traversal section', icon: '🧭' },
  { id: 'light_in_darkness', name: 'Light in the Darkness', description: 'Activate the first major torch mechanism', icon: '🔥' },
  { id: 'keen_observer', name: 'Keen Observer', description: 'Discover a hidden route', icon: '👁️' },
  { id: 'ancient_knowledge', name: 'Ancient Knowledge', description: 'Read a significant inscription', icon: '📜' },
  { id: 'mechanism_master', name: 'Mechanism Master', description: 'Solve the artifact mechanism', icon: '⚙️' },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Collect five optional treasures', icon: '🏺' },
  { id: 'trap_survivor', name: 'Trap Survivor', description: 'Pass a designated trap sequence', icon: '⚡' },
  { id: 'secret_seeker', name: 'Secret Seeker', description: 'Discover a secret chamber', icon: '🗝️' },
  { id: 'perfect_explorer', name: 'Perfect Explorer', description: 'Earn three stars on a level', icon: '⭐' },
  { id: 'relic_keeper', name: 'Relic Keeper', description: 'Recover all required relic fragments in a level', icon: '☀️' },
];

export class GamificationManager {
  private static instance: GamificationManager;

  public static getInstance(): GamificationManager {
    if (!this.instance) {
      this.instance = new GamificationManager();
    }
    return this.instance;
  }

  /**
   * Awards XP for a verified exploration action if not previously awarded.
   * Prevents duplicate rewards across reloads or checkpoint recovery.
   */
  public awardXP(
    scene: Phaser.Scene,
    eventId: string,
    eventType: keyof typeof REWARD_CONFIG,
    customLabel?: string,
  ): boolean {
    const amount = REWARD_CONFIG[eventType];
    const newlyAwarded = saveManager.awardXP(eventId, amount);
    if (newlyAwarded) {
      const label = customLabel || eventType.replace(/_/g, ' ');
      this.showXPToast(scene, amount, label);
    }
    return newlyAwarded;
  }

  /**
   * Collects a relic item, unlocking its journal entry and awarding XP.
   */
  public collectRelic(scene: Phaser.Scene, relicId: string): boolean {
    const relic = RELIC_REGISTRY[relicId];
    if (!relic) return false;

    const isNew = saveManager.collectRelic(relicId);
    if (isNew) {
      // Award XP
      const xpType = relic.category === 'fragment' ? 'RECOVER_RELIC' : 'SECRET_CHAMBER';
      this.awardXP(scene, `relic_${relicId}`, xpType, `${relic.name} Discovered`);

      // Unlock corresponding journal entry if exists
      if (relicId === 'relic_sun_disc_fragment') {
        this.unlockJournal(scene, 'entry_artifact_found');
        this.unlockAchievement(scene, 'relic_keeper');
      } else if (relicId === 'relic_vedic_sapphire') {
        this.unlockJournal(scene, 'entry_vimana_secret');
        this.unlockAchievement(scene, 'secret_seeker');
      }

      this.showToast(scene, `${relic.icon || '◈'} ${relic.name.toUpperCase()} RECOVERED`, 0xffd700);
    }
    return isNew;
  }

  /**
   * Inspects a Sanskrit stone inscription, unlocking lore and journal entry.
   */
  public inspectInscription(scene: Phaser.Scene, recordId: string): boolean {
    const record = RELIC_REGISTRY[recordId];
    if (!record) return false;

    saveManager.collectRelic(recordId);
    const awarded = this.awardXP(scene, `inscr_${recordId}`, 'INSPECT_INSCRIPTION', 'Ancient Inscription Decoded');

    if (recordId === 'record_gita_karma') {
      this.unlockJournal(scene, 'entry_gita_karma');
      this.unlockAchievement(scene, 'ancient_knowledge');
    } else if (recordId === 'record_satya_inscr') {
      this.unlockJournal(scene, 'entry_gita_karma');
      this.unlockAchievement(scene, 'ancient_knowledge');
    }

    return awarded;
  }

  /**
   * Unlocks an in-game discovery journal entry.
   */
  public unlockJournal(scene: Phaser.Scene, entryId: string): boolean {
    const entry = JOURNAL_ENTRIES[entryId];
    if (!entry) return false;

    const isNew = saveManager.unlockJournal(entryId);
    if (isNew) {
      this.showToast(scene, `📖 JOURNAL UPDATED · ${entry.title.toUpperCase()}`, 0x00f7ff);
    }
    return isNew;
  }

  /**
   * Unlocks an achievement with visual feedback.
   */
  public unlockAchievement(scene: Phaser.Scene, achId: string): boolean {
    const ach = ACHIEVEMENTS.find((a) => a.id === achId);
    if (!ach) return false;

    const isNew = saveManager.unlockAchievement(achId);
    if (isNew) {
      this.showAchievementBanner(scene, ach);
    }
    return isNew;
  }

  // ─── Subtle In-Game Notifications ─────────────────────────────────────────

  private showXPToast(scene: Phaser.Scene, amount: number, label: string) {
    if (!scene || !scene.add) return;
    const w = scene.scale.width;
    const toast = scene.add.text(w / 2, 110, `+${amount} XP · ${label}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#080c14',
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    scene.tweens.add({
      targets: toast,
      y: 90,
      alpha: { from: 0, to: 1 },
      duration: 300,
      hold: 1400,
      yoyo: false,
      onComplete: () => {
        scene.tweens.add({
          targets: toast,
          y: 75,
          alpha: 0,
          duration: 300,
          onComplete: () => toast.destroy(),
        });
      },
    });
  }

  private showToast(scene: Phaser.Scene, message: string, colorHex: number = 0xffd700) {
    if (!scene || !scene.add) return;
    const w = scene.scale.width;
    const toast = scene.add.text(w / 2, 135, message, {
      fontFamily: 'Cinzel, serif',
      fontSize: '14px',
      color: '#' + colorHex.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#0c111caa',
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    scene.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 250,
      hold: 2000,
      onComplete: () => {
        scene.tweens.add({
          targets: toast,
          alpha: 0,
          duration: 300,
          onComplete: () => toast.destroy(),
        });
      },
    });
  }

  private showAchievementBanner(scene: Phaser.Scene, ach: AchievementDef) {
    if (!scene || !scene.add) return;
    const w = scene.scale.width;
    const container = scene.add.container(w / 2, -60).setScrollFactor(0).setDepth(250);

    const bg = scene.add.rectangle(0, 0, 420, 56, 0x090f1a, 0.95)
      .setStrokeStyle(1.5, 0xd4af37);
    const icon = scene.add.text(-185, -2, ach.icon, { fontSize: '26px' }).setOrigin(0, 0.5);
    const tag = scene.add.text(-145, -14, 'ACHIEVEMENT UNLOCKED', {
      fontFamily: 'Cinzel, serif',
      fontSize: '11px',
      color: '#ffd700',
      letterSpacing: 2,
    });
    const title = scene.add.text(-145, 6, `${ach.name}: ${ach.description}`, {
      fontFamily: 'Rajdhani, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    });

    container.add([bg, icon, tag, title]);

    scene.tweens.add({
      targets: container,
      y: 45,
      duration: 400,
      ease: 'Back.easeOut',
      hold: 3000,
      onComplete: () => {
        scene.tweens.add({
          targets: container,
          y: -60,
          duration: 350,
          ease: 'Back.easeIn',
          onComplete: () => container.destroy(),
        });
      },
    });
  }
}

export const gamification = GamificationManager.getInstance();
