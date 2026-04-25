import type { CanvasNodeData, CanvasConnection } from './canvas-types';

export interface Point {
  x: number;
  y: number;
}

export interface BezierPoints {
  source: Point;
  target: Point;
  control1: Point;
  control2: Point;
}

export function getNodeConnectionAnchors(node: CanvasNodeData): { left: Point; right: Point } {
  return {
    left: { x: node.position.x, y: node.position.y + node.height / 2 },
    right: { x: node.position.x + node.width, y: node.position.y + node.height / 2 },
  };
}

export function calculateBezierPath(
  sourceNode: CanvasNodeData,
  targetNode: CanvasNodeData
): string {
  const anchors = getNodeConnectionAnchors(sourceNode);
  const targets = getNodeConnectionAnchors(targetNode);

  const source = anchors.right;
  const target = targets.left;

  const dx = target.x - source.x;

  const cpOffset = Math.max(60, Math.abs(dx) * 0.5);

  const control1: Point = { x: source.x + cpOffset, y: source.y };
  const control2: Point = { x: target.x - cpOffset, y: target.y };

  return `M ${source.x} ${source.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${target.x} ${target.y}`;
}

export function calculateBezierMidpoint(
  sourceNode: CanvasNodeData,
  targetNode: CanvasNodeData
): Point {
  const anchors = getNodeConnectionAnchors(sourceNode);
  const targets = getNodeConnectionAnchors(targetNode);

  const source = anchors.right;
  const target = targets.left;

  const dx = target.x - source.x;
  const cpOffset = Math.max(60, Math.abs(dx) * 0.5);

  const t = 0.5;
  const cp1: Point = { x: source.x + cpOffset, y: source.y };
  const cp2: Point = { x: target.x - cpOffset, y: target.y };

  const mt = 1 - t;
  const mx = mt * mt * mt * source.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * target.x;
  const my = mt * mt * mt * source.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * target.y;

  return { x: mx, y: my };
}

export function calculateAutoLayout(
  nodes: CanvasNodeData[],
  connections: CanvasConnection[],
  iterations: number = 100
): CanvasNodeData[] {
  if (nodes.length === 0) return nodes;

  const REPULSION_STRENGTH = 5000;
  const ATTRACTION_STRENGTH = 0.01;
  const DAMPING = 0.5;
  const MIN_MOVEMENT = 0.5;

  const positions = new Map<string, Point>();
  const velocities = new Map<string, Point>();

  nodes.forEach((node) => {
    positions.set(node.id, { x: node.position.x, y: node.position.y });
    velocities.set(node.id, { x: 0, y: 0 });
  });

  // Break perfect overlaps so repulsion can work on initially stacked nodes.
  const buckets = new Map<string, string[]>();
  nodes.forEach((node) => {
    const key = `${Math.round(node.position.x)}:${Math.round(node.position.y)}`;
    const list = buckets.get(key) || [];
    list.push(node.id);
    buckets.set(key, list);
  });
  buckets.forEach((ids) => {
    if (ids.length < 2) return;
    ids.forEach((id, idx) => {
      const pos = positions.get(id);
      if (!pos) return;
      const angle = (Math.PI * 2 * idx) / ids.length;
      const radius = 10 + idx * 4;
      pos.x += Math.cos(angle) * radius;
      pos.y += Math.sin(angle) * radius;
    });
  });

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, Point>();
    nodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const posI = positions.get(nodes[i].id)!;
        const posJ = positions.get(nodes[j].id)!;

        let dx = posJ.x - posI.x;
        let dy = posJ.y - posI.y;
        if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
          const angle = ((i * 31 + j * 17) % 360) * (Math.PI / 180);
          dx = Math.cos(angle) * 0.1;
          dy = Math.sin(angle) * 0.1;
        }
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        const force = REPULSION_STRENGTH / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        const forceI = forces.get(nodes[i].id)!;
        const forceJ = forces.get(nodes[j].id)!;

        forceI.x -= fx;
        forceI.y -= fy;
        forceJ.x += fx;
        forceJ.y += fy;
      }
    }

    connections.forEach((conn) => {
      const posFrom = positions.get(conn.fromId);
      const posTo = positions.get(conn.toId);
      if (!posFrom || !posTo) return;

      const dx = posTo.x - posFrom.x;
      const dy = posTo.y - posFrom.y;

      // Directional horizontal bias: pull source left, target right
      const horizontalForce = (Math.abs(dx) + 100) * ATTRACTION_STRENGTH;
      const verticalForce = dy * ATTRACTION_STRENGTH * 0.5;

      const forceFrom = forces.get(conn.fromId)!;
      const forceTo = forces.get(conn.toId)!;

      // Source node pulled toward left of target
      forceFrom.x -= horizontalForce;
      forceFrom.y += verticalForce;
      // Target node pulled toward right of source
      forceTo.x += horizontalForce;
      forceTo.y -= verticalForce;
    });

    let totalMovement = 0;

    nodes.forEach((node) => {
      const force = forces.get(node.id)!;
      const vel = velocities.get(node.id)!;

      vel.x = (vel.x + force.x) * DAMPING;
      vel.y = (vel.y + force.y) * DAMPING;

      const pos = positions.get(node.id)!;
      pos.x += vel.x;
      pos.y += vel.y;

      pos.x = Math.max(0, Math.min(pos.x, 2000));
      pos.y = Math.max(0, Math.min(pos.y, 2000));

      totalMovement += Math.abs(vel.x) + Math.abs(vel.y);
    });

    if (totalMovement / nodes.length < MIN_MOVEMENT) {
      break;
    }
  }

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id)!,
  }));
}

export function findNodeAtPosition(
  nodes: CanvasNodeData[],
  x: number,
  y: number
): CanvasNodeData | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (
      x >= node.position.x &&
      x <= node.position.x + node.width &&
      y >= node.position.y &&
      y <= node.position.y + node.height
    ) {
      return node;
    }
  }
  return null;
}

export function getCanvasBounds(nodes: CanvasNodeData[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + node.width);
    maxY = Math.max(maxY, node.position.y + node.height);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
