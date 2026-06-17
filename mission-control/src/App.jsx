import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import MissionControl from './pages/MissionControl.jsx'
import JarvisWall from './pages/JarvisWall.jsx'
import Tasks from './pages/Tasks.jsx'
import Studio from './pages/Studio.jsx'
import AgentRoom from './pages/AgentRoom.jsx'
import Goals from './pages/Goals.jsx'
import Memory from './pages/Memory.jsx'
import Journal from './pages/Journal.jsx'
import Standards from './pages/Standards.jsx'
import Skills from './pages/Skills.jsx'
import Settings from './pages/Settings.jsx'

const POLL_INTERVAL = 4000

function App() {
  const [gatewayStatus, setGatewayStatus] = useState({ status: 'unknown', timestamp: null })
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [sharedLog, setSharedLog] = useState([])

  const fetchGateway = useCallback(async () => {
    try {
      const res = await fetch('/api/gateway/health')
      const data = await res.json()
      setGatewayStatus(data)
    } catch {
      setGatewayStatus({ status: 'offline', timestamp: new Date().toISOString() })
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch {}
  }, [])

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/activity')
      const data = await res.json()
      setActivity(data.entries || [])
    } catch {}
  }, [])

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch('/api/log')
      const data = await res.json()
      setSharedLog(data.messages || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchGateway()
    fetchTasks()
    fetchActivity()
    fetchLog()

    const gatewayInterval = setInterval(fetchGateway, POLL_INTERVAL)
    const dataInterval = setInterval(() => {
      fetchTasks()
      fetchActivity()
      fetchLog()
    }, 8000)

    return () => {
      clearInterval(gatewayInterval)
      clearInterval(dataInterval)
    }
  }, [fetchGateway, fetchTasks, fetchActivity, fetchLog])

  const addTask = async (task) => {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      fetchTasks()
    } catch {}
  }

  const updateTask = async (id, updates) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      fetchTasks()
    } catch {}
  }

  const deleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      fetchTasks()
    } catch {}
  }

  const addLogMessage = async (msg) => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      })
      fetchLog()
    } catch {}
  }

  const sharedProps = {
    gatewayStatus,
    tasks,
    activity,
    sharedLog,
    addTask,
    updateTask,
    deleteTask,
    addLogMessage,
    refetchTasks: fetchTasks,
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MissionControl {...sharedProps} />} />
        <Route path="/jarvis" element={<JarvisWall gatewayStatus={gatewayStatus} />} />
        <Route path="/tasks" element={<Tasks {...sharedProps} />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/agent/:id" element={<AgentRoom gatewayStatus={gatewayStatus} activity={activity} />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/standards" element={<Standards />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
