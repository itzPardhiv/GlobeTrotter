import Phaser from 'phaser';

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export const PALETTE = {
  sandstone: 0xc4a26e,
  sandstoneDark: 0x8a6e45,
  ochre: 0xd49b42,
  bronze: 0x8e5b2b,
  gold: 0xe5b842,
  jungleGreenDark: 0x142418,
  jungleGreenMid: 0x243e2a,
  jungleGreenLight: 0x487042,
  moss: 0x384c2a,
  umber: 0x241a12,
  deepDark: 0x0a0d14,
  skyDawnTop: 0x14182e,
  skyDawnMid: 0x3d3048,
  skyDawnHorizon: 0xb56338,
  skyDawnSun: 0xf2c068,
  torchOrange: 0xff6a1e,
  torchCore: 0xffe680,
  sanskritGold: 0xffdf6d,
  sunbeamBlue: 0x7eb5d6,
};

export const SANSKRIT_EPIGRAPHS: Record<string, import('./types').SanskritEpigraph> = {
  mundaka_satya: {
    id: 'mundaka_satya',
    sanskrit: '॥ सत्यमेव जयते नानृतं ॥\n॥ सत्येन पन्था विततो देवयानः ॥',
    transliteration: 'Satyameva jayate nānṛtaṁ / satyena panthā vitato devayānaḥ',
    source: 'Mundaka Upanishad 3.1.6 · Ancient Lintel Epigraph',
    translation: 'Truth alone triumphs, not falsehood. Through truth the divine path is spread out, by which the sages attain the supreme abode.',
    archaeologicalNote: 'Incised in Brahmi-Sanskrit onto the Torana archway lintel to consecrate the sacred threshold of the ruins.',
  },
  gita_karma: {
    id: 'gita_karma',
    sanskrit: '॥ कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ॥\n॥ मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration: 'Karmaṇyevādhikāraste mā phaleṣu kadācana / mā karmaphalaheturbhūrmā te saṅgo\'stvakarmaṇi',
    source: 'Bhagavad Gita 2.47 · Mandapa Wall Epigraph',
    translation: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never let the fruits of action be your motive, nor be attached to inaction.',
    archaeologicalNote: 'Carved with deep chisel strokes into the hypostyle hall threshold, reminding the seeker that dedication to truth surpasses selfish reward.',
  },
  ramayana_satya: {
    id: 'ramayana_satya',
    sanskrit: '॥ आहुः सत्यं हि परमं धर्मं धर्मविदो जनाः ॥\n॥ सत्यमाश्रित्य हि मया त्वं च धर्मं प्रचोदितः ॥',
    transliteration: 'Āhuḥ satyaṁ hi paramaṁ dharmaṁ dharmavido janāḥ / satyamāśritya hi mayā tvaṁ ca dharmaṁ pracoditaḥ',
    source: 'Valmiki Ramayana · Ayodhya Kanda 2.12.3',
    translation: 'Those who know righteousness proclaim that truth is the supreme dharma. Taking refuge in truth alone have I inspired you toward righteousness.',
    archaeologicalNote: 'Engraved onto the polished basalt tablet beside the celestial altar to guide the alignment of the Surya-Chakra dials.',
  },
};
