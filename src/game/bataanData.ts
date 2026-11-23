export interface MunicipalityData {
  id: string;
  name: string;
  type: 'Component City' | 'Municipality';
  district: '1st District' | '2nd District' | '3rd District';
  biome: string;
  mainRoads: string[];
  landmarks: string[];
  featuredEnemies: string[];
  barangayCount: number;
  barangays: string[];
}

export const BATAAN_HIGHWAYS = [
  'Roman Superhighway (Bataan Provincial Highway / N301)',
  'Bataan National Road (Old National Road / Death March Route)',
  'Gov. J.J. Linao National Road (Pilar–Bagac Mountain Pass)',
  'Mariveles–Bagac Coastal Road',
  'Mount Samat Road',
];

export const BATAAN_WORLD_MAP: MunicipalityData[] = [
  {
    id: 'dinalupihan',
    name: 'Dinalupihan',
    type: 'Municipality',
    district: '3rd District',
    biome: 'Northern Gateway & Upland Transit Hub',
    mainRoads: ['Roman Superhighway', 'New San Jose–Poblacion Road (Burgos St.)', 'Aquino St.', 'Roxas St.'],
    landmarks: ['Dinalupihan Town Plaza', '7-Elevate Transit Hub', 'O!Sulit Market', 'Patrol Gas Gateway'],
    featuredEnemies: ['Thief', 'Robber', 'Bully Kids', 'Rabid Hound', 'Corrupt Politicians'],
    barangayCount: 46,
    barangays: [
      'Aquino', 'Bangal', 'Bayan-bayanan', 'Bonifacio', 'Burgos',
      'Colo', 'Daang Bago', 'Dalao', 'Del Pilar', 'Gen. Luna',
      'Gomez', 'Happy Valley', 'Jose C. Payumo, Jr.', 'Kataasan', 'Layac',
      'Luacan', 'Mabini Ext.', 'Mabini Proper', 'Magsaysay', 'Maligaya',
      'Naparing', 'New San Jose', 'Old San Jose', 'Padre Dandan', 'Pag-asa',
      'Pagalanggang', 'Payangan', 'Pentor', 'Pinulot', 'Pita',
      'Rizal', 'Roosevelt', 'Roxas', 'Saguing', 'San Benito',
      'San Isidro', 'San Pablo', 'San Ramon', 'San Simon', 'Santa Isabel',
      'Santo Niño', 'Sapang Balas', 'Torres Bugauen', 'Tubo-tubo', 'Tucop',
      'Zamora',
    ],
  },
  {
    id: 'hermosa',
    name: 'Hermosa',
    type: 'Municipality',
    district: '1st District',
    biome: 'Agricultural Plains & Industrial Ecozone',
    mainRoads: ['Roman Superhighway', 'Old National Road'],
    landmarks: ['Hermosa Town Proper', 'Bataan North School', 'Patrol Gas Station'],
    featuredEnemies: ['Street Thugs', 'Giant Wasp', 'Cobra', 'Evil Pastor'],
    barangayCount: 23,
    barangays: [
      'A. Rivera', 'Almacen', 'Bacong', 'Balsic', 'Bamban',
      'Burgos-Soliman', 'Cataning', 'Culis', 'Daungan', 'Judge Roman Cruz Sr.',
      'Mabiga', 'Mabuco', 'Maite', 'Mambog-Mandama', 'Palihan',
      'Pandatung', 'Pulo', 'Saba', 'Sacrifice Valley', 'San Pedro',
      'Santo Cristo', 'Sumalo', 'Tipo',
    ],
  },
  {
    id: 'orani',
    name: 'Orani',
    type: 'Municipality',
    district: '1st District',
    biome: 'Coastal Fishing Town & Mt. Natib Foothills',
    mainRoads: ['Roman Superhighway', 'Old National Road', 'Tala Mountain Road'],
    landmarks: ['Orani Heritage Church', 'Orani Public Market', 'Mt. Natib Trailhead', 'Haunted Balete Grove'],
    featuredEnemies: ['Haunted Balete Tree', 'Tiyanak Imp', 'Shadow Aswang', 'Street Rogue', 'Corrupted Priest'],
    barangayCount: 29,
    barangays: [
      'Apollo', 'Bagong Paraiso', 'Balut', 'Bayan', 'Calero',
      'Centro I', 'Centro II', 'Dona', 'Kabalutan', 'Kaparangan',
      'Maria Fe', 'Masantol', 'Mulawin', 'Pag-asa', 'Paking-Carbonero',
      'Palihan', 'Pantalan Bago', 'Pantalan Luma', 'Parang Parang', 'Puksuan',
      'Sibul', 'Silahis', 'Tagumpay', 'Tala', 'Talimundoc',
      'Tapulao', 'Tenejero', 'Tugatog', 'Wawa',
    ],
  },
  {
    id: 'samal',
    name: 'Samal',
    type: 'Municipality',
    district: '1st District',
    biome: 'Rice Fields & Heritage Foothills',
    mainRoads: ['Roman Superhighway', 'Old National Road'],
    landmarks: ['Samal Town Plaza', 'Old Stone Church', 'Carabao Farmlands'],
    featuredEnemies: ['Cobra', 'Giant Wasp', 'White Lady Ghost', 'Rabid Hound'],
    barangayCount: 14,
    barangays: [
      'East Calaguiman', 'East Daang Bago', 'Gugo', 'Ibaba', 'Imelda',
      'Lalawigan', 'Palili', 'San Juan', 'San Roque', 'Santa Lucia',
      'Sapa', 'Tabing Ilog', 'West Calaguiman', 'West Daang Bago',
    ],
  },
  {
    id: 'abucay',
    name: 'Abucay',
    type: 'Municipality',
    district: '1st District',
    biome: 'Historic Coastal Town & Mountain Rainforest',
    mainRoads: ['Roman Superhighway', 'Old National Road'],
    landmarks: ['St. Dominic de Guzman Parish Church', 'Abucay Coastal Village', 'Mt. Natib Forest Edge'],
    featuredEnemies: ['Corrupted Priest', 'Haunted Balete Tree', 'Tiyanak Imp', 'Street Thugs'],
    barangayCount: 9,
    barangays: [
      'Bangkal', 'Calaylayan', 'Capitangan', 'Gabon', 'Laon',
      'Mabatang', 'Omboy', 'Salian', 'Wawa',
    ],
  },
  {
    id: 'balanga',
    name: 'Balanga City',
    type: 'Component City',
    district: '2nd District',
    biome: 'Provincial Capital, Colonial Plaza & Wetlands',
    mainRoads: [
      'Capitol Drive', 'Don Manuel Banzon Ave.', 'Calero St.', 'Saint Joseph St.',
      'Jose Basa St.', 'J.P. Rizal St.', 'M. delos Reyes St.', 'Lerma St.',
      'Market Road', 'Fiscal Camacho St.', 'Zulueta St.', 'M.H. Del Pilar St.',
      'Paterno St.', 'Cuaderno St.', 'Balanga Diversion Road',
    ],
    landmarks: [
      'Plaza Mayor de Ciudad de Balanga',
      'Cathedral Shrine and Parish of St. Joseph',
      'Bataan Provincial Capitol (Final Boss Dungeon)',
      'Bataan World War II Museum',
      'Balanga Wetland and Nature Park',
      '7-Elevate Downtown',
      'O!Sulit Central',
    ],
    featuredEnemies: ['Vice Mayor', 'Mayor', 'Corrupt Politicians', 'Heavy Bruiser', 'Evil Pastor', 'El Mastermind (Final Boss)'],
    barangayCount: 25,
    barangays: [
      'Bagong Silang', 'Bagumbayan', 'Cabog-Cabog', 'Camacho', 'Cataning',
      'Central', 'Cupang North', 'Cupang Proper', 'Cupang West', 'Dangcol',
      'Doña Francisca', 'Ibayo', 'Lote', 'Malabia', 'Munting Batangas',
      'Poblacion', 'Pto. Rivas Ibaba', 'Pto. Rivas Itaas', 'San Jose', 'Sibacan',
      'Talisay', 'Tanato', 'Tenejero', 'Tortugas', 'Tuyo',
    ],
  },
  {
    id: 'pilar',
    name: 'Pilar',
    type: 'Municipality',
    district: '2nd District',
    biome: 'Historic Crossroads & Shrine Highlands',
    mainRoads: ['Roman Superhighway', 'Gov. J.J. Linao National Road', 'Mount Samat Road'],
    landmarks: ['Dambana ng Kagitingan (Mt. Samat National Shrine)', 'Dunsulan Waterfalls', 'Ala-uli Crossing'],
    featuredEnemies: ['White Lady Ghost', 'Shadow Aswang', 'Cobra', 'Corrupt Politicians'],
    barangayCount: 19,
    barangays: [
      'Ala-uli', 'Bagumbayan', 'Balut I', 'Balut II', 'Bantan Munti',
      'Burgos', 'Del Rosario', 'Diwa', 'Landing', 'Liyang',
      'Nagwaling', 'Panilao', 'Pantingan', 'Poblacion', 'Rizal',
      'Santa Rosa', 'Wakas North', 'Wakas South', 'Wawa',
    ],
  },
  {
    id: 'orion',
    name: 'Orion',
    type: 'Municipality',
    district: '2nd District',
    biome: 'Coastal Port & Fishing Town',
    mainRoads: ['Roman Superhighway', 'Old National Road'],
    landmarks: ['Orion Port', 'St. Michael Parish', 'Street Food Harbor Strip'],
    featuredEnemies: ['Thief', 'Robber', 'Street Thugs', 'Street Rogue', 'Rabid Hound'],
    barangayCount: 23,
    barangays: [
      'Arellano', 'Bagumbayan', 'Balagtas', 'Balut', 'Bantan',
      'Bilolo', 'Calungusan', 'Camachile', 'Daang Bago', 'Daang Bilolo',
      'Daang Pare', 'General Lim', 'Kapunitan', 'Lati', 'Lusungan',
      'Puting Buhangin', 'Sabatan', 'San Vicente', 'Santa Elena', 'Santo Domingo',
      'Villa Angeles', 'Wakas', 'Wawa',
    ],
  },
  {
    id: 'limay',
    name: 'Limay',
    type: 'Municipality',
    district: '2nd District',
    biome: 'Heavy Industrial Zone & Mountain Creeks',
    mainRoads: ['Roman Superhighway', 'Old National Road'],
    landmarks: ['Limay Industrial Port', 'Patrol Gas Main Depot', 'Mountain Creek Trails'],
    featuredEnemies: ['Heavy Bruiser', 'Robber', 'Giant Wasp', 'Corrupt Politicians', 'Mayor'],
    barangayCount: 12,
    barangays: [
      'Alangan', 'Duale', 'Kitang 2 & Luz', 'Kitang I', 'Lamao',
      'Landing', 'Poblacion', 'Reformista', 'Saint Francis II', 'San Francisco de Asis',
      'Townsite', 'Wawa',
    ],
  },
  {
    id: 'mariveles',
    name: 'Mariveles',
    type: 'Municipality',
    district: '3rd District',
    biome: 'Freeport Hub, Rocky Coves & Mt. Mariveles Peaks',
    mainRoads: ['Roman Superhighway', 'Avenue of the Philippines', 'Mindanao Avenue', 'Mariveles–Bagac Road'],
    landmarks: [
      'Freeport Area of Bataan',
      'Death March KM 0 Marker',
      'Five Fingers Cove',
      'Laki Beach & Camaya Coast',
      'Tarak Ridge Trail & Mt. Mariveles Summit',
    ],
    featuredEnemies: ['Shadow Aswang', 'Cobra', 'Haunted Balete Tree', 'Street Thugs', 'Heavy Bruiser', 'Vice Mayor'],
    barangayCount: 18,
    barangays: [
      'Alas-asin', 'Alion', 'Balon-Anito', 'Baseco Country', 'Batangas II',
      'Biaan', 'Cabcaben', 'Camaya', 'Ipag', 'Lucanin',
      'Malaya', 'Maligaya', 'Mt. View', 'Poblacion', 'San Carlos',
      'San Isidro', 'Sisiman', 'Townsite',
    ],
  },
  {
    id: 'bagac',
    name: 'Bagac',
    type: 'Municipality',
    district: '3rd District',
    biome: 'Western Heritage Coast & Cobblestone Estates',
    mainRoads: ['Gov. J.J. Linao National Road', 'Mariveles–Bagac Road'],
    landmarks: ['Heritage Ancestral Village (Las Casas Area)', 'Western KM 0 Death March Marker', 'Bagac Beach & Pier'],
    featuredEnemies: ['White Lady Ghost', 'Tiyanak Imp', 'Corrupted Priest', 'Thief'],
    barangayCount: 14,
    barangays: [
      'Atilano L. Ricardo', 'Bagumbayan', 'Banawang', 'Binuangan', 'Binukawan',
      'Ibaba', 'Ibis', 'Pag-asa', 'Parang', 'Paysawan',
      'Quinawan', 'San Antonio', 'Saysain', 'Tabing-Ilog',
    ],
  },
  {
    id: 'morong',
    name: 'Morong',
    type: 'Municipality',
    district: '3rd District',
    biome: 'Eco-Tourism Beaches & Western Forest Hills',
    mainRoads: ['Morong–Bagac Coastal Road', 'SBMA–Morong Highway'],
    landmarks: ['Pawikan Conservation Center', 'Morong White Sand Beach', 'Haunted Forest Shrine'],
    featuredEnemies: ['Cobra', 'Shadow Aswang', 'Haunted Balete Tree', 'Giant Wasp', 'Evil Pastor'],
    barangayCount: 5,
    barangays: ['Binaritan', 'Mabayo', 'Nagbalayong', 'Poblacion', 'Sabang'],
  },
];

