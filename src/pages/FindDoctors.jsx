import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useLocation } from "../contexts/LocationContext";
import { FaSearch, FaMapMarkerAlt, FaStar, FaFilter } from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  const [filters, setFilters] = useState({
    specialty: "",
    searchTerm: "",
    maxDistance: 50, // in kilometers
  });

  const { currentLocation, locationError, calculateDistance } = useLocation();

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const { data: doctorsData, error: doctorsError } = await supabase
          .from("doctors")
          .select("*")
          .order("full_name");

        if (doctorsError) throw doctorsError;

        // Get unique specialties for filter
        const uniqueSpecialties = [
          ...new Set(doctorsData.map((doctor) => doctor.specialty)),
        ];
        setSpecialties(uniqueSpecialties);

        setDoctors(doctorsData || []);
        setFilteredDoctors(doctorsData || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setError("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      let results = [...doctors];

      // Filter by specialty
      if (filters.specialty) {
        results = results.filter(
          (doctor) => doctor.specialty === filters.specialty
        );
      }

      // Filter by search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        results = results.filter(
          (doctor) =>
            doctor.full_name.toLowerCase().includes(term) ||
            doctor.specialty.toLowerCase().includes(term) ||
            (doctor.bio && doctor.bio.toLowerCase().includes(term))
        );
      }

      // Filter by distance if location is available
      if (currentLocation) {
        results = results.filter((doctor) => {
          if (!doctor.latitude || !doctor.longitude) return true;

          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            doctor.latitude,
            doctor.longitude
          );

          doctor.distance = distance; // Add distance property
          return distance <= filters.maxDistance;
        });

        // Sort by distance
        results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setFilteredDoctors(results);
    }
  }, [filters, doctors, currentLocation, calculateDistance]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Filters are already applied via useEffect
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Find Doctors</h1>
        <p className="text-gray-600 mt-2">
          Search for medical professionals near you
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="md:col-span-2">
            <label
              htmlFor="searchTerm"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="searchTerm"
                name="searchTerm"
                placeholder="Search by name, specialty, or keyword"
                value={filters.searchTerm}
                onChange={handleFilterChange}
                className="input pl-10"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="specialty"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Specialty
            </label>
            <select
              id="specialty"
              name="specialty"
              value={filters.specialty}
              onChange={handleFilterChange}
              className="input"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="maxDistance"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Distance (km)
            </label>
            <select
              id="maxDistance"
              name="maxDistance"
              value={filters.maxDistance}
              onChange={handleFilterChange}
              className="input"
              disabled={!currentLocation}
            >
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
        </form>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            {filteredDoctors.length} doctors found
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-md ${
              viewMode === "list"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-2 rounded-md ${
              viewMode === "map"
                ? "bg-primary-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No doctors found matching your criteria.
          </p>
          <button
            onClick={() =>
              setFilters({ specialty: "", searchTerm: "", maxDistance: 50 })
            }
            className="btn btn-primary"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start">
                  <img
                    src={
                      "https://as1.ftcdn.net/v2/jpg/02/38/16/04/1000_F_238160486_6COQd3Sotf3ecOP3Qwsy7zB5WlUOHVrE.jpg" ||
                      doctor.profile_image
                    }
                    alt={doctor.full_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {doctor.full_name}
                    </h3>
                    <p className="text-primary-600">{doctor.specialty}</p>

                    <div className="mt-2 flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={`h-4 w-4 ${
                              i < doctor.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        ({doctor.reviews_count || 0} reviews)
                      </span>
                    </div>

                    {currentLocation && doctor.latitude && doctor.longitude && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FaMapMarkerAlt className="mr-1.5 h-4 w-4 text-gray-400" />
                        {doctor.distance
                          ? `${doctor.distance.toFixed(1)} km away`
                          : "Distance unknown"}
                      </div>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-gray-600 line-clamp-3">
                  {doctor.bio || "No biography available."}
                </p>

                <div className="mt-6 flex justify-between">
                  <Link
                    to={`/doctor/${doctor.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/book-appointment/${doctor.id}`}
                    className="btn btn-primary"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="bg-white rounded-lg shadow-md overflow-hidden"
          style={{ height: "600px" }}
        >
          {currentLocation ? (
            <MapContainer
              center={[currentLocation.latitude, currentLocation.longitude]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Current location marker */}
              <Marker
                position={[currentLocation.latitude, currentLocation.longitude]}
              >
                <Popup>Your current location</Popup>
              </Marker>

              {/* Doctor markers */}
              {filteredDoctors.map((doctor) => {
                if (!doctor.latitude || !doctor.longitude) return null;

                return (
                  <Marker
                    key={doctor.id}
                    position={[doctor.latitude, doctor.longitude]}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-semibold">
                          Dr. {doctor.full_name}
                        </h3>
                        <p className="text-sm text-primary-600">
                          {doctor.specialty}
                        </p>
                        {doctor.distance && (
                          <p className="text-xs text-gray-500 mt-1">
                            {doctor.distance.toFixed(1)} km away
                          </p>
                        )}
                        <Link
                          to={`/doctor/${doctor.id}`}
                          className="text-xs text-primary-600 block mt-2"
                        >
                          View Profile
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-6">
                <FaMapMarkerAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Location Access Required
                </h3>
                <p className="text-gray-600">
                  {locationError ||
                    "Please enable location services to view doctors on the map."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FindDoctors;
