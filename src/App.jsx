import { useState } from 'react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import ScenarioSelector from './components/ScenarioSelector'
import ChatBox from './components/ChatBox'

export default function App() {
  const [page, setPage] = useState('landing') // landing | scenarios | chat
  const [selectedScenario, setSelectedScenario] = useState(null)

  const handleNavigate = (target) => {
    setPage(target)
    if (target !== 'chat') {
      setSelectedScenario(null)
    }
  }

  const handleSelectScenario = (scenario) => {
    setSelectedScenario(scenario)
    setPage('chat')
  }

  const handleStart = () => {
    setPage('scenarios')
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Header page={page} onNavigate={handleNavigate} />
      <main>
        {page === 'landing' && (
          <LandingPage onStart={handleStart} />
        )}
        {page === 'scenarios' && (
          <ScenarioSelector onSelect={handleSelectScenario} />
        )}
        {page === 'chat' && selectedScenario && (
          <ChatBox scenario={selectedScenario} />
        )}
      </main>
    </div>
  )
}
