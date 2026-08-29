import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shell } from './components/Shell.jsx';
import { Toast } from './components/Toast.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import RehearsalScreen from './screens/RehearsalScreen.jsx';
import SongScreen from './screens/SongScreen.jsx';
import LibraryScreen from './screens/LibraryScreen.jsx';

export default function App() {
  return (
    <>
      <Shell>
        <Routes>
          <Route path="/" element={<CalendarScreen />} />
          <Route path="/songs" element={<LibraryScreen />} />
          <Route path="/rehearsal/:date" element={<RehearsalScreen />} />
          <Route path="/song/:id" element={<SongScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
      <Toast />
    </>
  );
}
