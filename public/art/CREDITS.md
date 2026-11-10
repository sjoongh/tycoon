# Art credits

## Icons (`icons96.png`)
Built by `scripts/art/build_icons_glossy.py` — sticker-style cartoon icons rendered from:
- Icons made by Lorc, Delapouite, Skoll, Carl Olsen, Caro Asercion and the "badges" set. Available on https://game-icons.net — CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/).
- Ballot icon: original vector art for this game.

## World (`world/`, `ballot.*`, `ballotbox.*`)
Generated for this game with OpenAI gpt-image (prompts and chained tier edits in `scripts/art/aigen.py` job files),
then normalized by `scripts/art/build_world_ai.py` (alpha trim, retina resize, anchors, atlas). Raw sources: `assets/art-src/ai-world/`.
Previous Kenney-based vector world (`scripts/art/build_world_vector.py`) is retained in git history only.

## UI
- Kenney UI Pack 2.0 used as structural reference (CC0, https://kenney.nl/assets/ui-pack). Panels and buttons are CSS.

## Fonts
- Jua, Do Hyeon by Woowahan Brothers — SIL OFL 1.1 (Google Fonts)
- Galmuri by Quiple — SIL OFL 1.1 (legacy, kept for the opening cards)
- Press Start 2P by CodeMan38 — SIL OFL 1.1 (legacy)
