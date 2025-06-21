import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../assets/styles/login.css'

export default function Login({ setToken }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/user/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login')
      }

      if (data.token) {
        localStorage.setItem('jwt', data.token)
        setToken(data.token)
        navigate('/home')
      } else {
        throw new Error('Token não recebido na resposta')
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro durante o login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={isLoading} className="login-button">
          {isLoading ? 'Carregando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
