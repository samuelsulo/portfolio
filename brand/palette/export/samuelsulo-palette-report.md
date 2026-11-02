# Samuel Sulo palette, verification report

Status: **PASS**

## Notes

- "neon-cyan" (accent) on "mist" (light) is 1.26:1: use the accent for surfaces, icons and details there, never for text.

## Colors

| Token | Role | Name | HEX | RGB | CMYK | Total ink |
|---|---|---|---|---|---|---|
| `deep-cyan` | primary | Deep cyan | `#006D85` | 0 · 109 · 133 | 100 · 35 · 25 · 35 (recipe) | 195% |
| `void` | dark | Void | `#05060A` | 5 · 6 · 10 | 60 · 45 · 35 · 100 (recipe) | 240% |
| `neon-cyan` | accent | Neon cyan | `#35E6FF` | 53 · 230 · 255 | 70 · 0 · 8 · 0 (recipe) | 78% |
| `mist` | light | Mist | `#E6EBF3` | 230 · 235 · 243 | 8 · 4 · 2 · 0 (recipe) | 14% |
| `neon-violet` | muted | Neon violet | `#B24BF3` | 178 · 75 · 243 | 60 · 75 · 0 · 0 (recipe) | 135% |
| `neon-cyan-light` |  | Light cyan | `#7DF3FF` | 125 · 243 · 255 | 45 · 0 · 5 · 0 (recipe) | 50% |
| `neon-green` |  | Neon green | `#45F0A6` | 69 · 240 · 166 | 60 · 0 · 55 · 0 (recipe) | 115% |
| `deep-cyan-strong` |  | Deep cyan, strong | `#005568` | 0 · 85 · 104 | 100 · 40 · 30 · 50 (recipe) | 220% |
| `deep-violet` |  | Deep violet | `#7A2BC0` | 122 · 43 · 192 | 75 · 90 · 0 · 0 (recipe) | 165% |
| `deep-green` |  | Deep green | `#067650` | 6 · 118 · 80 | 85 · 20 · 75 · 25 (recipe) | 205% |
| `surface` |  | Surface | `#10131C` | 16 · 19 · 28 | 62 · 48 · 38 · 94 (recipe) | 242% |
| `snow` |  | Snow | `#E9EBF3` | 233 · 235 · 243 | 8 · 5 · 3 · 0 (recipe) | 16% |
| `slate` |  | Slate | `#A3A9BD` | 163 · 169 · 189 | 40 · 28 · 15 · 5 (recipe) | 88% |
| `graphite` |  | Graphite | `#7B8197` | 123 · 129 · 151 | 50 · 38 · 25 · 15 (recipe) | 128% |
| `ink` |  | Ink | `#0B1220` | 11 · 18 · 32 | 90 · 75 · 50 · 70 (recipe) | 285% |

## Contrast (WCAG 2.x)

Each cell is the text color in the row on the background in the column.

