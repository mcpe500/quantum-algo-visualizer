import { useState, useEffect } from 'react';
import { qaoaApi } from '../../services/api';
import type { QAOACase } from '../../types/qaoa';
import { GraphVisualization } from '../charts/GraphVisualization';

function inferGraphType(nodes: number[], edges: [number, number][]): string {
  const n = nodes.length;
  const maxEdges = (n * (n - 1)) / 2;
  if (edges.length === maxEdges) {
    return `K${n}`;
  }
  if (edges.length === n - 1) {
    const hasStar = edges.some(([u, v]) => {
      const degree = edges.filter(([a, b]) => a === u || b === u || a === v || b === v).length;
      return degree === n - 1;
    });
    if (hasStar) return `S${n}`;
    return `P${n}`;
  }
  return `custom`;
}

function buildAdjacencyMatrix(nodes: number[], edges: [number, number][]): number[][] {
  const n = nodes.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  for (const [u, v] of edges) {
    matrix[u][v] = 1;
    matrix[v][u] = 1;
  }
  return matrix;
}

interface DatasetCardProps {
  data: QAOACase;
  index: number;
  mounted: boolean;
}

function DatasetCard({ data, index, mounted }: DatasetCardProps) {
  const graphType = inferGraphType(data.graph.nodes, data.graph.edges);
  const adjacencyMatrix = buildAdjacencyMatrix(data.graph.nodes, data.graph.edges);

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden transform transition-all duration-700 ease-out hover:shadow-[0_16px_50px_rgb(0,0,0,0.08)] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="p-6 sm:p-8 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
              {data.case_id}
            </h2>
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-600 uppercase tracking-widest">
              {data.problem}
            </span>
            <span className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-600 uppercase tracking-widest">
              {graphType}
            </span>
          </div>
          <span className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold">
            p = {data.p_layers}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">GRAPH</h3>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex justify-center">
                <GraphVisualization
                  nodes={data.graph.nodes}
                  edges={data.graph.edges}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">STRUCTURE</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">{data.graph.nodes.length}</div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">NODES</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">{data.graph.edges.length}</div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">EDGES</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">{data.p_layers}</div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">P-LAYER</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="text-2xl font-black text-blue-600">{graphType}</div>
                  <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">GRAPH</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">ADJACENCY MATRIX</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2"></th>
                      {data.graph.nodes.map((n) => (
                        <th key={n} className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-600">
                          {n}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.graph.nodes.map((rowNode, i) => (
                      <tr key={rowNode}>
                        <th className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-600">
                          {rowNode}
                        </th>
                        {data.graph.nodes.map((colNode, j) => {
                          const val = adjacencyMatrix[i][j];
                          return (
                            <td
                              key={j}
                              className={`p-2 text-center border rounded-lg font-mono font-bold ${
                                val === 1
                                  ? 'bg-blue-500 border-blue-500 text-white'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">EDGES</h3>
              <div className="flex flex-wrap gap-2">
                {data.graph.edges.map((edge, i) => (
                  <span
                    key={i}
                    className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-mono text-sm font-bold text-slate-700"
                  >
                    [{edge[0]}, {edge[1]}]
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">JSON</h3>
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QAOADatasetVisualizer() {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<QAOACase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await qaoaApi.getCases();
        const sorted = [...data].sort((a, b) =>
          a.case_id.localeCompare(b.case_id, undefined, { numeric: true, sensitivity: 'base' })
        );
        setCases(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat dataset QAOA');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat dataset QAOA dari JSON...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-red-200 p-8 max-w-md">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <p className="text-slate-500">Tidak ada dataset QAOA ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans">
      <div className="max-w-[1400px] mx-auto mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 mb-4">
          QAOA Dataset
        </h1>
        <p className="text-slate-500 text-lg">
          Visualisasi dataset Max-Cut dari JSON. Setiap kartu menampilkan graph, adjacency matrix, dan struktur.
        </p>
      </div>

      <div className="max-w-[1500px] mx-auto space-y-8">
        {cases.map((data, index) => (
          <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} />
        ))}
      </div>
    </div>
  );
}

export default QAOADatasetVisualizer;
