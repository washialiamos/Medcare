import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO, isPast } from 'date-fns'
import { FaCalendarAlt, FaClock, FaVideo, FaHospital, FaEllipsisH } from 'react-icons/fa'

function Appointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionMenuOpen, setActionMenuOpen] = useState(null)

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            doctors:doctor_id (
              id,
              full_name,
              specialty,
              profile_image,
              email,
              phone
            )
          `)
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: true })

        if (error) throw error
        setAppointments(data || [])
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setError('Failed to load your appointments')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAppointments()
    }
  }, [user])

  const upcomingAppointments = appointments.filter(
    app => !isPast(parseISO(app.appointment_date)) || app.status === 'scheduled'
  )
  
  const pastAppointments = appointments.filter(
    app => isPast(parseISO(app.appointment_date)) && app.status !== 'scheduled'
  )

  const toggleActionMenu = (id) => {
    if (actionMenuOpen === id) {
      setActionMenuOpen(null)
    } else {
      setActionMenuOpen(id)
    }
  }

  const handleCancelAppointment = async (id) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.id === id ? { ...app, status: 'cancelled' } : app
      ))
      
      setActionMenuOpen(null)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Failed to cancel appointment')
    }
  }

  const handleRescheduleAppointment = (doctorId) => {
    // Close action menu and navigate to booking page
    setActionMenuOpen(null)
    // This would typically navigate to a reschedule page or modal
    // For now, we'll just redirect to the booking page
    window.location.href = `/book-appointment/${doctorId}`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Appointments</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming ({upcomingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past ({pastAppointments.length})
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'upcoming' && (
            <>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming appointments</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by booking a consultation with a doctor.</p>
                  <div className="mt-6">
                    <Link to="/find-doctors" className="btn btn-primary">
                      Find a Doctor
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img
                              src={"https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"|| "https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"}
                              alt={appointment.doctors?.full_name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                            <div className="ml-4">
                              <h3 className="text-lg font-medium text-gray-900">
                                Dr. {appointment.doctors?.full_name}
                              </h3>
                              <p className="text-primary-600">{appointment.doctors?.specialty}</p>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={() => toggleActionMenu(appointment.id)}
                              className="p-2 rounded-full hover:bg-gray-100"
                            >
                              <FaEllipsisH className="h-5 w-5 text-gray-500" />
                            </button>
                            
                            {actionMenuOpen === appointment.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                <div className="py-1">
                                  {appointment.status !== 'cancelled' && (
                                    <>
                                      <button
                                        onClick={() => handleRescheduleAppointment(appointment.doctor_id)}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                        Reschedule
                                      </button>
                                      <button
                                        onClick={() => handleCancelAppointment(appointment.id)}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      >
                                        Cancel Appointment
                                      </button>
                                    </>
                                  )}
                                  <a
                                    href={`mailto:${appointment.doctors?.email}`}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Contact Doctor
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                            <span className="ml-2 text-gray-600">
                              {format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <FaClock className="h-5 w-5 text-gray-400" />
                            <span className="ml-2 text-gray-600">
                              {format(parseISO(appointment.appointment_date), 'h:mm a')}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            {appointment.appointment_type === 'video' ? (
                              <FaVideo className="h-5 w-5 text-gray-400" />
                            ) : (
                              <FaHospital className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="ml-2 text-gray-600">
                              {appointment.appointment_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                            </span>
                          </div>
                        </div>
                        
                        {appointment.reason && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Reason for Visit:</h4>
                            <p className="mt-1 text-sm text-gray-600">{appointment.reason}</p>
                          </div>
                        )}
                        
                        <div className="mt-6 flex flex-wrap gap-3">
                          {appointment.status === 'scheduled' && isPast(new Date(appointment.appointment_date)) ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Missed
                            </span>
                          ) : appointment.status === 'cancelled' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Confirmed
                            </span>
                          )}
                          
                          {appointment.appointment_type === 'video' && appointment.status === 'scheduled' && (
                            <button className="btn btn-primary text-sm">
                              Join Video Call
                            </button>
                          )}
                          
                          {appointment.status === 'scheduled' && (
                            <button 
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="btn btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'past' && (
            <>
              {pastAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No past appointments</h3>
                  <p className="mt-1 text-sm text-gray-500">Your appointment history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pastAppointments.map((appointment) => (
                    <div key={appointment.id} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center">
                          <img
                            src={"https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"|| "https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"}
                            alt={appointment.doctors?.full_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              Dr. {appointment.doctors?.full_name}
                            </h3>
                            <p className="text-primary-600">{appointment.doctors?.specialty}</p>
                          </div>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                            <span className="ml-2 text-gray-600">
                              {format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <FaClock className="h-5 w-5 text-gray-400" />
                            <span className="ml-2 text-gray-600">
                              {format(parseISO(appointment.appointment_date), 'h:mm a')}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            {appointment.appointment_type === 'video' ? (
                              <FaVideo className="h-5 w-5 text-gray-400" />
                            ) : (
                              <FaHospital className="h-5 w-5 text-gray-400" />
                            )}
                            <span className="ml-2 text-gray-600">
                              {appointment.appointment_type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                            </span>
                          </div>
                        </div>
                        
                        {appointment.reason && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Reason for Visit:</h4>
                            <p className="mt-1 text-sm text-gray-600">{appointment.reason}</p>
                          </div>
                        )}
                        
                        <div className="mt-6 flex flex-wrap gap-3">
                          {appointment.status === 'completed' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Cancelled
                            </span>
                          )}
                          
                          {appointment.status === 'completed' && (
                            <Link to={`/doctor/${appointment.doctor_id}`} className="btn btn-outline text-sm">
                              Book Again
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Appointments