| text \ background | `deep-cyan` | `void` | `neon-cyan` | `mist` | `neon-violet` | `neon-cyan-light` | `neon-green` | `deep-cyan-strong` | `deep-violet` | `deep-green` | `surface` | `snow` | `slate` | `graphite` | `ink` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `deep-cyan` |  | 3.40 large text and graphics only | 3.95 large text and graphics only | 4.97 AA | 1.47 fail | 4.58 AA | 4.05 large text and graphics only | 1.41 fail | 1.20 fail | 1.05 fail | 3.12 large text and graphics only | 5.00 AA | 2.54 fail | 1.54 fail | 3.14 large text and graphics only |
| `void` | 3.40 large text and graphics only |  | 13.42 AAA | 16.92 AAA | 5.01 AA | 15.56 AAA | 13.76 AAA | 2.41 fail | 2.83 fail | 3.58 large text and graphics only | 1.09 fail | 17.01 AAA | 8.65 AAA | 5.24 AA | 1.08 fail |
| `neon-cyan` | 3.95 large text and graphics only | 13.42 AAA |  | 1.26 fail | 2.68 fail | 1.16 fail | 1.03 fail | 5.57 AA | 4.74 AA | 3.75 large text and graphics only | 12.29 AAA | 1.27 fail | 1.55 fail | 2.56 fail | 12.41 AAA |
| `mist` | 4.97 AA | 16.92 AAA | 1.26 fail |  | 3.38 large text and graphics only | 1.09 fail | 1.23 fail | 7.02 AAA | 5.98 AA | 4.72 AA | 15.50 AAA | 1.01 fail | 1.96 fail | 3.23 large text and graphics only | 15.64 AAA |
| `neon-violet` | 1.47 fail | 5.01 AA | 2.68 fail | 3.38 large text and graphics only |  | 3.11 large text and graphics only | 2.75 fail | 2.08 fail | 1.77 fail | 1.40 fail | 4.59 AA | 3.40 large text and graphics only | 1.73 fail | 1.05 fail | 4.63 AA |
| `neon-cyan-light` | 4.58 AA | 15.56 AAA | 1.16 fail | 1.09 fail | 3.11 large text and graphics only |  | 1.13 fail | 6.46 AA | 5.50 AA | 4.34 large text and graphics only | 14.26 AAA | 1.09 fail | 1.80 fail | 2.97 fail | 14.39 AAA |
| `neon-green` | 4.05 large text and graphics only | 13.76 AAA | 1.03 fail | 1.23 fail | 2.75 fail | 1.13 fail |  | 5.71 AA | 4.86 AA | 3.84 large text and graphics only | 12.60 AAA | 1.24 fail | 1.59 fail | 2.63 fail | 12.72 AAA |
| `deep-cyan-strong` | 1.41 fail | 2.41 fail | 5.57 AA | 7.02 AAA | 2.08 fail | 6.46 AA | 5.71 AA |  | 1.17 fail | 1.49 fail | 2.21 fail | 7.06 AAA | 3.59 large text and graphics only | 2.17 fail | 2.23 fail |
| `deep-violet` | 1.20 fail | 2.83 fail | 4.74 AA | 5.98 AA | 1.77 fail | 5.50 AA | 4.86 AA | 1.17 fail |  | 1.27 fail | 2.59 fail | 6.01 AA | 3.06 large text and graphics only | 1.85 fail | 2.62 fail |
| `deep-green` | 1.05 fail | 3.58 large text and graphics only | 3.75 large text and graphics only | 4.72 AA | 1.40 fail | 4.34 large text and graphics only | 3.84 large text and graphics only | 1.49 fail | 1.27 fail |  | 3.28 large text and graphics only | 4.75 AA | 2.41 fail | 1.46 fail | 3.31 large text and graphics only |
| `surface` | 3.12 large text and graphics only | 1.09 fail | 12.29 AAA | 15.50 AAA | 4.59 AA | 14.26 AAA | 12.60 AAA | 2.21 fail | 2.59 fail | 3.28 large text and graphics only |  | 15.59 AAA | 7.92 AAA | 4.80 AA | 1.01 fail |
| `snow` | 5.00 AA | 17.01 AAA | 1.27 fail | 1.01 fail | 3.40 large text and graphics only | 1.09 fail | 1.24 fail | 7.06 AAA | 6.01 AA | 4.75 AA | 15.59 AAA |  | 1.97 fail | 3.25 large text and graphics only | 15.73 AAA |
| `slate` | 2.54 fail | 8.65 AAA | 1.55 fail | 1.96 fail | 1.73 fail | 1.80 fail | 1.59 fail | 3.59 large text and graphics only | 3.06 large text and graphics only | 2.41 fail | 7.92 AAA | 1.97 fail |  | 1.65 fail | 8.00 AAA |
| `graphite` | 1.54 fail | 5.24 AA | 2.56 fail | 3.23 large text and graphics only | 1.05 fail | 2.97 fail | 2.63 fail | 2.17 fail | 1.85 fail | 1.46 fail | 4.80 AA | 3.25 large text and graphics only | 1.65 fail |  | 4.84 AA |
| `ink` | 3.14 large text and graphics only | 1.08 fail | 12.41 AAA | 15.64 AAA | 4.63 AA | 14.39 AAA | 12.72 AAA | 2.23 fail | 2.62 fail | 3.31 large text and graphics only | 1.01 fail | 15.73 AAA | 8.00 AAA | 4.84 AA |  |
