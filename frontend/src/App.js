import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WorkshopPage from './pages/WorkshopPage';
import SpecPage from './pages/SpecPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkshopPage />} />
        <Route path="/spec" element={<SpecPage />} />
      </Routes>
    </BrowserRouter>
  );
}
