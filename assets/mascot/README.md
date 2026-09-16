# Velora mascot library

15 reusable variants from the Expressions and Actions / Usage rows of the supplied character sheet.

## Provenance and fidelity

Source: `ChatGPT Image Sep 14, 2026, 06_14_04 PM.png`.
Created with the built-in imagegen tool, one background-extraction edit per variant.
These are **AI-assisted cutouts/reconstructions, not pixel-identical crops**. Small details, hand poses, props and proportions can differ from the source.
The original user sheet and the app's existing default mascot were not modified.

- Master cutouts: `assets/mascot/originals/<variant>.png` (1254×1254, real alpha).
- Runtime assets: `public/mascot/variants/<variant>.webp` (768×768, alpha preserved).
- Preview gallery: `/mascot/index.html` on the running web app.
- Registry: `src/lib/mascot.ts`.
- Prompt intent per asset: `assets/mascot/prompt-set.json`.

## Usage

```tsx
import { Mascot, type MascotVariant } from '@/components/mascot';

<Mascot variant="thinking" className="h-40 w-40 object-contain" />
<Mascot variant="celebrating" className="h-56 w-56 object-contain" sizes="224px" />
// Existing usages still show the original default mascot:
<Mascot />
```

`LearningCompanion` also accepts the optional typed `variant` prop.
Only the selected image is loaded; the registry contains URLs, not imports for all images.
Keep `alt=""` when nearby text conveys the same message; otherwise supply a concise meaningful alt.
Use `object-contain`, not `object-cover`, so cap, props and confetti remain visible.
Typical display sizes: 96–256 CSS px, up to 384 CSS px at 2× pixel density.
These are static images: the thinking variant does not itself announce loading or create an animation.
Do not communicate errors, success or loading with the mascot alone.

## Variant guide

| Variant | Group | Suggested state |
| --- | --- | --- |
| `happy` | Ekspresi | Sapaan ringan |
| `excited` | Ekspresi | Mulai tantangan |
| `curious` | Ekspresi | Petunjuk atau pertanyaan |
| `thinking` | Ekspresi | Memproses jawaban |
| `proud` | Ekspresi | Kemajuan personal |
| `cheerful` | Ekspresi | Dukungan positif |
| `surprised` | Ekspresi | Penemuan baru |
| `winking` | Ekspresi | Konfirmasi ringan |
| `welcome` | Aksi | Onboarding |
| `learning` | Aksi | Materi belajar |
| `speaking` | Aksi | Latihan percakapan |
| `achieving` | Aksi | Pencapaian milestone |
| `daily-streak` | Aksi | Target harian tercapai |
| `exploring` | Aksi | Perjalanan belajar |
| `celebrating` | Aksi | Sesi selesai |

Most suggestions are not automatic application-state mappings. The implemented hero mappings are:

- Journey: `exploring`, switching to `achieving` when all available lessons are done.
- Progress: `proud` after any answered exercise, otherwise `welcome` for the empty state.

Other pages continue using their existing mascot choices.

## Rebuild runtime assets

```sh
node scripts/build-mascots.mjs
```

Requires the existing Next.js installation's Sharp dependency. This command only resizes and encodes the stored PNG masters; it makes no API calls and does not regenerate or retouch artwork.
It checks all 15 outputs for 768×768 dimensions, transparent pixels and near-opaque artwork (alpha ≥245; generated bodies typically use 252–254).
