import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { FaCalendarAlt, FaUserMd, FaMapMarkerAlt, FaBell, FaClock } from 'react-icons/fa'

function Dashboard() {
  const { user } = useAuth()
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
              profile_image
            )
          `)
          .eq('user_id', user.id)
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(3)

        if (error) throw error
        setUpcomingAppointments(data || [])
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {user?.user_metadata?.full_name || 'User'}
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your appointments and health information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card bg-primary-50 border border-primary-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600">
              <FaCalendarAlt className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
              <p className="text-gray-600">Manage your medical appointments</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/appointments" className="btn btn-primary w-full">
              View All Appointments
            </Link>
          </div>
        </div>

        <div className="card bg-secondary-50 border border-secondary-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-secondary-100 text-secondary-600">
              <FaUserMd className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Find Doctors</h2>
              <p className="text-gray-600">Search for medical professionals</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/find-doctors" className="btn btn-secondary w-full">
              Search Doctors
            </Link>
          </div>
        </div>

        <div className="card bg-gray-50 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100 text-gray-600">
              <FaMapMarkerAlt className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-900">Nearby Clinics</h2>
              <p className="text-gray-600">Find healthcare facilities near you</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/find-doctors" className="btn btn-outline w-full">
              View Map
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Appointments</h2>
          <Link to="/appointments" className="text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">You don't have any upcoming appointments.</p>
            <Link to="/find-doctors" className="btn btn-primary mt-4">
              Book an Appointment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="card border border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <img
                      src={"https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"|| "https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg"}
                      alt={appointment.doctors?.full_name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {appointment.doctors?.full_name}
                    </h3>
                    <p className="text-gray-600">{appointment.doctors?.specialty}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <FaCalendarAlt className="mr-1.5 h-4 w-4 text-gray-400" />
                      {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <FaClock className="mr-1.5 h-4 w-4 text-gray-400" />
                      {format(new Date(appointment.appointment_date), 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between">
                  <button className="btn btn-outline text-sm">Reschedule</button>
                  <button className="btn btn-primary text-sm">Join Call</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Health Notifications</h2>
          <button className="text-primary-600 hover:text-primary-700 font-medium">
            Mark all as read
          </button>
        </div>

        <div className="card border border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <FaBell className="h-5 w-5 text-primary-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete Your Health Profile
              </h3>
              <p className="text-gray-600 mt-1">
                Update your medical history and preferences to get better recommendations.
              </p>
              <div className="mt-4">
                <Link to="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
                  Update Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard