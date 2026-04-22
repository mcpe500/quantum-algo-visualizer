# SPEC 001: Formula Studio - Quantum Algorithm Formula Visualization

## Status: PHASE 0 COMPLETE + CRITIC REVIEW PASSED

**Tanggal:** 2026-04-23
**Author:** Claude Code (Fleet Swarm)
**Project:** quantum-algo-visualizer
**Version:** 1.1 (post-review fixes)

---

## 1. Concept & Vision

Formula Studio adalah halaman baru di quantum-algo-visualizer yang menyediakan visualisasi interaktif untuk semua rumus matematika dari skripsi TA. Berbeda dengan pendekatan embed rumus di setiap page algoritma, Formula Studio menggunakan pola STUDIO - halaman mandiri dengan 3 tab (Explore, Studio, Stories) yang memungkinkan eksplorasi, penulisan persamaan, dan navigasi naratif melalui hubungan antar rumus.

Tujuan: membantu pembaca skripsi memahami latar belakang matematika dari 4 algoritma (Deutsch-Jozsa, QFT, VQE, QAOA) dengan visualisasi interaktif yang bisa di-screenshot untuk dokumen TA.

---

## 2. Design Language

### Aesthetic Direction
Dark theme studio aesthetic - gelap, profesional, cocok untuk konten akademik. Menggunakan warna cyan/amber sebagai aksen untuk membedakan kategori rumus.