export type BossRole = 'VICE_MAYOR' | 'MAYOR';
export type BossGender = 'female' | 'male';

export interface BossAppearance {
  skinTone: string;
  hairStyle:
    | 'silver_bun'
    | 'wavy_shoulder'
    | 'sleek_bob'
    | 'high_ponytail'
    | 'curly_short'
    | 'bangs_chin_length'
    | 'updo_chignon'
    | 'layered_long'
    | 'pixie_cut'
    | 'braided_crown'
    | 'bearded_slick'
    | 'bald_crown'
    | 'gray_side_part'
    | 'neat_combed'
    | 'slicked_back_gel'
    | 'pompadour'
    | 'crew_cut'
    | 'receding_waves'
    | 'curly_afro_fade'
    | 'thick_swept'
    | 'buzz_cut'
    | 'white_parted';
  hairColor: string;
  facialFeature: string;
  outfit: string;
  outfitColor: string;
  prop: string;
  build: 'slim' | 'average' | 'heavy';
  ageGroup: 'young' | 'middle' | 'senior';
}

export interface BossProfile {
  id: string;
  title: string;
  name: string;
  gender: BossGender;
  hp: number;
  dropId: string;
  dropName: string;
  appearance: BossAppearance;
}

export interface TownBossConfig {
  townId: string;
  townName: string;
  viceMayor: BossProfile;
  mayor: BossProfile;
}

