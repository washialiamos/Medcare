import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">404</h2>
          <p className="text-xl text-gray-600 mb-6">Page Not Found</p>
          <p className="text-gray-500 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound