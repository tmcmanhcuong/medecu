import { useState } from 'react';
import forgotPasswordImg from '../../assets/image/forgot-password.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    console.log('Password reset requested for:', email);
    alert('Password reset link sent to your email!');
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Panel - Illustration */}
          <div className="md:w-1/2 bg-forgot p-12 flex items-center justify-center relative">
            {/* Illustration Image */}
            <div className="relative w-full max-w-md flex items-center justify-center">
              <img
                src={forgotPasswordImg}
                alt="Forgot Password Illustration"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Forgot password?</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Don't worry, just enter your email address</p>

              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Email*
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  Continue
                </button>

                <div className="mt-6 text-center">
                  <a href="/signin" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 transition">
                    Back to sign in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}