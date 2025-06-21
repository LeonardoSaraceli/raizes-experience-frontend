import { Route, Routes } from 'react-router-dom'
import Home from './components/Home'
import Login from './components/Login'
import { useState } from 'react'

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt') || null)

  return (
    <Routes>
      <Route path="/home" element={<Home token={token}></Home>} />

      <Route path="*" element={<Login setToken={setToken}></Login>} />
    </Routes>
  )
}
