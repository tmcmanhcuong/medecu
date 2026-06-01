import axios from 'axios';

// Lấy URL backend từ biến môi trường
const SERVER_BACKEND = import.meta.env.VITE_SERVER_BACKEND || '/api/v1';

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} username - Tên đăng nhập
 * @property {string} email - Email của người dùng
 * @property {string} full_name - Họ và tên đầy đủ
 * @property {string} password - Mật khẩu
 */

/**
 * @typedef {Object} UserData
 * @property {string} username - Tên đăng nhập
 * @property {string} email - Email của người dùng
 * @property {string} full_name - Họ và tên đầy đủ
 * @property {string} id - UUID của người dùng
 * @property {string} created_at - Thời gian tạo (ISO 8601)
 * @property {string} updated_at - Thời gian cập nhật (ISO 8601)
 */

/**
 * @typedef {Object} CreateUserResponse
 * @property {string} message - Thông báo từ server
 * @property {UserData} data - Dữ liệu người dùng
 */

/**
 * @typedef {Object} ValidationError
 * @property {Array<string|number>} loc - Vị trí lỗi
 * @property {string} msg - Thông báo lỗi
 * @property {string} type - Loại lỗi
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {ValidationError[]} detail - Chi tiết lỗi
 */

/**
 * Tạo người dùng mới
 * @param {CreateUserRequest} userData - Thông tin người dùng cần tạo
 * @returns {Promise<CreateUserResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function createUser(userData) {
    try {
        const response = await axios.post(
            `${SERVER_BACKEND}/users/`,
            userData,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}


/**
 * Đăng ký người dùng mới (wrapper cho createUser với tên rõ ràng hơn)
 * @param {string} username - Tên đăng nhập
 * @param {string} email - Email
 * @param {string} fullName - Họ và tên đầy đủ
 * @param {string} password - Mật khẩu
 * @returns {Promise<CreateUserResponse>} Promise chứa response từ server
 */
export async function registerUser(username, email, fullName, password) {
    return createUser({
        username,
        email,
        full_name: fullName,
        password,
    });
}

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [username] - Tên đăng nhập (optional)
 * @property {string} [email] - Email của người dùng (optional)
 * @property {string} [full_name] - Họ và tên đầy đủ (optional)
 */

/**
 * @typedef {Object} UpdateUserResponse
 * @property {string} message - Thông báo từ server
 * @property {UserData} data - Dữ liệu người dùng đã được cập nhật
 */

/**
 * Cập nhật thông tin người dùng
 * @param {string} userId - UUID của người dùng cần cập nhật
 * @param {UpdateUserRequest} userData - Thông tin người dùng cần cập nhật (chỉ gửi các field cần thay đổi)
 * @returns {Promise<UpdateUserResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function updateUser(userId, userData) {
    try {
        const response = await axios.patch(
            `${SERVER_BACKEND}/users`,
            userData,
            {
                params: {
                    user_id: userId,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * @typedef {Object} AuthenticateRequest
 * @property {string} email - Email của người dùng
 * @property {string} password - Mật khẩu
 */

/**
 * @typedef {Object} AuthenticateResponse
 * @property {string} message - Thông báo từ server
 * @property {UserData} data - Dữ liệu người dùng
 */

/**
 * Xác thực người dùng (đăng nhập)
 * @param {string} email - Email của người dùng
 * @param {string} password - Mật khẩu
 * @returns {Promise<AuthenticateResponse>} Promise chứa response với thông tin user
 * @throws {Error} Ném lỗi nếu đăng nhập thất bại
 */
export async function authenticateUser(email, password) {
    try {
        const url = `${SERVER_BACKEND}/users/authenticate`;

        const response = await axios.post(
            url,
            {
                email,
                password,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        // API trả về {message: string, data: {username, email, full_name, id, ...}}
        return response.data;
    } catch (error) {

        // Xử lý lỗi theo status code
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;

            if (status === 404) {
                throw new Error('Tài khoản không tồn tại');
            }

            if (status === 401) {
                throw new Error('Email hoặc mật khẩu không đúng');
            }

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            if (status === 500) {
                if (typeof errorData.detail === 'string' && errorData.detail.trim()) {
                    throw new Error(errorData.detail);
                }
                if (typeof errorData.message === 'string' && errorData.message.trim()) {
                    throw new Error(errorData.message);
                }
                throw new Error('Lỗi server. Vui lòng thử lại sau');
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Đăng nhập người dùng (alias cho authenticateUser với tên dễ hiểu hơn)
 * @param {string} email - Email của người dùng
 * @param {string} password - Mật khẩu
 * @returns {Promise<string>} Promise chứa token xác thực
 */
export async function loginUser(email, password) {
    return authenticateUser(email, password);
}

/**
 * @typedef {Object} DeleteUserResponse
 * @property {string} message - Thông báo từ server
 * @property {Object} data - Dữ liệu bổ sung (nếu có)
 */

/**
 * Xóa người dùng
 * @param {string} userId - UUID của người dùng cần xóa
 * @returns {Promise<DeleteUserResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function deleteUser(userId) {
    try {
        const response = await axios.delete(
            `${SERVER_BACKEND}/users`,
            {
                params: {
                    user_id: userId,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

export default {
    createUser,
    registerUser,
    updateUser,
    authenticateUser,
    loginUser,
    deleteUser,
};
