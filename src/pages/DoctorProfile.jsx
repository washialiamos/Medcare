import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLocation } from '../contexts/LocationContext'
import { FaStar, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaPhone, FaEnvelope, FaGlobe } from 'react-icons/fa'
import { format } from 'date-fns'

function DoctorProfile() {
  const { id } = useParams()
  const [doctor, setDoctor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { currentLocation, calculateDistance } = useLocation()

  useEffect(() => {
    async function fetchDoctorData() {
      try {
        // Fetch doctor details
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', id)
          .single()

        if (doctorError) throw doctorError
        
        // Calculate distance if location is available
        if (currentLocation && doctorData.latitude && doctorData.longitude) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            doctorData.latitude,
            doctorData.longitude
          )
          doctorData.distance = distance
        }
        
        setDoctor(doctorData)
        
        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            users:user_id (
              id,
              full_name
            )
          `)
          .eq('doctor_id', id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (reviewsError) throw reviewsError
        setReviews(reviewsData || [])
        
        // Fetch available slots
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)
        
        const { data: slotsData, error: slotsError } = await supabase
          .from('available_slots')
          .select('*')
          .eq('doctor_id', id)
          .gte('slot_date', today.toISOString())
          .lte('slot_date', nextWeek.toISOString())
          .eq('is_booked', false)
          .order('slot_date', { ascending: true })

        if (slotsError) throw slotsError
        setAvailableSlots(slotsData || [])
      } catch (error) {
        console.error('Error fetching doctor data:', error)
        setError('Failed to load doctor information')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDoctorData()
    }
  }, [id, currentLocation, calculateDistance])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Doctor not found'}
        </div>
        <div className="mt-4">
          <Link to="/find-doctors" className="text-primary-600 hover:text-primary-700">
            &larr; Back to doctor search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to="/find-doctors" className="text-primary-600 hover:text-primary-700">
          &larr; Back to doctor search
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <img
                src={doctor.profile_image || "https://via.placeholder.com/200?text=Dr"}
                alt={doctor.full_name}
                className="h-48 w-48 rounded-lg object-cover"
              />
            </div>
            <div className="mt-4 md:mt-0 md:ml-6">
              <div className="flex flex-wrap items-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    {doctor.full_name}
                </h1>
                {doctor.is_verified && (
                  <span className="ml-3 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>
              
              <p className="text-lg text-primary-600 mt-1">{doctor.specialty}</p>
              
              <div className="mt-3 flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={`h-5 w-5 ${
                        i < doctor.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {doctor.rating} ({doctor.reviews_count || 0} reviews)
                </span>
              </div>
              
              {doctor.distance && (
                <div className="mt-3 flex items-center text-gray-600">
                  <FaMapMarkerAlt className="mr-2 h-5 w-5 text-gray-500" />
                  <span>{doctor.distance.toFixed(1)} km away</span>
                </div>
              )}
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <FaPhone className="mr-2 h-5 w-5 text-gray-500" />
                  <span>{doctor.phone || 'Not available'}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <FaEnvelope className="mr-2 h-5 w-5 text-gray-500" />
                  <span>{doctor.email || 'Not available'}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <FaGlobe className="mr-2 h-5 w-5 text-gray-500" />
                  <span>{doctor.languages?.join(', ') || 'Not specified'}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <FaClock className="mr-2 h-5 w-5 text-gray-500" />
                  <span>Experience: {doctor.years_of_experience} years</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link
                  to={`/book-appointment/${doctor.id}`}
                  className="btn btn-primary px-8 py-3"
                >
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600">
              {doctor.bio || 'No biography available.'}
            </p>
          </div>
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Education & Qualifications</h2>
            <ul className="space-y-3">
              {doctor.education ? (
                doctor.education.map((edu, index) => (
                  <li key={index} className="flex">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary-600"></div>
                    </div>
                    <p className="ml-3 text-gray-600">{edu}</p>
                  </li>
                ))
              ) : (
                <li className="text-gray-600">No education information available.</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Reviews</h2>
              
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                              {review.users?.full_name?.charAt(0) || 'U'}
                            </div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {review.users?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(review.created_at), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {doctor.reviews_count > 5 && (
                <div className="mt-6 text-center">
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    View all {doctor.reviews_count} reviews
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Slots</h2>
              
              {availableSlots.length === 0 ? (
                <p className="text-gray-600">No available slots in the next 7 days.</p>
              ) : (
                <div className="space-y-4">
                  {availableSlots.slice(0, 5).map(slot => (
                    <div key={slot.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex items-center">
                        <FaCalendarAlt className="h-5 w-5 text-primary-600" />
                        <span className="ml-2 font-medium">
                          {format(new Date(slot.slot_date), 'EEEE, MMMM d')}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center">
                        <FaClock className="h-5 w-5 text-primary-600" />
                        <span className="ml-2">
                          {format(new Date(slot.slot_date), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6">
                <Link
                  to={`/book-appointment/${doctor.id}`}
                  className="btn btn-primary w-full"
                >
                  View All Slots
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              
              {doctor.latitude && doctor.longitude ? (
                <div className="h-48 bg-gray-200 rounded-md mb-4">
                  <MapContainer
                    center={[doctor.latitude, doctor.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[doctor.latitude, doctor.longitude]}>
                      <Popup>
                          {doctor.full_name}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <p className="text-gray-500">Map not available</p>
                </div>
              )}
              
              <div className="flex items-start">
                <FaMapMarkerAlt className="h-5 w-5 text-primary-600 mt-0.5" />
                <p className="ml-2 text-gray-600">
                  {doctor.address || 'Address not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorProfile