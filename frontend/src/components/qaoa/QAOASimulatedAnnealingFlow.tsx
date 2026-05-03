import type { QAOABenchmarkResult } from '../../types/qaoa';
import { useQaoaSAController } from './hooks/useQaoaSAController';
import { QAOASimulatedAnnealingView } from './QAOASimulatedAnnealingView';

interface QAOASimulatedAnnealingFlowProps {
  result: QAOABenchmarkResult;
}

export function QAOASimulatedAnnealingFlow({ result }: QAOASimulatedAnnealingFlowProps) {
  const { state, actions } = useQaoaSAController(result);

  return (
    <QAOASimulatedAnnealingView
      model={state.model}
      form={state.form}
      error={state.error}
      onFormChange={actions.setForm}
      onRun={actions.run}
      onReset={actions.reset}
      onLoadBenchmark={actions.reset}
      matrix={result.adjacency_matrix}
      description={state.model?.description || result.description || 'Penyelesaian Max-Cut dengan Graph Dinamis'}
    />
  );
}
