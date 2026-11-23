# Lakbay Bataan: Castlevania Noir Chronicles, Safe Houses & Tropa Allies

An atmospheric overhaul of the Bataan 2D Gothic Action MMORPG introducing a playable home starting point with an illustrated multi-chapter story chronicle, mature Castlevania noir visuals with tall silhouettes and dynamic lighting, buyable town houses with decor upgrades, and a Bond-driven friendship system that lets allies fight beside you.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All four core design directions below were confirmed in Phase 1 clarification and are locked into this plan:

- **Confirmed Decision 1 — Starting Point & Story Intro**: New journeys begin with an illustrated **Prologue Story Intro** explaining *Ang Sumpa ng Sobre*, followed by spawning inside a playable **Starting Point (*Tahanan ni Kael* — Kael's Home)** before crossing into Balanga City Plaza.
- **Confirmed Decision 2 — Mature Visual Direction**: Upgrade all world art and sprites to **High-Detail Castlevania Noir** featuring taller, elongated gothic silhouettes, dramatic rim lighting, deep cast shadows, layered parallax ruins/mountains, and weathered masonry.
- **Confirmed Decision 3 — Buyable Houses & Decor**: Players can **buy houses across Bataan towns** that serve as safe-haven rest points (full HP/SP/Energy recovery + sanctuary buff) and feature purchasable **Decor Upgrades** yielding passive stats and visible interior customization.
- **Confirmed Decision 4 — Making Friends & Companion Allies**: Players can **befriend NPCs and fellow guild riders** via gifts, hangouts, and quests to raise their **Bond Rank (1–5)** and **summon 1 active Companion Ally** to follow and fight alongside Kael in real time.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the open-world Bataan MMORPG from an instant plaza drop-in into a cohesive narrative journey. Players awaken in Kael's homestead, witness the story of Bataan under the Curse of the Bribe Envelope, train at home, venture across 10 interconnected towns, purchase and furnish safe houses, forge deep friendships with locals and guildmates, and bring an ally into battle against corrupt bosses.
- **Target Audience**: Action-RPG and side-scrolling gothic adventure fans who enjoy character progression, Filipino cultural storytelling, housing customization, and AI companion combat.
- **Key Value**: Solves pacing, narrative grounding, and visual maturity simultaneously—giving every town deeper meaning (quest allies, real estate, and visual atmosphere) while fixing world layout alignment and readability issues.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Title Screen → Prologue Chronicle → Playable Starting Point**:
   - New players select *Start Adventure*, view a 4-beat gothic-illustrated **Story Intro** (*The Silence of Bataan*, *The Curse of the Sobre*, *Kundiman Steel*, *Dawn at Tahanan ni Kael*), and spawn in **Kael's Home (`Tahanan ni Kael`)**.
   - At home, Kael speaks with **Nanay Rosario** (Prologue Quest *Chapter 0: The Silent Chord*), practices combos/jumps on a **Kotong Straw Dummy**, rests at the family hearth, and exits through the Eastern Lantern Arch into **Balanga City Plaza**.
   - Returning players continue seamlessly from their saved zone and can revisit the Story Chronicle anytime via the Quest/Story modal.
2. **Mature Castlevania Noir World & Silhouette Upgrades**:
   - **Elongated Character Silhouettes**: Hero, NPCs, Bosses, and Companions are taller (~54–66px), with tapered gothic coats/shawls, distinct head-to-body proportions (1:6.5 instead of blocky chibi), flowing scarves/capes that trail motion, specular rim highlights, and directional moon/lantern ground shadows.
   - **Deep Noir Environments**: Multi-tier parallax skyline (blood/amber crescent moon, drifting fog banks, jagged Mt. Samat silhouettes, gothic ruins), specular rain reflections on wet cobblestones, detailed Filipino vehicles (shaded jeepneys, buses, tricycles, motorcycles with warm headlight cones), and unified high-contrast dark masonry.
   - **World Bug Fixes**: Re-align boss arena ground crests directly under boss coordinates, clean up overlapping entity nameplates, ensure readable crisp dialogue/speech banners, and guarantee safe portal landing coordinates away from enemy aggro lines.
3. **Buyable Town Houses & Decor Sanctuary**:
   - Real-estate landmarks (*Bahay na Bato* & *Capiz Villa* doors) appear in 5 major towns plus Kael's starter home.
   - Pressing `[E]` at an unowned house opens the **Property Deed** screen; owned houses open the **Safe House Sanctuary** view showing a rendered gothic room preview that updates visually as you buy **Decor Upgrades** (Capiz Chandelier, Narra Guitar Rack, Ancestral Agimat Altar, Bamboo Veranda, Harana Victrola).
   - Resting in any owned house restores 100% HP/SP/Energy/Mood and grants a **Well-Rested Sanctuary Buff** (+10% Max HP & +SP Regen for 120s). Players can also fast-recall directly to any owned house.
4. **Tropa Friendship & Companion Summoning**:
   - A dedicated **Tropa / Friends** panel (accessible via HUD button, `[G]` shortcut, or NPC *Hang Out / Give Gift* tab) tracks Bond XP and Rank (1 to 5) across 8 befriendable locals and guild allies.
   - Players raise Bond by sharing packed **Baon Food**, performing guitar duets, chatting, and liberating the friend's hometown boss.
   - Reaching **Bond Rank 2 (Ka-Tropa)** unlocks **Summon Companion**, placing that ally beside Kael on the canvas with real-time pathing, jump mirroring, combat AI attacks/heals, and rank-scaling passive buffs.

#### Visual Identity & Theme
- **Aesthetic Direction**: Mature Castlevania Noir meets Colonial Filipino Gothic (*Blasphemous* silhouette weight paired with weathered Capiz-shell warmth).
- **60-30-10 Color System**:
  - *60% Deep Noir Canvas*: Obsidian slate and midnight shadow (`#0B080C`, `#141013`).
  - *30% Structural Surfaces*: Dark mahogany panels and weathered stone trim (`#1A1417`, `#22191D`, `#5C4E41`, `#8C7A5B`).
  - *10% Focal Accents*: Crimson action highlights (`#8C1D24`), antique gold/brass (`#D6AE5E`), and warm candle/parchment text (`#EAE0C8`, `#C8BCA6`).
- **Typography & HUD Discipline**:
  - Display: `Cinzel` for chapter titles, town headers, and gothic crests (`text-wrap: balance`).
  - Body: `Plus Jakarta Sans` at 14–16px with generous contrast.
  - Numerals & Meters: `JetBrains Mono` with `tabular-nums` for HP, SP, Bond XP, Peso prices, and stats.
  - Zero static pill badges (use clean `·` typographic separators), zero pulsing status dots, single-line `whitespace-nowrap` controls, and $\ge 85\%$ unobstructed canvas playfield.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Dedicated Playable Starter Zone vs. Modal-Only Intro**:
  - *Chosen Approach*: Combine a brief skippable 4-beat **Story Chronicle Intro** with a real, walkable **Kael's Home** starting zone connected directly to Balanga.
  - *Why*: Lets players experience the narrative motivation *and* immediately test movement, jump, slash, rest, and NPC interaction in a calm gothic sanctuary before facing highway traffic and Kotong enforcers.
  - *Alternatives Considered*: Starting straight in Balanga with an unskippable text popup—rejected because it lacks a physical "starting point" and feels abrupt.
- **Decision 2 — Single Active Companion vs. Full 3-Ally Party**:
  - *Chosen Approach*: 1 active summoned **Companion Ally** at a time (swappable anytime in the Tropa panel) plus passive Bond bonuses from all friends.
  - *Why*: Keeps the 2D side-scrolling combat readable, avoids visual clutter alongside mobs and vehicles, and makes each friend feel distinct and worth leveling.
  - *Alternatives Considered*: 3 simultaneous AI followers—rejected because crowded lanes reduce Castlevania combat clarity.
- **Decision 3 — Real-Time Procedural Noir Canvas Upgrades vs. Static Image Overlays**:
  - *Chosen Approach*: Enhance the 2D Canvas rendering pipeline directly (tall articulated silhouettes, layered shading/rim-lights, volumetric parallax fog, wet cobblestone reflections, and dynamic lantern cones) while rendering house interiors procedurally inside the Sanctuary modal.
  - *Why*: Guarantees seamless 60fps animation with equipped hairstyles, shirts, umbrellas, bikes, and live decor changes without loading delays or asset mismatches.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Root Game State Machine                         │
│   TITLE_MENU ──▶ STORY_INTRO (Act 0) ──▶ PLAYING ◀──▶ PAUSED / MODALS   │
│         ▲                                   │                           │
│         └──────── localStorage Save ────────┴── Progress, Houses,       │
│                                                 Friends/Bond, Quests    │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Props + Imperative World Bridge
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌─────────────────────────────┐
│  Noir 2D Canvas   │ │   Streamlined     │ │    Gothic Modal Suite       │
│  & Render Engine  │ │   In-Game HUD     │ │                             │
│                   │ │                   │ │ • Story Chronicle & Quests  │
│ • Tall Noir       │ │ • Top-Left Vitals │ │ • Real Estate & Safe House  │
│   Silhouettes     │ │   & Sanctuary Buff│ │   (Rest + Decor Upgrades)   │
│ • Parallax Ruins  │ │ • Single-Row      │ │ • Tropa / Friends Panel     │
│   & Fog Layers    │ │   Toolbar (+Tropa │ │   (Gift Baon, Hangout,      │
│ • Kael's Home +   │ │   & Houses btns)  │ │   Summon Companion)         │
│   10 Bataan Towns │ │ • Bottom Hotbar & │ │ • Carinderia, Barber,       │
│ • Active Companion│ │   Touch Arcade Pad│ │   Talyer, Wardrobe, Map     │
│   Combat AI       │ │                   │ │                             │
└───────────────────┘ └───────────────────┘ └─────────────────────────────┘
```

#### Data Model & State
- **Starting Point & Story State**:
  - New zone identifier for Kael's Home (`kael_home`) placed before Balanga in the world graph, with a Chapter 0 Prologue Quest, Nanay Rosario NPC, Practice Dummy combat target, and `storyIntroSeen` persistence flag.
  - Enhanced `QuestDef` / Story Chapter entries with richer Act narrative summaries and character dialogue lines.
- **House Ownership & Decor Model**:
  - `HouseDef` catalog across towns (id, zoneId, name, price, architecture style, buff summary, prop coordinates in town).
  - `DecorDef` catalog (id, name, price, slot type, passive stat perk, visual preview element).
  - Persisted in player progress: `ownedHouseIds: string[]`, `homeDecorIds: string[]`, and active `sanctuaryBuffSec` timer.
- **Friendship & Companion Model**:
  - `FriendDef` catalog linking key Bataan NPCs & Guild Riders (id, name, role, homeZoneId, favoriteFoodIds, combatStyle: `duelist` | `healer` | `bard` | `aspin`, rankPerks, dialoguePerRank).
  - Persisted in player progress: `friendBonds: Record<string, number>` (Bond XP & derived Rank 1–5) and `activeCompanionId: string | null`.

#### Interactive Component & State Mapping
- **Story Intro Overlay**: Multi-beat cinematic cards with Next / Back / Skip & Begin Journey actions, synced with Web Audio guitar chords, transitioning cleanly into `PLAYING` at Kael's Home.
- **Canvas World & Companion Loop**:
  - Renders upgraded tall-silhouette figure layers (`Hero`, `NPC`, `Companion`, `Boss`, `Mob`, `Vehicles`, `Parallax`).
  - Runs Companion AI state machine (`follow` player at offset, `engage` nearest hostile mob/boss within range, execute role skill/attack/heal on cooldown, emit damage/heal floating text).
  - Updates `bossHud`, `nearestTarget` (including House doors & Practice Dummy), and safe-spawn portal collisions.
- **Safe House & Real Estate Modal**:
  - Handles Deed purchase (deducts Pesos, unlocks fast travel & town door), Decor purchase (updates live canvas-drawn room interior + derived stats), and Rest action (heals HP/SP/Energy/Mood + activates Sanctuary Buff).
- **Tropa / Friends Modal & NPC Social Tab**:
  - Filters friends by unlocked/met status, consumes packed `foodPouch` items as gifts (bonus Bond XP for favorite Filipino dishes), triggers hangout stories, and toggles active Companion summoning onto the live canvas.
