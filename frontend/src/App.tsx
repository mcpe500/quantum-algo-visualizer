import type { ComponentType, ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import FormulaStudioPage from './components/formula-studio/FormulaStudioPage';
import AlgorithmSelector from './pages/AlgorithmSelector';
import DJCombinedPage from './pages/DJCombinedPage';
import DJTopographyPage from './pages/DJTopographyPage';
import HardwareComparisonPage from './pages/HardwareComparisonPage';
import HardwareDetailPage from './pages/HardwareDetailPage';
import HardwareSelector from './pages/HardwareSelector';
import QAOACombinedPage from './pages/QAOACombinedPage';
import QAOADatasetPage from './pages/QAOADatasetPage';
import QFTCombinedPage from './pages/QFTCombinedPage';
import QFTTopographyPage from './pages/QFTTopographyPage';
import QubitPlaygroundPage from './pages/QubitPlaygroundPage';
import VQECombinedPage from './pages/VQECombinedPage';
import VQEDatasetPage from './pages/VQEDatasetPage';

type RouteDefinition = {
  path: string;
  element: ReactElement;
};

type TabbedRouteConfig<T extends string> = {
  basePath: string;
  component: ComponentType<{ initialTab?: T }>;
  tabs: ReadonlyArray<{ suffix: string; tab: T }>;
};

function createTabbedRoutes<T extends string>({
  basePath,
  component: PageComponent,
  tabs,
}: TabbedRouteConfig<T>): RouteDefinition[] {
  return [
    { path: basePath, element: <PageComponent /> },
    ...tabs.map(({ suffix, tab }) => ({
      path: `${basePath}/${suffix}`,
      element: <PageComponent initialTab={tab} />,
    })),
  ];
}

const ROUTES: RouteDefinition[] = [
  { path: '/', element: <AlgorithmSelector /> },
  ...createTabbedRoutes({
    basePath: '/dj',
    component: DJCombinedPage,
    tabs: [{ suffix: 'animation', tab: 'animation' }],
  }),
  { path: '/dj/dataset', element: <DJTopographyPage /> },
  ...createTabbedRoutes({
    basePath: '/qft',
    component: QFTCombinedPage,
    tabs: [{ suffix: 'animation', tab: 'animation' }],
  }),
  { path: '/qft/dataset', element: <QFTTopographyPage /> },
  { path: '/vqe', element: <VQECombinedPage /> },
  { path: '/vqe/dataset', element: <VQEDatasetPage /> },
  ...createTabbedRoutes({
    basePath: '/qaoa',
    component: QAOACombinedPage,
    tabs: [{ suffix: 'animation', tab: 'animation' }],
  }),
  { path: '/qaoa/dataset', element: <QAOADatasetPage /> },
  ...createTabbedRoutes({
    basePath: '/playground',
    component: QubitPlaygroundPage,
    tabs: [{ suffix: 'circuit', tab: 'circuit' }],
  }),
  { path: '/hardware', element: <HardwareSelector /> },
  { path: '/hardware/:id', element: <HardwareDetailPage /> },
  { path: '/hardware/compare', element: <HardwareComparisonPage /> },
  ...createTabbedRoutes({
    basePath: '/formulas',
    component: FormulaStudioPage,
    tabs: [
      { suffix: 'studio', tab: 'studio' },
      { suffix: 'stories', tab: 'stories' },
    ],
  }),
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {ROUTES.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
