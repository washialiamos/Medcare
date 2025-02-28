import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { format, parseISO, addDays } from 'date-fns'
import { FaCalendarAlt, FaClock, FaUserMd, FaMapMarkerAlt } from 'react-icons/fa'

function BookAppointment() {
  const { doctorId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [doctor, setDoctor] = useState(null)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [appointmentType, setAppointmentType] = useState('video')
  const [appointmentReason, setAppointmentReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  // Generate date range for the next 14 days
  const dateRange = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))
  
  useEffect(() => {
    async function fetchDoctorAndSlots() {
      try {
        // Fetch doctor details
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single()

        if (doctorError) throw doctorError
        setDoctor(doctorData)
        
        // Fetch available slots for the selected date
        await fetchAvailableSlots(selectedDate)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to load doctor information')
      } finally {
        setLoading(false)
      }
    }

    if (doctorId) {
      fetchDoctorAndSlots()
    }
  }, [doctorId])
  
  async function fetchAvailableSlots(date) {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      const { data, error } = await supabase
        .from('available_slots')
        .select('*')
        .eq('doctor_id', doctorId)
        .gte('slot_date', startOfDay.toISOString())
        .lte('slot_date', endOfDay.toISOString())
        .eq('is_booked', false)
        .order('slot_date', { ascending: true })

      if (error) throw error
      setAvailableSlots(data || [])
      setSelectedSlot(null) // Reset selected slot when date changes
    } catch (error) {
      console.error('Error fetching slots:', error)
      setError('Failed to load available appointment slots')
    }
  }
  
  const handleDateChange = (date) => {
    setSelectedDate(date)
    fetchAvailableSlots(date)
  }
  
  const handleSlotSelection = (slot) => {
    setSelectedSlot(slot)
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedSlot) {
      setError('Please select an appointment time')
      return
    }
    
    if (!appointmentReason.trim()) {
      setError('Please provide a reason for your appointment')
      return
    }
    
    try {
      setError(null)
      setSubmitting(true)
      
      // Create appointment record
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert([
          {
            user_id: user.id,
            doctor_id: doctorId,
            appointment_date: selectedSlot.slot_date,
            appointment_type: appointmentType,
            reason: appointmentReason,
            status: 'scheduled'
          }
        ])
        .select()

      if (appointmentError) throw appointmentError
      
      // Update slot to mark as booked
      const { error: slotError } = await supabase
        .from('available_slots')
        .update({ is_booked: true })
        .eq('id', selectedSlot.id)

      if (slotError) throw slotError
      
      setSuccess(true)
      
      // Redirect to appointments page after a delay
      setTimeout(() => {
        navigate('/appointments')
      }, 3000)
    } catch (error) {
      console.error('Error booking appointment:', error)
      setError('Failed to book appointment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error && !doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <div className="mt-4">
          <Link to="/find-doctors" className="text-primary-600 hover:text-primary-700">
            &larr; Back to doctor search
          </Link>
        </div>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Appointment booked successfully!</p>
          <p className="mt-2">You will be redirected to your appointments page shortly.</p>
        </div>
        <Link to="/appointments" className="btn btn-primary">
          View My Appointments
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link to={`/doctor/${doctorId}`} className="text-primary-600 hover:text-primary-700">
          &larr; Back to doctor profile
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Book an Appointment</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Date & Time</h2>
              
              {/* Date selection */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Date</h3>
                <div className="flex overflow-x-auto pb-2 space-x-2">
                  {dateRange.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateChange(date)}
                      className={`flex flex-col items-center p-3 rounded-lg min-w-[100px] ${
                        selectedDate.toDateString() === date.toDateString()
                          ? 'bg-primary-100 border-2 border-primary-500'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-500">
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {format(date, 'd')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(date, 'MMM')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time slot selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Time</h3>
                
                {availableSlots.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-600">No available slots for this date.</p>
                    <p className="text-gray-500 mt-2">Please select another date or check back later.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelection(slot)}
                        className={`p-3 rounded-lg text-center ${
                          selectedSlot?.id === slot.id
                            ? 'bg-primary-100 border-2 border-primary-500'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span className="block text-sm font-medium">
                          {format(parseISO(slot.slot_date), 'h:mm a')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Appointment Details</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAppointmentType('video')}
                      className={`p-4 rounded-lg border ${
                        appointmentType === 'video'
                          ? 'bg-primary-50 border-primary-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-3 text-left">
                          <h3 className="text-sm font-medium text-gray-900">Video Consultation</h3>
                          <p className="text-xs text-gray-500">Meet online via video call</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAppointmentType('in-person')}
                      className={`p-4 rounded-lg border ${
                        appointmentType === 'in-person'
                          ? 'bg-primary-50 border-primary-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="ml-3 text-left">
                          <h3 className="text-sm font-medium text-gray-900">In-Person Visit</h3>
                          <p className="text-xs text-gray-500">Visit the doctor's clinic</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="appointmentReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Visit
                  </label>
                  <textarea
                    id="appointmentReason"
                    rows={4}
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    placeholder="Please describe your symptoms or reason for consultation..."
                    className="input"
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedSlot || submitting}
                    className="btn btn-primary px-8 py-3"
                  >
                    {submitting ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Appointment Summary</h2>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-start mb-4">
                  <img
                    src={doctor?.profile_image || "https://via.placeholder.com/60?text=Dr"}
                    alt={doctor?.full_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                        {doctor?.full_name}
                    </h3>
                    <p className="text-primary-600">{doctor?.specialty}</p>
                  </div>
                </div>
                
                {selectedSlot && (
                  <>
                    <div className="flex items-center py-3 border-t border-gray-200">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                      <span className="ml-3 text-gray-600">
                        {format(parseISO(selectedSlot.slot_date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center py-3 border-t border-gray-200">
                      <FaClock className="h-5 w-5 text-gray-400" />
                      <span className="ml-3 text-gray-600">
                        {format(parseISO(selectedSlot.slot_date), 'h:mm a')}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex items-center py-3 border-t border-gray-200">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="ml-3 text-gray-600">
                    {appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                  </span>
                </div>
                
                {appointmentType === 'in-person' && doctor?.address && (
                  <div className="flex items-start py-3 border-t border-gray-200">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="ml-3 text-gray-600">
                      {doctor.address}
                    </span>
                  </div>
                )}
                
                <div className="mt-6 bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Consultation Fee</span>
                    <span className="font-medium">${doctor?.consultation_fee || '0.00'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">$5.00</span>
                  </div>
                  
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-bold">${(doctor?.consultation_fee || 0) + 5}.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookAppointment