import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AlgorithmSelector from './pages/AlgorithmSelector';
import DJCombinedPage from './pages/DJCombinedPage';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AlgorithmSelector />} />
        <Route path="/dj" element={<DJCombinedPage />} />
        <Route path="/qft" element={<PlaceholderPage />} />
        <Route path="/vqe" element={<PlaceholderPage />} />
        <Route path="/qaoa" element={<PlaceholderPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
