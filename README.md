# LEGAL EAGLES: Rise to Partner

> *"The first rule of Fight Clause is: you do not talk about Fight Clause."*

A browser-based roguelite action RPG set inside the cursed offices of **Dewey, Cheatham & Howe LLP**. Fight your way from first-year associate to equity partner — if the billing system doesn't consume your soul first.

## Play

Open `index.html` in any modern browser. No build step, no dependencies, no servers.

## Gameplay

### Character Creation
Choose your attorney and practice area at the new hire orientation screen. Each practice area grants different stat bonuses and playstyle.

### Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow keys | Move |
| `Space` / `J` | Strike (melee) |
| `K` | Fire (ranged) |
| `L` | Spin attack |
| `E` | Talk / interact |
| `M` | Mute audio |

### Floors
Progress through four floors of the firm:

| Floor | Location |
|-------|----------|
| 1 | Main Office — Orientation, Conference Room, Break Room |
| 2 | The Records Annex — Sublevel B4 |
| 3 | The Parking Garage — Sublevel P3 |
| 4 | The Corner Office — Partnership Review |

### Enemies
Each floor escalates from grunts to bosses:

- **Paralegal** — basic melee
- **Document Golem** — slow, high HP
- **Time Wraith** — fast, ranged
- **Outside Counsel** — tactical ranged
- **Hostile Expert Witness** *(boss)* — aggressive ranged
- **Senior Partner Emeritus** *(boss)* — fast and dangerous
- **Thaddeus Graves III "The Grandfather"** *(final boss)* — been billing since 1987

### Progression
Gain XP to level up from Associate → Senior Associate → Counsel → Senior Counsel → Of Counsel → **Partner**.

Coffee machines restore Billable Energy (HP). Interact with NPCs — Rosa in the mailroom and Hargrove have lore and quest progression tied to the 1987 mystery.

## Story
Something is wrong at this firm. The billing records go back to 1987. A numbered trust. A partner who never aged. Your partnership review is at midnight, in the corner office.

## Technical Notes
- Single `index.html` file — all game logic, sprites, audio, and map data inline
- Pixel-art sprites rendered via `<canvas>` with procedural audio (Web Audio API)
- No external assets or network requests
