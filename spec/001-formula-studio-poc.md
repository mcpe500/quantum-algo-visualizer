# SPEC 001: Formula Studio - Quantum Algorithm Formula Visualization

## Status: PHASE 0 COMPLETE + CRITIC REVIEW PASSED + PHASE 2 ARCHITECTURE COMPLETE

**Tanggal:** 2026-04-23
**Author:** Claude Code (Fleet Swarm)
**Project:** quantum-algo-visualizer
**Version:** 2.0 (Studio Tab Architecture)

---

## 2.1 Studio Tab - Architecture & Design Decisions

### Purpose
Studio Tab provides a drag-drop canvas workspace where users place formula nodes and connect them with labeled edges to visualize mathematical relationships between quantum algorithm concepts.

### Canvas State Model

```typescript
// Canvas node: formula instance placed on canvas with position
interface CanvasNodeData {
  id: string;              // unique instance id (uuid)
  formulaId: string;      // reference to FORMULA_REGISTRY id
  position: { x: number; y: number };
  width: number;          // default 280
  height: number;         // calculated from content
}

// Canvas connection: directed edge between two nodes
interface CanvasConnection {
  id: string;             // uuid
  fromId: string;         // source node id
  toId: string;           // target node id
  relationType: RelationType;  // 'implements', 'derived-from', etc.
  label: string;          // human-readable label
}

// Full canvas state
interface CanvasState {
  nodes: CanvasNodeData[];
  connections: CanvasConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  panOffset: { x: number; y: number };
  zoom: number;           // 1.0 = 100%
}

// Relation types from FormulaRelation
type RelationType = 'quantum-version' | 'implements' | 'derives' | 'compares' 
  | 'generalizes' | 'same-concept' | 'related' | 'equivalent' | 'derived-from' 
  | 'specializes' | 'contrast-with' | 'discretized' | 'encoded-in' | 'quantized' 
  | 'uses' | 'algorithm' | 'target' | 'computed-by' | 'result' | 'used-in';
```

### Component Hierarchy

```
StudioCanvas (main container)
├── CanvasToolbar
│   ├── Clear button (remove all nodes)
│   ├── Screenshot button (capture canvas as PNG)
│   ├── Auto-layout button (force-directed arrangement)
│   ├── Zoom controls (+/- and fit)
│   └── Connection mode toggle (draw connections by clicking)
├── CanvasArea (scrollable, pannable)
│   ├── ConnectionLines (SVG layer - renders bezier curves)
│   │   └── ConnectionLine (single bezier path with arrowhead + label)
│   ├── FormulaNode (draggable) x N
│   │   ├── Node header (title + category badge)
│   │   ├── Formula content (KaTeX render)
│   │   ├── Connection anchors (left/right circles for edge endpoints)
│   │   └── Delete button (× on hover)
│   └── DroppableCanvasBackground (drop zone for palette items)
└── NodePalette (left sidebar, 200px)
    ├── Search filter
    ├── Category accordion (same as Explore)
    └── Draggable formula cards (drag to canvas to add)
```

### State Management Approach

**Local state in StudioCanvas with useReducer:**

```typescript
type CanvasAction =
  | { type: 'ADD_NODE'; formulaId: string; position: { x: number; y: number } }
  | { type: 'MOVE_NODE'; nodeId: string; position: { x: number; y: number } }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'ADD_CONNECTION'; fromId: string; toId: string; relationType: string; label: string }
  | { type: 'DELETE_CONNECTION'; connectionId: string }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'LOAD_CANVAS'; state: CanvasState }
  | { type: 'SET_PAN'; offset: { x: number; y: number } }
  | { type: 'SET_ZOOM'; zoom: number };
```

**Persistence:** Canvas state serialized to `localStorage` key `formula-studio-canvas-{timestamp}` on every change. Load on mount if exists.

### Drag-and-Drop Implementation

**@dnd-kit Usage Pattern:**

1. **Palette items:** Use `useDraggable` from `@dnd-kit/core` with `data: { type: 'palette-item', formulaId }`
2. **Canvas background:** Use `useDroppable` from `@dnd-kit/core` with `id: 'canvas-drop-zone'`
3. **Canvas nodes:** Use `useDraggable` from `@dnd-kit/core` with `data: { type: 'canvas-node', nodeId }`
4. **DragOverlay:** Wrap in `DndContext` with `DragOverlay` portal for smooth drag preview

**Flow:**
- Drag from palette → drop on canvas → `ADD_NODE` action with drop coordinates
- Drag existing node → `MOVE_NODE` action with new coordinates
- Connection mode: click source node → click target node → `ADD_CONNECTION`

### SVG Connection Rendering

**Bezier Curve Calculation:**
- Source point: right anchor of source node (node.x + node.width, node.y + node.height/2)
- Target point: left anchor of target node (node.x, node.y + node.height/2)
- Control points: cubic bezier with horizontal offset ~50% of horizontal distance
- Arrowhead: small triangle marker at target point

**Path Formula:**
```typescript
const dx = targetX - sourceX;
const dy = targetY - sourceY;
const cpOffset = Math.max(50, Math.abs(dx) * 0.4);
const path = `M ${sourceX} ${sourceY} C ${sourceX + cpOffset} ${sourceY}, ${targetX - cpOffset} ${targetY}, ${targetX} ${targetY}`;
```

**Connection Styles by RelationType:**
- 'quantum-version', 'derived-from', 'implements': solid cyan arrow
- 'contrast-with', 'compares': dashed orange arrow
- 'related', 'same-concept': dotted gray line
- 'uses', 'algorithm': solid purple arrow
- Default: solid slate line

### Canvas Interactions

