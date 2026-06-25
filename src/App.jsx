import { useEffect, useState } from 'react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import ScenarioSelector from './components/ScenarioSelector'
import ChatBox from './components/ChatBox'
import FavoritesPage from './components/FavoritesPage'
import LoginModal from './components/LoginModal'

const USER_KEY = 'zhixiaoku:user'

function favoritesKey(user) {
  return `zhixiaoku:favorites:${user.id}`
}

export default function App() {
  const [page, setPage] = useState('landing') // landing | scenarios | chat | favorites
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    if (!user) {
      setFavorites([])
      return
    }
    try {
      setFavorites(JSON.parse(localStorage.getItem(favoritesKey(user)) || '[]'))
    } catch {
      setFavorites([])
    }
  }, [user])

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
      localStorage.setItem(favoritesKey(user), JSON.stringify(favorites))
    }
  }, [user, favorites])

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

  const handleLogin = (nextUser) => {
    setUser(nextUser)
    setShowLogin(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  const toggleFavorite = (message, scenarioTitle) => {
    if (!user) {
      setShowLogin(true)
      return
    }
    if (!message?.id || !message?.question) return
    setFavorites(prev => {
      if (prev.some(item => item.id === message.id)) {
        return prev.filter(item => item.id !== message.id)
      }
      return [
        {
          id: message.id,
          role: 'assistant',
          question: message.question,
          rounds: message.rounds || [],
          error: message.error,
          scenarioTitle,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]
    })
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Header
        page={page}
        onNavigate={handleNavigate}
        user={user}
        favoritesCount={favorites.length}
        onLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
      />
      <main>
        {page === 'landing' && (
          <LandingPage onStart={handleStart} />
        )}
        {page === 'scenarios' && (
          <ScenarioSelector onSelect={handleSelectScenario} />
        )}
        {page === 'chat' && selectedScenario && (
          <ChatBox
            scenario={selectedScenario}
            user={user}
            favorites={favorites}
            onLoginRequired={() => setShowLogin(true)}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {page === 'favorites' && (
          <FavoritesPage
            user={user}
            favorites={favorites}
            onLogin={() => setShowLogin(true)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>
      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />
      )}
    </div>
  )
}
