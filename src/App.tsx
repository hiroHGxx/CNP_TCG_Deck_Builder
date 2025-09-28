import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DeckBuilderIntegrated from './pages/DeckBuilderIntegrated'
import MatchLog from './pages/MatchLog'
import Stats from './pages/Stats'
import BoardSimulator from './pages/BoardSimulator'
import { ConvexTest } from './components/ConvexTest'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DeckBuilderIntegrated />} />
        <Route path="/deck-builder" element={<DeckBuilderIntegrated />} />
        <Route path="/match-log" element={<MatchLog />} />
        <Route path="/match-log/:id" element={<MatchLog />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/board-simulator" element={<BoardSimulator />} />
        <Route path="/convex-test" element={<ConvexTest />} />
      </Routes>
    </Layout>
  )
}

export default App