| Action | Behavior |
|--------|----------|
| Drag palette item to canvas | Creates new node at drop position |
| Drag existing node | Updates position, connections follow |
| Click node (connection mode off) | Selects node, shows detail panel |
| Click node (connection mode on) | If no source selected, set as source (highlight); if source selected, create connection to this target |
| Double-click node | Opens quick edit (label, color) |
| Delete key on selected node | Removes node and its connections |
| Delete key on selected connection | Removes connection |
| Scroll wheel | Zoom in/out (0.5x to 2x) |
| Middle mouse drag | Pan canvas |
| Click canvas background | Deselect all |

### Performance Considerations

1. **Virtualization:** If >50 nodes, implement windowing (only render visible nodes)
2. **Connection recalculation:** Memoize path calculations, only recalc on node move
3. **SVG layer:** Single SVG element with all connections, not one per connection
4. **State updates:** Use React.memo for FormulaNode, bail out if position unchanged

### File Structure

```
frontend/src/components/formula-studio/studio/
├── index.ts                                  # barrel export
├── StudioCanvas.tsx                          # main canvas container
├── canvas-types.ts                           # canvas-specific types (NOTE: renamed from StudioCanvas.types.ts to fix Vite dev-server resolution)
├── useCanvasReducer.ts                       # reducer + actions
├── canvasUtils.ts                           # bezier math, collision detection
├── CanvasToolbar.tsx                        # top toolbar
├── CanvasArea.tsx                           # stub (unused, replaced by StudioCanvas inline)
├── FormulaNode.tsx                          # draggable node card
├── ConnectionLines.tsx                       # SVG overlay for connections
├── ConnectionLine.tsx                       # single bezier connection
├── NodePalette.tsx                          # left sidebar with draggable formulas
└── NodePaletteItem.tsx                      # individual draggable item
```

### Dependencies Required

- `@dnd-kit/core` - already installed
- `@dnd-kit/utilities` - already installed (comes with core)
- `uuid` - for generating node/connection IDs (or use `crypto.randomUUID()`)
- `html-to-image` - already installed (for screenshot)

### Key Implementation Notes

1. **No additional npm packages** - all required libraries are already present
2. **Reuse FormulaDisplay** for node content rendering
3. **Reuse CATEGORY_COLORS** for node border colors
4. **Connection anchor circles** rendered as part of FormulaNode, positioned at left/right edges
5. **Canvas coordinates** in pixels, origin (0,0) at top-left of canvas area
6. **Coordinate system:** No transform matrix initially; pan/zoom just changes CSS transform on canvas container

---

## 2.2 Studio Tab - Interaction Details

### Node Palette Behavior

- Accordion categories matching Explore tab
- Each formula shown as mini card (title + small KaTeX preview)
- Drag to canvas to add node
- Search filter at top to find formulas quickly
- Visual feedback on drag: card becomes semi-transparent ghost

### Connection Drawing Flow

1. User clicks "Connect" button in toolbar (or presses 'C')
2. Toolbar shows "Click source node..." instruction
3. Source node highlighted with pulsing border
4. User clicks source node → border changes to "Click target..."
5. User clicks target node → connection created with default "related" type
6. User can right-click connection to change type/label
7. Press Escape to cancel connection mode

### Auto-Layout Algorithm

Simple force-directed layout:
- Nodes repel each other (inverse square)
- Connections act as springs (attract connected nodes)
- Run for 100 iterations on button click
- Stop early if movement < 0.5px

### Screenshot Export

- Uses `html-to-image` to capture the CanvasArea DOM element
- Includes all nodes and connections
- White background for print clarity (not dark theme)
- Downloads as `formula-canvas-{timestamp}.png`

---

## 2.3 Component Specifications

### FormulaNode Props

```typescript
interface FormulaNodeProps {
  node: CanvasNodeData;
  formula: FormulaDefinition;
  isSelected: boolean;
  isConnectionSource: boolean;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
  connectionMode: 'idle' | 'selecting-source' | 'selecting-target';
}
```

### ConnectionLine Props

```typescript
interface ConnectionLineProps {
  connection: CanvasConnection;
  sourceNode: CanvasNodeData;
  targetNode: CanvasNodeData;
  isSelected: boolean;
  onSelect: (connectionId: string) => void;
  onDelete: (connectionId: string) => void;
}
```

### CanvasState Default

```typescript
const INITIAL_CANVAS_STATE: CanvasState = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  panOffset: { x: 0, y: 0 },
  zoom: 1.0,
};
```

---

## 2.4 Implementation Order

1. **studio/canvas-types.ts** - Define canvas types extending existing types (renamed from StudioCanvas.types.ts)
2. **studio/useCanvasReducer.ts** - Canvas state reducer with all actions
3. **studio/canvasUtils.ts** - Bezier math, auto-layout
4. **studio/FormulaNode.tsx** - Draggable node component
5. **studio/ConnectionLine.tsx** - Single SVG bezier with arrowhead
6. **studio/ConnectionLines.tsx** - SVG layer managing all connections
7. **studio/NodePaletteItem.tsx** - Draggable palette item
8. **studio/NodePalette.tsx** - Left sidebar with accordion categories
9. **studio/CanvasToolbar.tsx** - Top toolbar with controls
10. **studio/CanvasBackground.tsx** - Droppable canvas area
11. **studio/CanvasArea.tsx** - Scrollable container with nodes + connections
12. **studio/useCanvasPersistence.ts** - localStorage sync
13. **studio/StudioCanvas.tsx** - Main container wiring all together
14. **Update FormulaStudioPage.tsx** - Replace placeholder with StudioCanvas
15. **Update studio/index.ts** - Export new components
16. **Update SPEC** - Document Phase 2 completion