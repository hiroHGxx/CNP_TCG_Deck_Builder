import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DeckBuilderIntegrated from './pages/DeckBuilderIntegrated'
import MatchLog from './pages/MatchLog'
import Stats from './pages/Stats'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DeckBuilderIntegrated />} />
        <Route path="/deck-builder" element={<DeckBuilderIntegrated />} />
        <Route path="/match-log" element={<MatchLog />} />
        <Route path="/match-log/:id" element={<MatchLog />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </Layout>
  )
}

export default App