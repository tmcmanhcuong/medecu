import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import signinImg from "../../assets/image/signin.png"
import { useNavigate } from "react-router-dom";
import { createUser, authenticateUser } from '../../services/user';
import useAuth from '../../hooks/useAuth';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUppercase: false,
    hasNumber: false
  });

  const signinPage = useNavigate();
  const { login } = useAuth();

  // Check password strength in real-time
  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      hasLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
      setError('Tất cả các trường đều bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (!passwordStrength.hasLength || !passwordStrength.hasUppercase || !passwordStrength.hasNumber) {
      setError('Mật khẩu không đáp ứng yêu cầu');
      return;
    }

    setLoading(true);

    try {
      // Bước 1: Tạo user mới
      const createResponse = await createUser({
        username: formData.username,
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password  // Thêm password
      });

      // Bước 2: Đăng nhập ngay sau khi tạo tài khoản
      const token = await authenticateUser(formData.email, formData.password);

      // Lưu token và thông tin user
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_email', formData.email);
      localStorage.setItem('user_id', createResponse.data.id);
      localStorage.setItem('currentUserId', createResponse.data.id);
      localStorage.setItem('user_username', createResponse.data.username);
      localStorage.setItem('user_fullname', createResponse.data.full_name);

      // Tự động đăng nhập
      await login();

      // Chuyển thẳng đến dashboard
      signinPage('/dashboard');

    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const allStrengthMet = passwordStrength.hasLength && passwordStrength.hasUppercase && passwordStrength.hasNumber;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left Panel - Illustration */}
          <div className="md:w-1/2 bg-[#F9F5EE] p-12 flex flex-col justify-center items-center relative">

            <div className="text-left mb-8 z-10">
              {/* <p className="text-gray-700 dark:text-gray-300 mb-2">Dễ dàng</p> */}
              <h2 className="text-2xl italic font-semibold text-black leading-tight">
                "Bài học sẵn sàng, kiến thức bừng sáng"<br />
                {/* Kế hoạch bài học tự động cho giáo viên */}
              </h2>
            </div>

            <div className="relative w-full max-w-md flex items-center justify-center">
              <img
                src={signinImg}
                alt="Sign Up Illustration"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="md:w-1/2 p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Tạo tài khoản</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Tham gia ngay và bắt đầu tạo các bài học AI ngay hôm nay.</p>

              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Tên đăng nhập*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Họ và tên*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nhập họ và tên đầy đủ"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Email*
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email của bạn"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Mật khẩu*
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tạo mật khẩu mạnh"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>

                  {/* Password Strength Indicators */}
                  {formData.password && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasLength ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                        )}
                        <span className={passwordStrength.hasLength ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                          Ít nhất 8 ký tự
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasUppercase ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                        )}
                        <span className={passwordStrength.hasUppercase ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                          Một chữ cái viết hoa
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {passwordStrength.hasNumber ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-slate-600" />
                        )}
                        <span className={passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}>
                          Một số
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Xác nhận mật khẩu*
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu của bạn"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || !allStrengthMet || !formData.email || formData.password !== formData.confirmPassword}
                  className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                </button>

                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-300 dark:border-slate-600"></div>
                  <span className="px-4 text-sm text-gray-500 dark:text-gray-400">hoặc tiếp tục với</span>
                  <div className="flex-1 border-t border-gray-300 dark:border-slate-600"></div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition"
                  >
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                </div>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                  Đã có tài khoản?{' '}
                  <a href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                    Đăng nhập
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .dark input:-webkit-autofill,
        .dark input:-webkit-autofill:hover,
        .dark input:-webkit-autofill:focus,
        .dark input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #1e293b inset !important;
            -webkit-text-fill-color: #f3f4f6 !important;
        }
      `}</style>
    </div>
  );
}
