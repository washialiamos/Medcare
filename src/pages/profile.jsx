import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaIdCard, FaMapMarkerAlt } from 'react-icons/fa'

function Profile() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (user) {
      // Initialize form with user data
      setFormData({
        fullName: user.user_metadata?.full_name || '',
        phoneNumber: user.user_metadata?.phone_number || '',
        dateOfBirth: user.user_metadata?.date_of_birth || '',
        address: user.user_metadata?.address || '',
        gender: user.user_metadata?.gender || '',
        emergencyContact: user.user_metadata?.emergency_contact || '',
        medicalHistory: user.user_metadata?.medical_history || '',
        allergies: user.user_metadata?.allergies || '',
        currentMedications: user.user_metadata?.current_medications || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setMessage({ type: '', text: '' })
      
      const userData = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        gender: formData.gender,
        emergency_contact: formData.emergencyContact,
        medical_history: formData.medicalHistory,
        allergies: formData.allergies,
        current_medications: formData.currentMedications,
      }
      
      const { error } = await updateProfile(userData)
      
      if (error) throw error
      
      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-400' 
            : 'bg-red-100 text-red-700 border border-red-400'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-outline"
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaUser className="inline mr-2 text-gray-500" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{formData.fullName || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaEnvelope className="inline mr-2 text-gray-500" />
                  Email Address
                </label>
                <p className="text-gray-900 py-2">{user?.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaPhone className="inline mr-2 text-gray-500" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{formData.phoneNumber || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaBirthdayCake className="inline mr-2 text-gray-500" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{formData.dateOfBirth || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaIdCard className="inline mr-2 text-gray-500" />
                  Gender
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2">
                    {formData.gender ? 
                      formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 
                      'Not provided'}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                  />
                ) : (
                  <p className="text-gray-900 py-2">{formData.address || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaPhone className="inline mr-2 text-gray-500" />
                  Emergency Contact
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className="input"
                    disabled={loading}
                    placeholder="Name: Relationship: Phone:"
                  />
                ) : (
                  <p className="text-gray-900 py-2">{formData.emergencyContact || 'Not provided'}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical History
                  </label>
                  {isEditing ? (
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      rows={3}
                      className="input"
                      disabled={loading}
                      placeholder="List any significant medical conditions or past surgeries"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.medicalHistory || 'None provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allergies
                  </label>
                  {isEditing ? (
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      rows={2}
                      className="input"
                      disabled={loading}
                      placeholder="List any allergies to medications, foods, or other substances"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.allergies || 'None provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Medications
                  </label>
                  {isEditing ? (
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={handleChange}
                      rows={2}
                      className="input"
                      disabled={loading}
                      placeholder="List any medications you are currently taking"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{formData.currentMedications || 'None provided'}</p>
                  )}
                </div>
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Settings</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600 mt-1">
                Update your password to keep your account secure.
              </p>
              <button className="mt-2 btn btn-outline">
                Change Password
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-md font-medium text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-600 mt-1">
                Permanently delete your account and all associated data.
              </p>
              <button className="mt-2 btn btn-outline text-red-600 border-red-300 hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile