# LEGAL EAGLES: Rise to Partner

> *"The first rule of Fight Clause is: you do not talk about Fight Clause."*

A browser-based action RPG set inside the cursed offices of **Dewey, Cheatham & Howe LLP** — four hundred lawyers, one working printer. Fight your way from first-year associate to equity partner, unravel a forty-year billing conspiracy, and survive your midnight partnership review. Then survive the appeal.

## Play

Open `index.html` in any modern browser. No build step, no dependencies, no server.

## Gameplay

### Character Creation
Pick your attorney and a practice area at New Hire Orientation. Each practice area is a different ranged attack:

| Practice Area | Attack | Style |
|---|---|---|
| Litigation | OBJECTION! | Fast, loud, dramatic |
| Corporate M&A | Hostile Takeover | Slow, heavy, non-negotiable |
| Criminal Defense | Cross-Examination | Rapid-fire triple spread |
| Intellectual Property | Cease & Desist | Homing letters |
| Tax | Surprise Audit | Radial nova |

### Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow keys | Move |
| `Space` / `J` | Briefcase strike (melee) |
| `K` / Click | Fire (practice-area attack) — mouse fire aims at the cursor |
| `Shift` | Dash — *Motion to Expedite* (phases through projectiles) |
| `L` | Spin attack — *Motion to Strike* (also clears projectiles) |
| `E` | Talk / interact / push past |
| `M` | Mute audio |
| `F` | Fullscreen (Esc exits) |
| 🎮 Controller | Xbox/PlayStation pads work (Bluetooth or USB): sticks move & aim-fire, A talk, B strike, X fire, Y spin, LB dash, Start bag |

### Locations

| Map | Getting there |
|---|---|
| Main Office — DC&H | You work here |
| The Records Annex — Sublevel B4 | Stairs, southeast corner |
| The Parking Garage — Sublevel P3 | Freight elevator, mailroom |
| Grabbit & Runn LLP — 24th Floor | Lobby elevator *(Act II)* |
| The Courthouse — Department 13 | Firm car *(Act II)* |

### The Matters
Nine main quests across two acts, assigned by Managing Partner Hargrove. Act I: rogue paralegals, fused filing cabinets, unentered time made manifest, a hostile expert witness, and a partnership review you should not attend unprepared. Act II: the estate appeals, discovery reopens, and the whole thing ends in front of a judge with a forty-year grudge and a gavel that shockwaves.

### Side Quests
- **The Bates Stamper** — Rosa needs Dolores's emotional-support Bates stamper recovered from the annex vault. It is not emotional support. It is a cork.
- **Percussive Maintenance** — Benny's document servers need rebooting. Firmly.
- **The Sealed Envelope** — Dolores has a delivery for young Mister Worthington. SEALED.
- **Return to Sender** — escort the possessed mail cart across the office. Keep it rolling. Keep it whole.
- **The Descaling** — rebuild the coffee machine from three scavenged parts. Weaponized espresso awaits.
- **Dolores's Eleven** — the library portraits of eleven dead managing partners are wrong. Look closer. Then ask Dolores.
- **Pro Bono** — Lenny has been in the lobby since 2019. Pays nothing. Worth everything.
- **The Intranet Archive** — every workstation in both firms is readable. Nine messages were never meant to be kept. The staff knew. Read what they knew.
- **Kessler v. The Fourth Floor** *(casework)* — a client paid for a twenty-five-hour day. Gather the exhibits, then decide: settle, trial, or bury it.
- **In re GHOSTWRITER** *(casework, Act II)* — descend **The Deep Stacks** beneath the library. Something has been drafting opinions into the record since 1959. Expose it, represent it, or smash it.

### Enemies
- **Rogue Paralegal** — hoards supplies, cites "boundaries"
- **Paperwork Golem** — slow, dense, unionized
- **Billable Hour Wraith** — your unentered time, whispering *"0.1 — reviewed email re: lunch"*
- **Over-Caffeinated Intern** — fast, fragile, blameless
- **Opposing Counsel** — files frivolous motions at range
- **Decaf Gremlin** — steals your caffeine on contact
- **Associate of the Month** — Grabbit & Runn's finest. There's a wall of plaques
- **Bailiff** — tanky, sanctioned to hurt you
- **Chad Worthington IV** — depends entirely on how you treat him
- **Dr. Ima Payne** *(boss)* — hostile expert witness, $1,400/hr plus mileage
- **Worthington II, "The Grandfather"** *(boss)* — haunts the nice part of the garage
- **Thaddeus Graves III, Senior Partner Emeritus** *(boss)* — retired 1987; stopped aging 1987; bills 25 hours a day
- **The Hon. Mortimer Bane** *(final boss)* — class of 1959, holds a grudge, throws the gavel

### Progression
XP promotes you: Junior Associate → Associate → Senior Associate → Of Counsel → Junior Partner → **PARTNER**. Each promotion raises max HP (with a full heal) and damage — and banks a **development choice**: pick one of two permanent perks (dash that burns, a survivable fatal blow, +30% billables…) offered between fights. Nine promotions, ten perks — no two careers alike.

Watch for **bracketed dialogue choices** like `[AMBITION 3]` — your Ethics, Ambition, and rank unlock lines other associates can't say.

Coffee restores Billable Energy. Your dialogue choices track **Ethics** and **Ambition** — they decide which of the endings you get. Seven dusty case files from 1959–1987 are hidden across the maps; reading them unlocks things best discovered in the dark. The jury must be won. All twelve.

Assignment-board matters scale with your rank — tougher targets, bigger fees. Once Act III opens, the board also offers **DOCUMENT REVIEW**: endless production waves, paid per wave survived. And after any ending, press `N` to accept **THE MERGER** — NG+ with your gear and hours carried over, rank reset, and every opposing party fifty percent more motivated.

## Story
Something is wrong at this firm. The coffee never quite works. Everyone is always tired. The billing records go back to 1987 — and one timesheet says twenty-five hours in a single day. There's a numbered trust, a partner who never aged, a stapler-shaped hole in the mailroom's history, and a judge who has been hearing this firm's cases since before you were born. Your partnership review is at midnight, in the corner office.

Don't read old timesheets. They read back.

The floors are alive: ambient staff wander the halls muttering about the Hendricks file, panic when fighting breaks out (press `E` to poke one), and each map carries its own lighting mood — the vault, in particular, breathes.

## Technical Notes
- Single `index.html` file — all game logic, pixel sprites, maps, quests, and audio inline
- Canvas rendering; sprites are 16×16 character grids baked at load
- Music and SFX fully synthesized via Web Audio API (chiptune sequencer, per-map themes, boss theme)
- No external assets, no network requests, no data collection
