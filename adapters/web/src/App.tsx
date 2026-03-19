import { Routes, Route } from 'react-router-dom';
import Layout from './components/shared/Layout';
import Intro from './pages/Intro';
import Lobby from './pages/Lobby';
import Setup from './pages/Setup';
import Meeting from './pages/Meeting';
import Result from './pages/Result';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/meeting" element={<Meeting />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}
