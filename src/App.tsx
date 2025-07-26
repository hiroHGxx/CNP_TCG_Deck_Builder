import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DeckBuilder from './pages/DeckBuilder'
import MatchLog from './pages/MatchLog'
import Stats from './pages/Stats'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DeckBuilder />} />
        <Route path="/deck-builder" element={<DeckBuilder />} />
        <Route path="/match-log" element={<MatchLog />} />
        <Route path="/match-log/:id" element={<MatchLog />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Layout>
  )
}

export default App