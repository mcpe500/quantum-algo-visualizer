import { BrowserRouter, Routes, Route } from "react-router-dom";
import AlgorithmSelector from "./pages/AlgorithmSelector";
import DJCombinedPage from "./pages/DJCombinedPage";
import DJTopographyPage from "./pages/DJTopographyPage";
import QFTCombinedPage from "./pages/QFTCombinedPage";
import QFTTopographyPage from "./pages/QFTTopographyPage";
import VQECombinedPage from "./pages/VQECombinedPage";
import VQEDatasetPage from "./pages/VQEDatasetPage";
import QAOACombinedPage from "./pages/QAOACombinedPage";
import QAOADatasetPage from "./pages/QAOADatasetPage";
import QubitPlaygroundPage from "./pages/QubitPlaygroundPage";
import HardwareSelector from "./pages/HardwareSelector";
import HardwareDetailPage from "./pages/HardwareDetailPage";
import HardwareComparisonPage from "./pages/HardwareComparisonPage";
import FormulaStudioPage from './components/formula-studio/FormulaStudioPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AlgorithmSelector />} />
        <Route path="/dj" element={<DJCombinedPage />} />
        <Route path="/dj/dataset" element={<DJTopographyPage />} />
        <Route path="/qft" element={<QFTCombinedPage />} />
        <Route path="/qft/dataset" element={<QFTTopographyPage />} />
        <Route path="/vqe" element={<VQECombinedPage />} />
        <Route path="/vqe/dataset" element={<VQEDatasetPage />} />
        <Route path="/qaoa" element={<QAOACombinedPage />} />
        <Route path="/qaoa/dataset" element={<QAOADatasetPage />} />
        <Route path="/playground" element={<QubitPlaygroundPage />} />
        <Route path="/hardware" element={<HardwareSelector />} />
        <Route path="/hardware/:id" element={<HardwareDetailPage />} />
        <Route path="/hardware/compare" element={<HardwareComparisonPage />} />
        <Route path="/formulas" element={<FormulaStudioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
