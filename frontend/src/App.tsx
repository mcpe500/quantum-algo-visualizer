import { BrowserRouter, Routes, Route } from "react-router-dom";
import AlgorithmSelector from "./pages/AlgorithmSelector";
import DJCombinedPage from "./pages/DJCombinedPage";
import DJTopographyPage from "./pages/DJTopographyPage";
import QFTCombinedPage from "./pages/QFTCombinedPage";
import QFTTopographyPage from "./pages/QFTTopographyPage";
import VQECombinedPage from "./pages/VQECombinedPage";
import QAOACombinedPage from "./pages/QAOACombinedPage";
import QAOADatasetPage from "./pages/QAOADatasetPage";
import QubitPlaygroundPage from "./pages/QubitPlaygroundPage";

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
        <Route path="/qaoa" element={<QAOACombinedPage />} />
        <Route path="/qaoa/dataset" element={<QAOADatasetPage />} />
        <Route path="/playground" element={<QubitPlaygroundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
