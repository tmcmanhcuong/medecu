import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import student from "../../assets/image/student.png"
import teacher from "../../assets/image/teacher.png"

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState("teacher", "student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();

  const detailsUser = useNavigate()

  const handleNext = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        return;
      }

      const SERVER_BACKEND = import.meta.env.VITE_SERVER_BACKEND || '/api/v1';
      const response = await axios.put(
        `${SERVER_BACKEND}/update-role/`,
        { role: selectedRole },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Role updated successfully:', response.data);
      
      localStorage.setItem('user_role', selectedRole);      
      detailsUser("/details-user")
      
    } catch (err) {
      console.error('Error updating role:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to update role');
      } else {
        setError('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Đôi nét về bản thân bạn
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-16">Tôi là...</p>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Role Cards */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mb-12">
          {/* Teacher Card */}
          <button
            onClick={() => !loading && setSelectedRole('teacher')}
            disabled={loading}
            className={`group relative transition-all duration-300 ${
              selectedRole === 'teacher' ? 'scale-105' : 'hover:scale-105'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`relative w-64 h-64 rounded-full overflow-hidden transition-all duration-300 ${
              selectedRole === 'teacher' 
                ? 'ring-4 ring-green-400 shadow-xl' 
                : 'hover:shadow-lg'
            }`}>
              <div className="relative w-full max-w-md flex items-center justify-center">
                <img
                  src={teacher}
                  alt="Sign Up Illustration"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-6">Người dạy</h3>
          </button>

          {/* Student Card */}
          <button
            onClick={() => !loading && setSelectedRole('student')}
            disabled={loading}
            className={`group relative transition-all duration-300 ${
              selectedRole === 'student' ? 'scale-105' : 'hover:scale-105'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`relative w-64 h-64 rounded-full overflow-hidden transition-all duration-300 ${
              selectedRole === 'student' 
                ? 'ring-4 ring-blue-400 shadow-xl' 
                : 'hover:shadow-lg'
            }`}>
              <div className="relative w-full max-w-md flex items-center justify-center">
                <img
                  src={student}
                  alt="Sign Up Illustration"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-6">Người học</h3>
          </button>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!selectedRole || loading}
          className={`inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            selectedRole && !loading
              ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Tiếp theo
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}