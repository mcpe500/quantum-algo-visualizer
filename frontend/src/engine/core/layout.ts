/**
 * Layout engine for visual object positioning.
 * Provides utilities for calculating flow layouts (serpentine, grid, etc.).
 */

export interface LayoutNode<T = unknown> {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: T;
}

export interface Connector {
  from: string;
  to: string;
  style?: 'solid' | 'dashed' | 'arrow';
  color?: string;
}

export interface LayoutModel {
  nodes: LayoutNode[];
  connectors: Connector[];
}

export interface FlowLayoutConfig {
  columns: number;
  itemWidth: number;
  itemHeight: number;
  gapX: number;
  gapY: number;
  paddingX: number;
  paddingY: number;
}

export function buildSerpentineFlowLayout<T>(
  items: T[],
  config: FlowLayoutConfig
): LayoutNode<T>[] {
  const nodes: LayoutNode<T>[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = Math.floor(i / config.columns);
    const col = i % config.columns;

    // For odd rows, reverse column order for serpentine pattern
    const adjustedCol = row % 2 === 1 ? config.columns - 1 - col : col;

    const x = config.paddingX + adjustedCol * (config.itemWidth + config.gapX);
    const y = config.paddingY + row * (config.itemHeight + config.gapY);

    nodes.push({
      id: `node-${i}`,
      x,
      y,
      width: config.itemWidth,
      height: config.itemHeight,
      data: items[i],
    });
  }

  return nodes;
}

export function buildGridLayout<T>(
  items: T[],
  config: FlowLayoutConfig
): LayoutNode<T>[] {
  const nodes: LayoutNode<T>[] = [];

  for (let i = 0; i < items.length; i++) {
    const row = Math.floor(i / config.columns);
    const col = i % config.columns;

    const x = config.paddingX + col * (config.itemWidth + config.gapX);
    const y = config.paddingY + row * (config.itemHeight + config.gapY);

    nodes.push({
      id: `node-${i}`,
      x,
      y,
      width: config.itemWidth,
      height: config.itemHeight,
      data: items[i],
    });
  }

  return nodes;
}

export function calculateDesktopLayout<T>(
  columns: number,
  items: T[],
  config: Partial<FlowLayoutConfig> = {}
): LayoutNode<T>[] {
  const defaultConfig: FlowLayoutConfig = {
    columns,
    itemWidth: 320,
    itemHeight: 200,
    gapX: 16,
    gapY: 16,
    paddingX: 16,
    paddingY: 16,
    ...config,
  };

  return buildSerpentineFlowLayout(items, defaultConfig);
}

export function createConnector(from: string, to: string, style: Connector['style'] = 'arrow'): Connector {
  return { from, to, style };
}

export function buildConnectorsFromLayout(nodes: LayoutNode[]): Connector[] {
  const connectors: Connector[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    connectors.push(createConnector(nodes[i].id, nodes[i + 1].id, 'arrow'));
  }

  return connectors;
}