### Color Palette
- **Background:** slate-900 (#0f172a), slate-800 (#1e293b)
- **Text:** slate-100 (#f1f5f9), slate-300 (#cbd5e1), slate-400 (#94a3b8)
- **Category Accents:**
  - Gates: amber-500 (#f59e0b)
  - QFT/FFT: purple-500 (#a855f7)
  - VQE: green-500 (#22c55e)
  - QAOA: orange-500 (#f97316)
  - DJ: blue-500 (#3b82f6)
  - Basics: cyan-500 (#06b6d4)
  - Complexity: violet-500 (#8b5cf6)

### Typography
- **Headers:** Inter, font-weight 600-700
- **Body:** Inter, font-weight 400
- **Formulas:** KaTeX default fonts (KaTeX_Main, KaTeX_Math, KaTeX_AMS)
- **Code/Tags:** JetBrains Mono / monospace

### Spatial System
- 8px grid system
- Padding standard: 16px, 24px
- Card radius: 8px (rounded-lg)
- Border width: 1px

### Motion Philosophy
- Transitions: 200ms ease for hover states
- Category accordion: 150ms expand/collapse
- No animation on formula render (KaTeX is synchronous)

---

## 3. Layout & Structure

### Page Structure
```
┌──────────────────────────────────────────────────────────┐
│ HEADER: Logo + "Formula Studio" + Tab Switcher            │
├──────────────────────────────────────────────────────────┤
│ CONTENT (3 tabs):                                        │
│                                                          │
│ [Explore Tab]                                            │
│ ┌────────────┬──────────────────────┬────────────────┐  │
│ │ Category   │ Formula Grid         │ Detail Panel   │  │
│ │ Tree       │ (cards)              │ (selected)     │  │
│ │ (200px)    │                      │ (40%)          │  │
│ └────────────┴──────────────────────┴────────────────┘  │
│                                                          │
│ [Studio Tab] - Placeholder (Coming Soon)                │
│ [Stories Tab] - Placeholder (Coming Soon)              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Responsive Strategy
- Desktop-first (minimum 1024px viewport assumed)
- Sidebar collapses on smaller screens (optional enhancement)
- Grid columns: 1-4 based on viewport width

---

## 4. Features & Interactions

### Phase 0 - COMPLETE

#### 4.1 Formula Display (KaTeX)
- LaTeX rendering via `katex` library
- Two modes: inline (FormulaDisplayMini) and display (FormulaDisplay)
- Dark theme optimized (light text on dark bg)
- Error handling: `throwOnError: false` for malformed LaTeX

#### 4.2 Formula Registry
- 42 formulas across 8 categories
- Each formula has: id, latex, title, category, tags, chapter[], description, variables[], relatedFormulas[]
- Bilingual tags (Indonesian + English) for search
- Cross-references between related formulas

#### 4.3 Explore Tab
- **Search Bar:** Fuzzy search via fuse.js with synonym expansion
  - Synonyms: 'keadaan' = 'state', 'gerbang' = 'gate', etc.
  - Searches: title, tags, latex content
  - Debounced 200ms, shows top 10 results
- **Category Tree:** Accordion sidebar with category counts
  - 8 categories: Basics, Gates, DJ, QFT, VQE, QAOA, SA, Complexity
  - Single-select filtering
- **Formula Grid:** Card grid with category-colored borders
  - Shows title, mini LaTeX preview, chapter badges, tags
  - Click to select
- **Detail Panel:** Right sidebar showing:
  - Full LaTeX render (display mode)
  - Variable definitions
  - Description (Indonesian)
  - Related formulas (clickable navigation)
  - Chapter references
  - Actions: Screenshot (html-to-image), Copy LaTeX, Step-by-Step (placeholder)

#### 4.4 Screenshot Support
- Uses `html-to-image` (not html2canvas) for better KaTeX font compatibility
- Exports as PNG with 2x pixel ratio for quality
- Downloads as `{formula-id}-formula.png`

### Phase 2-4 - TODO (Studio, Stories, Step-by-Step)

#### 4.5 Studio Tab (Planned)
- Drag-drop canvas for formula nodes
- SVG connection lines between related formulas
- Connection labels: "quantum version of", "implements", etc.
- Canvas toolbar: Clear, Auto-layout, Screenshot

#### 4.6 Stories Tab (Planned)
- Pre-built narratives: DJ Story, QFT Story, VQE Story, QAOA Story, Gate Story
- Timeline component showing formula sequence
- Play button for auto-advance
- Connecting text explaining transitions

#### 4.7 Step-by-Step Computation (Planned)
- VQE energy: Σ cₗ⟨Pₗ⟩ step-by-step
- DFT sum: Σ x[j]·e^(-2πijk/N) step-by-step
- Gate matrix multiplication visualization
- Max-Cut cost computation
- SA acceptance probability curve

---

## 5. Component Inventory

### Core Components (COMPLETE)

| Component | File | Description |
|-----------|------|-------------|
| `FormulaStudioPage` | `FormulaStudioPage.tsx` | Main page with tab navigation |
| `FormulaExplorer` | `explore/FormulaExplorer.tsx` | Explore tab layout |
| `FormulaSearchBar` | `explore/FormulaSearchBar.tsx` | Smart fuzzy search |
| `FormulaCategoryTree` | `explore/FormulaCategoryTree.tsx` | Category accordion sidebar |
| `FormulaGridCard` | `explore/FormulaGridCard.tsx` | Formula preview card |
| `FormulaDetailPanel` | `shared/FormulaDetailPanel.tsx` | Selected formula detail view |
| `FormulaDisplay` | `shared/FormulaDisplay.tsx` | Full KaTeX renderer |
| `FormulaDisplayMini` | `shared/FormulaDisplayMini.tsx` | Mini KaTeX preview |
| `types` | `types.ts` | TypeScript interfaces |
| `registry` | `registry.ts` | 42 formula definitions |

### Planned Components

| Component | File | Description |
|-----------|------|-------------|
| `FormulaStudioCanvas` | `studio/FormulaStudioCanvas.tsx` | Drag-drop canvas |
| `FormulaNode` | `studio/FormulaNode.tsx` | Draggable formula card |
| `ConnectionLine` | `studio/ConnectionLine.tsx` | SVG bezier connection |
| `CanvasToolbar` | `studio/CanvasToolbar.tsx` | Canvas controls |
| `FormulaStories` | `stories/FormulaStories.tsx` | Stories tab layout |
| `StoryTimeline` | `stories/StoryTimeline.tsx` | Timeline component |
| `narratives` | `stories/narratives.ts` | Pre-built story data |
| `FormulaStepper` | `shared/FormulaStepper.tsx` | Step-by-step modal |

---

## 6. Technical Approach

### Stack
- **Framework:** React 19 + TypeScript
- **Build:** Vite + tsc
- **Styling:** Tailwind CSS (existing project pattern)
- **Math Rendering:** KaTeX 0.16.45
- **Screenshot:** html-to-image 1.11.13
- **Search:** fuse.js 7.3.0
- **Drag-Drop:** @dnd-kit/core 6.3.1 + @dnd-kit/sortable 10.0.0 (for future)

### Key Files
```
frontend/src/
├── App.tsx                           # Route: /formulas
└── components/formula-studio/
    ├── FormulaStudioPage.tsx         # Main page
    ├── types.ts                      # Type definitions
    ├── registry.ts                   # 42 formula definitions
    ├── explore/
    │   ├── FormulaExplorer.tsx       # Explore layout
    │   ├── FormulaSearchBar.tsx      # Fuzzy search
    │   ├── FormulaCategoryTree.tsx   # Category accordion
    │   └── FormulaGridCard.tsx       # Card component
    ├── studio/                       # (TODO) Drag-drop canvas
    ├── stories/                      # (TODO) Pre-built narratives
    └── shared/
        ├── FormulaDisplay.tsx        # KaTeX renderer
        ├── FormulaDisplayMini.tsx    # Mini preview
        └── FormulaDetailPanel.tsx    # Detail view
```

### API/Data Flow
- No backend API - all data is static (registry.ts)
- Formula selection triggers state update → detail panel re-renders
- Screenshot uses html-to-image to capture DOM element

---

## 7. Dependencies Added

| Package | Version | Purpose |
|---------|---------|---------|
| `katex` | 0.16.45 | LaTeX rendering |
| `@types/katex` | 0.16.8 | TypeScript types |
| `react-katex` | 3.1.0 | React wrapper (not used, direct import) |
| `html-to-image` | 1.11.13 | Screenshot (replaces html2canvas) |
| `@dnd-kit/core` | 6.3.1 | Drag-drop (for Studio) |
| `@dnd-kit/sortable` | 10.0.0 | Drag-drop (for Studio) |
| `fuse.js` | 7.3.0 | Fuzzy search |

---

## 8. Critic Review Findings (v1.1)

### Issues Fixed from Review:
| Issue | Severity | Status |
|-------|----------|--------|
| CR_k gate matrix wrong (e^{iπ/2^k} → e^{2πi/2^k}) | CRITICAL | ✅ Fixed |
| FormulaSearchBar.tsx dead code (218 lines, never imported) | HIGH | ✅ Deleted |
| FormulaDisplay/Mini duplication | HIGH | ✅ Merged into single component |
| Step-by-Step button dead (no onClick) | HIGH | ✅ Added alert placeholder |
| Copy button no feedback | MEDIUM | ✅ Shows "Copied!" for 2s |
| Screenshot button no loading state | MEDIUM | ✅ Added isCapturing state |
| Chinese text in phase-gate-s description | LOW | ✅ Removed |
| Russian text in eigenvalue-equation description | LOW | ✅ Removed |
| "Kehidupan" → "Kehadaan" grammar | LOW | ✅ Fixed |
| Trailing spaces in tags | LOW | ✅ Fixed |
| Inconsistent categoryColors (2 places) | MEDIUM | ✅ Unified in colors.ts |

### Known Limitations (Deferred):
- Stories Tab: TODO (Phase 3)
- Studio Tab: TODO (Phase 2)
- Step-by-Step computation: TODO (Phase 4)
- Formula numbering/sectioning for academic references
- Caption template for screenshot

---

## 9. Next Steps (Priority Order)

1. **Phase 2:** Implement Studio Tab (drag-drop canvas with formula nodes and connections)
2. **Phase 3:** Implement Stories Tab (pre-built algorithm narratives)
3. **Phase 4:** Implement Step-by-Step computation widgets (VQE energy, DFT sum)
4. **Phase 5:** Polish + integration testing + screenshot verification