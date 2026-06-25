import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import UploadTranscript from './components/UploadTranscript';
import Dashboard from './components/Dashboard';

function Header() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-8">
      <h1
        onClick={() => navigate('/')}
        className="text-2xl font-medium text-gray-800 cursor-pointer"
      >
        MeetingMind
      </h1>
      <button
        onClick={() => navigate('/dashboard')}
        className="text-sm text-gray-500 hover:text-gray-800"
      >
        Dashboard
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 p-8">
        <Header />
        <Routes>
          <Route path="/" element={<UploadTranscript />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;