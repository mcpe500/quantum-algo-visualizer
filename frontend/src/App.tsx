import { BrowserRouter, Routes, Route } from "react-router-dom";
import AlgorithmSelector from "./pages/AlgorithmSelector";
import DJCombinedPage from "./pages/DJCombinedPage";
import DJTopographyPage from "./pages/DJTopographyPage";
import QFTCombinedPage from "./pages/QFTCombinedPage";
import QFTTopographyPage from "./pages/QFTTopographyPage";
import VQECombinedPage from "./pages/VQECombinedPage";
import QAOACombinedPage from "./pages/QAOACombinedPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AlgorithmSelector />} />
        <Route path="/dj" element={<DJCombinedPage />} />
        <Route path="/dj/topography" element={<DJTopographyPage />} />
        <Route path="/qft" element={<QFTCombinedPage />} />
        <Route path="/qft/topography" element={<QFTTopographyPage />} />
        <Route path="/vqe" element={<VQECombinedPage />} />
        <Route path="/qaoa" element={<QAOACombinedPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
