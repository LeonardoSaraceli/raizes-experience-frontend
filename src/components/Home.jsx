import { useState, useEffect } from 'react'
import {
  FaAngleLeft,
  FaAngleRight,
  FaPlus,
  FaEye,
  FaXmark,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaArrowLeft,
} from 'react-icons/fa6'
import '../assets/styles/home.css'
import { useNavigate } from 'react-router-dom'

export default function Home({ token }) {
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const [formDate, setFormDate] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
    day: null,
  })

  const [popupIndex, setPopupIndex] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [products, setProducts] = useState([])
  const [formData, setFormData] = useState({
    shopify_product_title: '',
    durationHours: '',
    durationMinutes: '',
    startTime: '',
    shopify_product_id: '',
  })

  const [bookings, setBookings] = useState([])
  const [showViewModal, setShowViewModal] = useState(false)

  const [bookingDetails, setBookingDetails] = useState(null)
  const [bookingOrders, setBookingOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/product`, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 403) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          console.error('Fetching error')
          return
        }

        return res.json()
      })
      .then((data) => {
        if (data) {
          setProducts(data)
        }
      })
      .catch(console.error)
  }, [navigate, token])

  const getDaysOfMonth = (year, month) => {
    const date = new Date(year, month, 1)
    const days = []

    while (date.getMonth() === month) {
      days.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }

    return days
  }

  const isPast = (day) => {
    const compareDate = new Date(day)
    compareDate.setHours(0, 0, 0, 0)

    return compareDate < currentDate
  }

  const daysOfMonth = getDaysOfMonth(formDate.year, formDate.month)

  const handleCreate = () => {
    setShowModal(true)
    setPopupIndex(null)
  }

  const handleView = () => {
    if (!formDate.day) return

    const { year, month, day } = formDate
    const date = new Date(year, month, day + 1)
    const isoDate = date.toISOString()

    fetch(
      `${
        import.meta.env.VITE_BACKEND_URL
      }/booking?start_datetime=${encodeURIComponent(isoDate)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (res.status === 403) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          console.error('Erro ao buscar agendamentos')
          return
        }
        return res.json()
      })
      .then((data) => {
        if (data && data.bookings) {
          setBookings(data.bookings)
          setShowViewModal(true)
        }
      })
      .catch(console.error)
  }

  const formatDuration = (duration) => {
    if (!duration || typeof duration !== 'object') return ''
    const parts = []
    if (duration.hours) parts.push(`${duration.hours}h`)
    if (duration.minutes) parts.push(`${duration.minutes}min`)
    return parts.join(' ')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const { year, month, day } = formDate
    const [hours, minutes] = formData.startTime.split(':')
    const fullDate = new Date(year, month, day, hours, minutes)

    // Montar a string de duração
    const h = parseInt(formData.durationHours, 10)
    const m = parseInt(formData.durationMinutes, 10)
    const durationParts = []
    if (h) durationParts.push(`${h} hour${h > 1 ? 's' : ''}`)
    if (m) durationParts.push(`${m} minute${m > 1 ? 's' : ''}`)
    const duration = durationParts.join(' ')

    fetch(`${import.meta.env.VITE_BACKEND_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shopify_product_title: formData.shopify_product_title,
        duration,
        start_datetime: fullDate.toISOString(),
        shopify_product_id: formData.shopify_product_id.split('/').pop(),
      }),
    })
      .then((res) => {
        if (res.status === 403) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          console.error('Erro ao enviar')
          return
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setShowModal(false)
          setFormData({
            durationHours: '',
            durationMinutes: '',
            startTime: '',
            shopify_product_id: '',
          })
        }
      })
  }

  const handleDeleteBooking = (bookingId) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/booking/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 403) {
            navigate('/login')
            return
          }

          if (res.ok) {
            setBookings(bookings.filter((b) => b.id !== bookingId))
          } else {
            alert('Erro ao excluir agendamento')
          }
        })
        .catch(console.error)
    }
  }

  const fetchBookingOrders = (booking) => {
    setLoadingOrders(true)
    setBookingDetails(booking)

    const productId = booking.shopify_product_id.split('/').pop()

    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/product/${productId}?bookingId=${
        booking.id
      }`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (res.status === 403) {
          navigate('/login')
          return
        }

        if (!res.ok) {
          throw new Error('Erro ao buscar pedidos')
        }
        return res.json()
      })
      .then((data) => {
        setBookingOrders(data.orders || [])
        setLoadingOrders(false)
      })
      .catch((error) => {
        console.error('Erro:', error)
        setLoadingOrders(false)
        alert('Não foi possível carregar os pedidos')
      })
  }

  const handleBackToBookings = () => {
    setBookingDetails(null)
    setBookingOrders([])
  }

  return (
    <main>
      <header>
        <div>
          <FaAngleLeft
            onClick={() => {
              setFormDate((prev) => {
                const newMonth = prev.month === 0 ? 11 : prev.month - 1
                const newYear = prev.month === 0 ? prev.year - 1 : prev.year
                return { ...prev, month: newMonth, year: newYear, day: null }
              })
              setPopupIndex(null)
            }}
          />
          <FaAngleRight
            onClick={() => {
              setFormDate((prev) => {
                const newMonth = prev.month === 11 ? 0 : prev.month + 1
                const newYear = prev.month === 11 ? prev.year + 1 : prev.year
                return { ...prev, month: newMonth, year: newYear, day: null }
              })
              setPopupIndex(null)
            }}
          />
        </div>
        <span>
          {monthNames[formDate.month]} de {formDate.year}
        </span>
      </header>

      <ul id="days-list">
        {daysOfMonth.map((day, index) => {
          const dayNum = day.getDate()
          const isPastDay = isPast(day)
          const active = formDate.day === dayNum

          return (
            <li
              key={day.toISOString()}
              style={{
                borderBottom: dayNum < 29 ? '1px solid lightgrey' : undefined,
                borderRight:
                  dayNum % 7 !== 0 ? '1px solid lightgrey' : undefined,
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => {
                setFormDate((prev) => ({ ...prev, day: dayNum }))
                setPopupIndex(index)
              }}
              className={`${isPastDay ? 'inactive' : active ? 'active' : ''}`}
            >
              <div
                className={`date ${
                  isPastDay ? 'inactive' : active ? 'active' : ''
                }`}
              >
                <span>{dayNum}</span>
              </div>

              {popupIndex === index && (
                <div
                  className="popup"
                  style={{
                    top: index <= 7 ? '0' : undefined,
                  }}
                >
                  {!isPastDay && (
                    <button onClick={handleCreate}>
                      <FaPlus /> Criar
                    </button>
                  )}
                  <button onClick={handleView}>
                    <FaEye /> Visualizar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFormDate((prev) => ({ ...prev, day: null }))
                      setPopupIndex(null)
                    }}
                  >
                    <FaXmark /> Fechar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar agendamento</h2>
              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                <FaXmark />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Data selecionada:</label>
                <div className="selected-date">
                  {formDate.day} de {monthNames[formDate.month]} de{' '}
                  {formDate.year}
                </div>
              </div>

              <div className="form-group">
                <label>Horário de início: *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Duração: *</label>
                <div className="duration-inputs">
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      placeholder="Horas"
                      value={formData.durationHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationHours: e.target.value,
                        })
                      }
                      required
                    />
                    <span>h</span>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutos"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: e.target.value,
                        })
                      }
                      required
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Produto: *</label>
                <select
                  value={formData.shopify_product_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shopify_product_title:
                        e.target.options[e.target.selectedIndex].text,
                      shopify_product_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-btn">
                  Criar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowViewModal(false)
            setBookings([])
            setBookingDetails(null)
            setBookingOrders([])
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {bookingDetails ? (
                <>
                  <button
                    className="back-button"
                    onClick={handleBackToBookings}
                  >
                    <FaArrowLeft /> Voltar
                  </button>
                  <h2>Detalhes do Agendamento</h2>
                </>
              ) : (
                <h2>
                  Agendamentos para {formDate.day} de{' '}
                  {monthNames[formDate.month]} de {formDate.year}
                </h2>
              )}
              <button
                className="close-button"
                onClick={() => {
                  setShowViewModal(false)
                  setBookings([])
                  setBookingDetails(null)
                  setBookingOrders([])
                }}
              >
                <FaXmark />
              </button>
            </div>

            {bookingDetails ? (
              <div className="booking-details-container">
                {loadingOrders ? (
                  <p>Carregando pedidos...</p>
                ) : (
                  <>
                    <div className="booking-summary">
                      <h3>
                        {bookingDetails.shopify_product_title ||
                          'Produto sem nome'}
                      </h3>
                      <p>
                        <strong>Horário:</strong>{' '}
                        {new Date(
                          bookingDetails.start_datetime
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p>
                        <strong>Duração:</strong>{' '}
                        {formatDuration(bookingDetails.duration)}
                      </p>
                    </div>

                    <div className="orders-container">
                      <h4>Pedidos Relacionados</h4>
                      {bookingOrders.length > 0 ? (
                        <ul className="orders-list">
                          {bookingOrders.map((order) => (
                            <li key={order.id} className="order-item">
                              <div className="order-header">
                                <span className="order-name">
                                  Pedido #{order.name}
                                </span>
                                <span className="order-date">
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="customer-info">
                                {order.customer?.name && (
                                  <p>
                                    <strong>Cliente:</strong>{' '}
                                    {order.customer.name}
                                  </p>
                                )}
                                {order.customer?.email && (
                                  <p>
                                    <strong>Email:</strong>{' '}
                                    <a
                                      href={`mailto:${order.customer.email}`}
                                      className="contact-link"
                                    >
                                      {order.customer.email} <FaEnvelope />
                                    </a>
                                  </p>
                                )}
                                {order.customer?.phone && (
                                  <p>
                                    <strong>Telefone:</strong>{' '}
                                    <a
                                      href={`tel:${order.customer.phone}`}
                                      className="contact-link"
                                    >
                                      {order.customer.phone} <FaPhone />
                                    </a>
                                  </p>
                                )}
                              </div>

                              <div className="order-details">
                                <p>
                                  <strong>Total:</strong>{' '}
                                  {order.totalPrice?.amount}{' '}
                                  {order.totalPrice?.currencyCode}
                                </p>
                                <p>
                                  <strong>Quantidade:</strong> {order.quantity}
                                </p>
                                <p>
                                  <strong>IDs de Reserva:</strong>{' '}
                                  {order.bookingIds?.join(', ') || 'Nenhum'}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="no-orders">
                          Nenhum pedido encontrado para este agendamento.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {bookings.length === 0 ? (
                  <div className="no-bookings">
                    <p>Nenhum agendamento encontrado para esta data</p>
                    {!isPast(
                      new Date(formDate.year, formDate.month, formDate.day)
                    ) && (
                      <button
                        className="create-btn"
                        onClick={() => {
                          setShowViewModal(false)
                          setShowModal(true)
                        }}
                      >
                        <FaPlus /> Criar Novo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bookings-container">
                    <ul className="bookings-list">
                      {bookings.map((booking) => (
                        <li
                          key={booking.id}
                          onClick={() => fetchBookingOrders(booking)}
                        >
                          <div className="booking-info">
                            <div className="booking-time">
                              {new Date(
                                booking.start_datetime
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div className="booking-details">
                              <div className="booking-title">
                                {booking.shopify_product_title ||
                                  'Produto sem nome'}
                              </div>
                              <div className="booking-duration">
                                {formatDuration(booking.duration)}
                              </div>
                            </div>
                          </div>
                          {!isPast(
                            new Date(
                              formDate.year,
                              formDate.month,
                              formDate.day
                            )
                          ) && (
                            <button
                              className="delete-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteBooking(booking.id)
                              }}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>

                    {!isPast(
                      new Date(formDate.year, formDate.month, formDate.day)
                    ) && (
                      <button
                        className="create-btn"
                        onClick={() => {
                          setShowViewModal(false)
                          setShowModal(true)
                        }}
                      >
                        <FaPlus /> Adicionar Outro
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