export interface BossProgressionState {
  defeatedBossIds: string[];
  collectedDrops: string[];
  hasMetElMastermind: boolean;
  elMastermindDefeated: boolean;
}

export interface AttackMastermindResult {
  triggeredInstantDeath: boolean;
  startTrueBossFight: boolean;
  damageDealtToPlayer: number;
  damageDealtToBoss: number;
  screenEffect: 'RED_EYEPATCH_FLASH' | 'SHIELD_SHATTER';
  dialogue: string;
}

// 12 Towns × 2 Bosses = 24 Unique Female & Male Town Bosses (100% Fictional Characters)
export const BATAAN_TOWN_BOSSES: TownBossConfig[] = [
  {
    townId: 'dinalupihan',
    townName: 'Dinalupihan',
    viceMayor: {
      id: 'vm_dinalupihan',
      title: 'Vice Mayora',
      name: 'Vice Mayora Carla Mendoza',
      gender: 'female',
      hp: 300,
      dropId: 'drop_vm_dinalupihan',
      dropName: 'Dinalupihan Ghost-Road Ledger',
      appearance: {
        skinTone: '#E0AC82',
        hairStyle: 'high_ponytail',
        hairColor: '#1F1B1A',
        facialFeature: 'dark_sunglasses_and_smirk',
        outfit: 'tailored_purple_blazer',
        outfitColor: '#6B3FA0',
        prop: 'silver_briefcase',
        build: 'slim',
        ageGroup: 'young',
      },
    },
    mayor: {
      id: 'mayor_dinalupihan',
      title: 'Mayor',
      name: 'Mayor Arturo Balboa',
      gender: 'male',
      hp: 500,
      dropId: 'drop_mayor_dinalupihan',
      dropName: 'Dinalupihan Corrupt Seal',
      appearance: {
        skinTone: '#C68B59',
        hairStyle: 'bearded_slick',
        hairColor: '#2B2625',
        facialFeature: 'trimmed_beard_and_cigar_grin',
        outfit: 'barong_with_navy_jacket',
        outfitColor: '#1E3A5F',
        prop: 'wooden_gavel',
        build: 'average',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'hermosa',
    townName: 'Hermosa',
    viceMayor: {
      id: 'vm_hermosa',
      title: 'Vice Mayor',
      name: 'Vice Mayor Dante Soriano',
      gender: 'male',
      hp: 340,
      dropId: 'drop_vm_hermosa',
      dropName: 'Hermosa Kickback Ledger',
      appearance: {
        skinTone: '#D9A377',
        hairStyle: 'neat_combed',
        hairColor: '#1C1C1C',
        facialFeature: 'thick_square_glasses_and_sweatdrop',
        outfit: 'white_polo_barong',
        outfitColor: '#F2EFE9',
        prop: 'thick_accounting_ledger',
        build: 'slim',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_hermosa',
      title: 'Mayora',
      name: 'Mayora Doña Remedios Navarro',
      gender: 'female',
      hp: 540,
      dropId: 'drop_mayor_hermosa',
      dropName: 'Hermosa Corrupt Seal',
      appearance: {
        skinTone: '#E4B894',
        hairStyle: 'silver_bun',
        hairColor: '#BDBDBD',
        facialFeature: 'stern_frown_and_pearl_earrings',
        outfit: 'cream_filipiniana_terno',
        outfitColor: '#F5E6C8',
        prop: 'gold_folding_fan',
        build: 'average',
        ageGroup: 'senior',
      },
    },
  },
  {
    townId: 'orani',
    townName: 'Orani',
    viceMayor: {
      id: 'vm_orani',
      title: 'Vice Mayora',
      name: 'Vice Mayora Evelyn Ramos',
      gender: 'female',
      hp: 380,
      dropId: 'drop_vm_orani',
      dropName: 'Orani Fishport Bribe Ledger',
      appearance: {
        skinTone: '#C99266',
        hairStyle: 'curly_short',
        hairColor: '#3D2B22',
        facialFeature: 'gold_hoop_earrings_and_arched_brows',
        outfit: 'teal_office_blazer',
        outfitColor: '#1F7A7A',
        prop: 'tax_clipboard',
        build: 'average',
        ageGroup: 'senior',
      },
    },
    mayor: {
      id: 'mayor_orani',
      title: 'Mayor',
      name: 'Mayor Gregorio Macapagal-Cruz',
      gender: 'male',
      hp: 580,
      dropId: 'drop_mayor_orani',
      dropName: 'Orani Corrupt Seal',
      appearance: {
        skinTone: '#B87E50',
        hairStyle: 'bald_crown',
        hairColor: '#3A3A3A',
        facialFeature: 'thick_bushy_eyebrows_and_gold_ring',
        outfit: 'embroidered_beige_barong',
        outfitColor: '#E5D3B3',
        prop: 'bundled_cash_stacks',
        build: 'heavy',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'samal',
    townName: 'Samal',
    viceMayor: {
      id: 'vm_samal',
      title: 'Vice Mayor',
      name: 'Vice Mayor Marco Villanueva',
      gender: 'male',
      hp: 420,
      dropId: 'drop_vm_samal',
      dropName: 'Samal Farm-Fund Ledger',
      appearance: {
        skinTone: '#D49B6E',
        hairStyle: 'slicked_back_gel',
        hairColor: '#141414',
        facialFeature: 'sharp_goatee_and_cocky_smile',
        outfit: 'patterned_brown_barong',
        outfitColor: '#9E744B',
        prop: 'gold_smartphone',
        build: 'slim',
        ageGroup: 'young',
      },
    },
    mayor: {
      id: 'mayor_samal',
      title: 'Mayora',
      name: 'Mayora Veronica Delos Santos',
      gender: 'female',
      hp: 620,
      dropId: 'drop_mayor_samal',
      dropName: 'Samal Corrupt Seal',
      appearance: {
        skinTone: '#E6B996',
        hairStyle: 'wavy_shoulder',
        hairColor: '#4A2C20',
        facialFeature: 'cat_eye_glasses_and_red_lipstick',
        outfit: 'maroon_power_suit',
        outfitColor: '#7A1F2B',
        prop: 'designer_handbag',
        build: 'average',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'abucay',
    townName: 'Abucay',
    viceMayor: {
      id: 'vm_abucay',
      title: 'Vice Mayora',
      name: 'Vice Mayora Teresita Pangilinan',
      gender: 'female',
      hp: 460,
      dropId: 'drop_vm_abucay',
      dropName: 'Abucay Heritage-Tax Ledger',
      appearance: {
        skinTone: '#D7A27A',
        hairStyle: 'bangs_chin_length',
        hairColor: '#2C221E',
        facialFeature: 'round_spectacles_and_rosy_cheeks',
        outfit: 'mustard_modern_filipiniana',
        outfitColor: '#D4A024',
        prop: 'velvet_money_pouch',
        build: 'heavy',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_abucay',
      title: 'Mayora',
      name: 'Mayora Bianca Alcantara',
      gender: 'female',
      hp: 660,
      dropId: 'drop_mayor_abucay',
      dropName: 'Abucay Corrupt Seal',
      appearance: {
        skinTone: '#DFB08A',
        hairStyle: 'sleek_bob',
        hairColor: '#181818',
        facialFeature: 'beauty_mark_and_cold_stare',
        outfit: 'emerald_filipiniana_blouse',
        outfitColor: '#1D6F42',
        prop: 'brass_town_seal',
        build: 'slim',
        ageGroup: 'young',
      },
    },
  },
  {
    townId: 'balanga',
    townName: 'Balanga City',
    viceMayor: {
      id: 'vm_balanga',
      title: 'Vice Mayor',
      name: 'Vice Mayor Hector Valderama',
      gender: 'male',
      hp: 650,
      dropId: 'drop_vm_balanga',
      dropName: 'Balanga City Budget Ledger',
      appearance: {
        skinTone: '#C88E62',
        hairStyle: 'pompadour',
        hairColor: '#2E2E30',
        facialFeature: 'eyebrow_scar_and_scowl',
        outfit: 'charcoal_executive_vest',
        outfitColor: '#333842',
        prop: 'vault_keyring_and_scroll',
        build: 'average',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_balanga',
      title: 'Mayora',
      name: 'Mayora Isabella Montemayor',
      gender: 'female',
      hp: 900,
      dropId: 'drop_mayor_balanga',
      dropName: 'Balanga City Corrupt Seal',
      appearance: {
        skinTone: '#E8BE9E',
        hairStyle: 'updo_chignon',
        hairColor: '#261B16',
        facialFeature: 'diamond_studs_and_imperial_glare',
        outfit: 'royal_blue_terno_blazer',
        outfitColor: '#1C3F7A',
        prop: 'golden_scepter_pen',
        build: 'average',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'pilar',
    townName: 'Pilar',
    viceMayor: {
      id: 'vm_pilar',
      title: 'Vice Mayor',
      name: 'Vice Mayor Ramonito Fajardo',
      gender: 'male',
      hp: 500,
      dropId: 'drop_vm_pilar',
      dropName: 'Pilar Highway-Toll Ledger',
      appearance: {
        skinTone: '#BA8052',
        hairStyle: 'crew_cut',
        hairColor: '#202020',
        facialFeature: 'handlebar_mustache_and_aviators',
        outfit: 'khaki_field_barong',
        outfitColor: '#B8A47E',
        prop: 'steel_toll_box',
        build: 'heavy',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_pilar',
      title: 'Mayor',
      name: 'Mayor Don Esteban Salcedo',
      gender: 'male',
      hp: 700,
      dropId: 'drop_mayor_pilar',
      dropName: 'Pilar Corrupt Seal',
      appearance: {
        skinTone: '#D3A17B',
        hairStyle: 'gray_side_part',
        hairColor: '#9E9E9E',
        facialFeature: 'thin_pencil_mustache_and_wire_glasses',
        outfit: 'slate_gray_three_piece_suit',
        outfitColor: '#5C636E',
        prop: 'silver_tipped_cane',
        build: 'slim',
        ageGroup: 'senior',
      },
    },
  },
  {
    townId: 'orion',
    townName: 'Orion',
    viceMayor: {
      id: 'vm_orion',
      title: 'Vice Mayora',
      name: 'Vice Mayora Marisol Evangelista',
      gender: 'female',
      hp: 520,
      dropId: 'drop_vm_orion',
      dropName: 'Orion Pier-Smuggling Ledger',
      appearance: {
        skinTone: '#D2986B',
        hairStyle: 'layered_long',
        hairColor: '#5E3A24',
        facialFeature: 'winged_eyeliner_and_gold_pendant',
        outfit: 'coral_blazer_and_slacks',
        outfitColor: '#C85A4A',
        prop: 'shipping_manifest_folder',
        build: 'slim',
        ageGroup: 'young',
      },
    },
    mayor: {
      id: 'mayor_orion',
      title: 'Mayor',
      name: 'Mayor Eduardo Castillo',
      gender: 'male',
      hp: 740,
      dropId: 'drop_mayor_orion',
      dropName: 'Orion Corrupt Seal',
      appearance: {
        skinTone: '#B67C4E',
        hairStyle: 'receding_waves',
        hairColor: '#4A4644',
        facialFeature: 'heavy_jowls_and_gold_watch',
        outfit: 'ivory_long_barong',
        outfitColor: '#EFE6D5',
        prop: 'bribe_envelope_fan',
        build: 'heavy',
        ageGroup: 'senior',
      },
    },
  },
  {
    townId: 'limay',
    townName: 'Limay',
    viceMayor: {
      id: 'vm_limay',
      title: 'Vice Mayor',
      name: 'Vice Mayor Jonas Mercado',
      gender: 'male',
      hp: 560,
      dropId: 'drop_vm_limay',
      dropName: 'Limay Industrial-Permit Ledger',
      appearance: {
        skinTone: '#C2895B',
        hairStyle: 'buzz_cut',
        hairColor: '#1A1A1A',
        facialFeature: 'square_jaw_and_tinted_glasses',
        outfit: 'dark_olive_barong_jacket',
        outfitColor: '#43523D',
        prop: 'hard_hat_and_contract',
        build: 'heavy',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_limay',
      title: 'Mayora',
      name: 'Mayora Dra. Clarissa Bautista',
      gender: 'female',
      hp: 780,
      dropId: 'drop_mayor_limay',
      dropName: 'Limay Corrupt Seal',
      appearance: {
        skinTone: '#E2B28E',
        hairStyle: 'pixie_cut',
        hairColor: '#2A2424',
        facialFeature: 'frameless_glasses_and_sharp_smirk',
        outfit: 'crimson_corporate_suit',
        outfitColor: '#9A2430',
        prop: 'sealed_permit_stamp',
        build: 'slim',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'mariveles',
    townName: 'Mariveles',
    viceMayor: {
      id: 'vm_mariveles',
      title: 'Vice Mayora',
      name: 'Vice Mayora Katrina Tolentino',
      gender: 'female',
      hp: 600,
      dropId: 'drop_vm_mariveles',
      dropName: 'Mariveles Freeport-Vault Ledger',
      appearance: {
        skinTone: '#D9A074',
        hairStyle: 'braided_crown',
        hairColor: '#231B18',
        facialFeature: 'sharp_cheekbones_and_pearl_brooch',
        outfit: 'navy_filipiniana_jacket',
        outfitColor: '#23395B',
        prop: 'encrypted_tablet',
        build: 'average',
        ageGroup: 'young',
      },
    },
    mayor: {
      id: 'mayor_mariveles',
      title: 'Mayor',
      name: 'Mayor Victoriano Laurel-Diaz',
      gender: 'male',
      hp: 840,
      dropId: 'drop_mayor_mariveles',
      dropName: 'Mariveles Corrupt Seal',
      appearance: {
        skinTone: '#BD8255',
        hairStyle: 'thick_swept',
        hairColor: '#333336',
        facialFeature: 'salt_and_pepper_stubble_and_cigar',
        outfit: 'black_trimmed_barong',
        outfitColor: '#2C2E33',
        prop: 'brass_freeport_key',
        build: 'average',
        ageGroup: 'middle',
      },
    },
  },
  {
    townId: 'bagac',
    townName: 'Bagac',
    viceMayor: {
      id: 'vm_bagac',
      title: 'Vice Mayor',
      name: 'Vice Mayor Lorenzo Corpuz',
      gender: 'male',
      hp: 540,
      dropId: 'drop_vm_bagac',
      dropName: 'Bagac Coastal-Land Ledger',
      appearance: {
        skinTone: '#C98D5F',
        hairStyle: 'curly_afro_fade',
        hairColor: '#241D1A',
        facialFeature: 'dimpled_grin_and_gold_chain',
        outfit: 'cream_short_sleeve_barong',
        outfitColor: '#EDE0C8',
        prop: 'rolled_land_title',
        build: 'average',
        ageGroup: 'young',
      },
    },
    mayor: {
      id: 'mayor_bagac',
      title: 'Mayora',
      name: 'Mayora Doña Consuelo Legaspi',
      gender: 'female',
      hp: 760,
      dropId: 'drop_mayor_bagac',
      dropName: 'Bagac Corrupt Seal',
      appearance: {
        skinTone: '#E3B693',
        hairStyle: 'silver_bun',
        hairColor: '#CFCFCF',
        facialFeature: 'lorgnette_glasses_and_lace_shawl',
        outfit: 'gold_embroidered_terno',
        outfitColor: '#C59B38',
        prop: 'antique_cash_box',
        build: 'average',
        ageGroup: 'senior',
      },
    },
  },
  {
    townId: 'morong',
    townName: 'Morong',
    viceMayor: {
      id: 'vm_morong',
      title: 'Vice Mayora',
      name: 'Vice Mayora Lorna Sarmiento',
      gender: 'female',
      hp: 520,
      dropId: 'drop_vm_morong',
      dropName: 'Morong Eco-Fund Ledger',
      appearance: {
        skinTone: '#CE9367',
        hairStyle: 'sleek_bob',
        hairColor: '#422C20',
        facialFeature: 'oversized_shades_and_scowl',
        outfit: 'turquoise_resort_blazer',
        outfitColor: '#2A8F8E',
        prop: 'bribe_satchel',
        build: 'average',
        ageGroup: 'middle',
      },
    },
    mayor: {
      id: 'mayor_morong',
      title: 'Mayor',
      name: 'Mayor Rodolfo Quizon-Reyes',
      gender: 'male',
      hp: 720,
      dropId: 'drop_mayor_morong',
      dropName: 'Morong Corrupt Seal',
      appearance: {
        skinTone: '#BF8658',
        hairStyle: 'white_parted',
        hairColor: '#DFDFDF',
        facialFeature: 'bushy_white_mustache_and_laugh_lines',
        outfit: 'linen_barong_and_tan_vest',
        outfitColor: '#B38E5D',
        prop: 'carved_walking_stick',
        build: 'heavy',
        ageGroup: 'senior',
      },
    },
  },
];

export const ALL_REQUIRED_BOSS_DROPS: string[] = BATAAN_TOWN_BOSSES.flatMap((t) => [
  t.viceMayor.dropId,
  t.mayor.dropId,
]);

export const INITIAL_BOSS_STATE: BossProgressionState = {
  defeatedBossIds: [],
  collectedDrops: [],
  hasMetElMastermind: false,
  elMastermindDefeated: false,
};

export function getFinalBossProgress(state: BossProgressionState) {
  const collected = ALL_REQUIRED_BOSS_DROPS.filter((id) => state.collectedDrops.includes(id)).length;
  const total = ALL_REQUIRED_BOSS_DROPS.length;

  return {
    collected,
    total,
    isUnlocked: collected >= total,
  };
}

export function handleTownBossDefeated(
  state: BossProgressionState,
  townId: string,
  role: BossRole
): {
  nextState: BossProgressionState;
  droppedItemName: string;
  defeatedName: string;
  justUnlockedFinalBoss: boolean;
} {
  const town = BATAAN_TOWN_BOSSES.find((t) => t.townId === townId);
  if (!town) {
    throw new Error(`Unknown townId: ${townId}`);
  }

  const boss = role === 'MAYOR' ? town.mayor : town.viceMayor;
  const wasUnlocked = getFinalBossProgress(state).isUnlocked;

  const defeatedBossIds = state.defeatedBossIds.includes(boss.id)
    ? state.defeatedBossIds
    : [...state.defeatedBossIds, boss.id];

  const collectedDrops = state.collectedDrops.includes(boss.dropId)
    ? state.collectedDrops
    : [...state.collectedDrops, boss.dropId];

  const nextState: BossProgressionState = {
    ...state,
    defeatedBossIds,
    collectedDrops,
  };

  const nowUnlocked = getFinalBossProgress(nextState).isUnlocked;

  return {
    nextState,
    droppedItemName: boss.dropName,
    defeatedName: boss.name,
    justUnlockedFinalBoss: !wasUnlocked && nowUnlocked,
  };
}

export function handleAttackElMastermind(
  state: BossProgressionState,
  playerAttackDamage: number
): AttackMastermindResult {
  const { collected, total, isUnlocked } = getFinalBossProgress(state);

  if (!isUnlocked) {
    return {
      triggeredInstantDeath: true,
      startTrueBossFight: false,
      damageDealtToPlayer: 999999,
      damageDealtToBoss: 0,
      screenEffect: 'RED_EYEPATCH_FLASH',
      dialogue: `EL MASTERMIND: "Foolish kid! You only hold ${collected} of ${total} evidence files. You cannot lay a scratch on me while my Mayors and Vice Mayors still rule Bataan!"`,
    };
  }

  return {
    triggeredInstantDeath: false,
    startTrueBossFight: true,
    damageDealtToPlayer: 0,
    damageDealtToBoss: playerAttackDamage,
    screenEffect: 'SHIELD_SHATTER',
    dialogue: `EL MASTERMIND: "Impossible! You gathered all ${total} evidence files across Bataan?! Fine—if you want a real fight, I will crush you myself!"`,
  };
}

export function getMunicipalityById(id: string): MunicipalityData | undefined {
  return BATAAN_WORLD_MAP.find((m) => m.id === id);
}

export function getTownBossConfig(townId: string): TownBossConfig | undefined {
  return BATAAN_TOWN_BOSSES.find((t) => t.townId === townId);
}

export function getScaledBossHp(baseHp: number, playerLevel: number, townOrder: number): number {
  const townMult = 1 + Math.max(0, townOrder - 1) * 0.16;
  const levelMult = 1 + Math.max(0, playerLevel - 1) * 0.14;
  return Math.round(baseHp * 3.0 * townMult * levelMult);
}

export function getBossQuote(boss: BossProfile, townName: string): string {
  const isFemale = boss.gender === 'female';
  const honorific = boss.title;
  if (honorific.includes('Vice')) {
    return isFemale
      ? `I am ${boss.name} of ${townName}! Nobody peeks into my budget ledger and walks away!`
      : `Hey Defender! I am ${boss.name}! Pay your street permit before stepping into ${townName}!`;
  }
  return isFemale
    ? `How dare you stand before ${boss.name}! ${townName} belongs to me and El Mastermind!`
    : `Hahaha! ${boss.name} is the law in ${townName}! You will never take my Corrupt Seal!`;
}
