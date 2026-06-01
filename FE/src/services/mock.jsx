// Bộ dữ liệu giả để dùng khi không gọi API

export const mockExercises = [
  {
    id: "ex_01",
    prompt: "Thuật toán nào dưới đây có độ phức tạp thời gian trung bình O(n log n)?",
    options: [
      "A. Thuật toán sắp xếp chèn (Insertion Sort)",
      "B. Thuật toán sắp xếp chọn (Selection Sort)",
      "C. Thuật toán sắp xếp nhanh (Quick Sort)",
      "D. Thuật toán sắp xếp nổi bọt (Bubble Sort)",
    ],
    correct_answer: "C",
    explanation:
      "Quick Sort đạt O(n log n) trung bình nhờ chia mảng thành hai phần gần cân bằng.",
    difficulty: "medium",
    tags: ["Thuật toán", "Độ phức tạp"],
  },
  {
    id: "ex_02",
    prompt: "Kiến trúc mạng nào phù hợp nhất để xử lý chuỗi thời gian?",
    options: [
      "A. Mạng nơ-ron tích chập (CNN)",
      "B. Mạng nơ-ron hồi tiếp (RNN/LSTM)",
      "C. Mạng nơ-ron truyền thẳng (FFN)",
      "D. Perceptron đơn lớp",
    ],
    correct_answer: "B",
    explanation:
      "RNN/LSTM lưu trạng thái qua các bước thời gian, phù hợp cho dữ liệu chuỗi.",
    difficulty: "easy",
    tags: ["AI", "Deep Learning"],
  },
  {
    id: "ex_03",
    prompt: "Trong cơ sở dữ liệu quan hệ, khóa ngoại (foreign key) dùng để làm gì?",
    options: [
      "A. Định danh duy nhất một bản ghi trong bảng",
      "B. Liên kết dữ liệu giữa hai bảng",
      "C. Tăng tốc truy vấn bằng chỉ mục",
      "D. Mã hóa dữ liệu nhạy cảm",
    ],
    correct_answer: "B",
    explanation:
      "Khóa ngoại tạo mối quan hệ ràng buộc toàn vẹn giữa bảng hiện tại và bảng khác.",
    difficulty: "easy",
    tags: ["Database", "Ràng buộc"],
  },
  {
    id: "ex_04",
    prompt: "HTTP status code nào biểu thị tài nguyên đã được tạo thành công?",
    options: [
      "A. 200 OK",
      "B. 201 Created",
      "C. 204 No Content",
      "D. 400 Bad Request",
    ],
    correct_answer: "B",
    explanation:
      "201 Created cho biết yêu cầu thành công và một tài nguyên mới đã được tạo.",
    difficulty: "medium",
    tags: ["Web", "HTTP"],
  },
];

export const mockJob = {
  id: "mock-job-001",
  status: "succeeded",
  result_payload: {
    exercises: mockExercises,
  },
};

export function getMockJob() {
  // Return a deep copy to prevent mutations
  return Promise.resolve({
    ...mockJob,
    result_payload: {
      exercises: JSON.parse(JSON.stringify(mockExercises)),
    },
  });
}

export function submitMockAnswers(answers = {}) {
  const results = mockExercises.map((exercise) => {
    const selected = answers[exercise.id];
    const is_correct = selected === exercise.correct_answer;

    return {
      exercise_id: exercise.id,
      selected_answer: selected || null,
      correct_answer: exercise.correct_answer,
      is_correct,
      prompt: exercise.prompt,
      options: exercise.options,
      explanation: exercise.explanation,
      difficulty: exercise.difficulty,
      tags: exercise.tags,
      error: selected ? undefined : "Chưa chọn đáp án",
    };
  });

  const correct = results.filter((r) => r.is_correct).length;

  return Promise.resolve({
    summary: {
      correct,
      total: results.length,
    },
    results,
  });
}

export function getMockAnalysis(answers = {}) {
  const correctCount = Object.entries(answers).filter(([id, answer]) => {
    const exercise = mockExercises.find((e) => e.id === id);
    return exercise && exercise.correct_answer === answer;
  }).length;

  return Promise.resolve({
    insights: [
      `Bạn trả lời đúng ${correctCount}/${mockExercises.length} câu.`,
      "Nên xem lại các chủ đề: HTTP status, Thuật toán sắp xếp.",
    ],
    recommendations: [
      "Ôn tập lại Quick Sort và so sánh với các thuật toán O(n^2).",
      "Thực hành thêm bài tập về HTTP status codes.",
    ],
    next_actions: [
      "Thử tạo flashcard cho các khái niệm sai.",
      "Làm thêm 5 câu trắc nghiệm về Database và HTTP.",
    ],
  });
}

// // Dữ liệu đăng nhập giả
// export const mockUsers = [
//   {
//     id: "u_student",
//     email: "student@example.com",
//     password: "123456", // chỉ dùng cho mock
//     role: "student",
//     name: "Học viên A",
//     token: "mock-token-student",
//   },
//   {
//     id: "u_teacher",
//     email: "teacher@example.com",
//     password: "123456",
//     role: "teacher",
//     name: "Giảng viên B",
//     token: "mock-token-teacher",
//   },
//   {
//     id: "u_admin",
//     email: "admin@example.com",
//     password: "admin123",
//     role: "admin",
//     name: "Quản trị C",
//     token: "mock-token-admin",
//   },
// ];

// /**
//  * Giả lập đăng nhập: kiểm tra email/password và trả token + profile
//  */
// export function mockLogin(email, password) {
//   const user = mockUsers.find(
//     (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
//   );

//   if (!user) {
//     return Promise.reject(new Error("Sai email hoặc mật khẩu (mock)"));
//   }

//   const { password: _pw, ...safeUser } = user;
//   return Promise.resolve({
//     token: user.token,
//     user: safeUser,
//   });
// }

// /**
//  * Giả lập đăng ký tài khoản
//  */
// export function mockSignup(email, password, role = "student") {
//   const existed = mockUsers.find(
//     (u) => u.email.toLowerCase() === email.toLowerCase()
//   );
//   if (existed) {
//     return Promise.reject(new Error("Email đã được đăng ký (mock)"));
//   }

//   const newUser = {
//     id: `u_${Date.now()}`,
//     email,
//     password, // chỉ dùng mock
//     role,
//     name: email.split("@")[0] || "User",
//     token: `mock-token-${Date.now()}`,
//   };

//   mockUsers.push(newUser);

//   const { password: _pw, ...safeUser } = newUser;
//   return Promise.resolve({
//     token: newUser.token,
//     user: safeUser,
//   });
// }


// // Dữ liệu note giả
// export const mockNotes = [
//   {
//     id: "07ab02bf-5168-4f26-bf8c-6a55eda2893b",
//     title: "Project Phoenix Kickoff",
//     content: `# Project Phoenix Kickoff

// This document outlines the key objectives, scope, and timeline for **Project Phoenix**. The primary goal is to overhaul the user onboarding experience to improve activation rates and long-term retention. ![/page/0/Text/2]

// ## Key Takeaways

// - Redesign the sign-up flow to be more intuitive ![/page/0/SectionHeader/1]
// - Implement a personalized in-app tutorial for new users
// - Track key activation milestones (e.g., creating the first note, attaching a document) ![/page/0/Text/4]

// ## Action Items

// 1. **UX Team** to provide initial mockups by EOW
// 2. **Engineering** to scope out technical requirements ![/page/1/Text/1]
// 3. **Marketing** to prepare new user communication materials

// > "The key to success is starting before you're ready." - Marie Forleo

// ---

// ### Next Steps
// - [ ] Schedule follow-up meeting
// - [ ] Review design mockups ![/page/1/Text/2]
// - [ ] Set up tracking analytics`,
//     updated_at: "2026-01-18 03:19:10.050405",
//     created_at: "2026-01-18 03:19:10.041297"
//   },
//   {
//     id: "b8cd13e0-6279-5g37-cg9d-7b66feb3904c",
//     title: "Q3 Marketing Strategy",
//     content: `## Q3 Marketing Strategy

// Drafting the plan for the upcoming quarter's marketing campaigns.

// ### Key Focus Areas

// 1. **Social media expansion**
//    - Increase posting frequency
//    - Engage with community
//    - Run targeted ads

// 2. **Content marketing initiative**
//    - Blog posts: 2/week
//    - Video content: 1/week
//    - Infographics: 2/month

// 3. **Partnership opportunities**
//    - Research potential partners
//    - Reach out to influencers
//    - Co-marketing campaigns

// ### Budget & Timeline

// | Item | Budget | Timeline |
// |------|--------|----------|
// | Social Media | $20,000 | July - Sep |
// | Content | $15,000 | July - Sep |
// | Partnerships | $15,000 | Aug - Sep |
// | **Total** | **$50,000** | **Q3 2025** |`,
//     updated_at: "2026-01-17 09:15:22.123456",
//     created_at: "2026-01-17 09:00:00.000000"
//   },
//   {
//     id: "c9de24f1-7380-6h48-dh0e-8c77gfc4015d",
//     title: "API Integration Specs",
//     content: `# API Integration Specs

// Technical documentation for third-party API integration.

// ## Endpoints

// \`\`\`
// GET    /api/users        # Get all users
// POST   /api/users        # Create new user
// PUT    /api/users/:id    # Update user
// DELETE /api/users/:id    # Delete user
// \`\`\`

// ## Authentication

// **Type:** OAuth 2.0

// Example request:
// \`\`\`javascript
// const response = await fetch('/api/users', {
//   headers: {
//     'Authorization': 'Bearer YOUR_TOKEN_HERE',
//     'Content-Type': 'application/json'
//   }
// });
// \`\`\`

// ## Rate Limiting

// - **Limit:** 1000 requests/hour
// - **Response Header:** \`X-RateLimit-Remaining\`
// - **HTTP Status:** \`429 Too Many Requests\`

// ## Error Codes

// | Code | Description |
// |------|-------------|
// | 200 | Success |
// | 201 | Created |
// | 400 | Bad Request |
// | 401 | Unauthorized |
// | 404 | Not Found |
// | 429 | Too Many Requests |
// | 500 | Server Error |`,
//     updated_at: "2026-01-16 17:30:45.678901",
//     created_at: "2026-01-16 11:15:00.000000"
//   },
//   {
//     id: "d0ef35g2-8491-7i59-ei1f-9d88hgd5126e",
//     title: "Weekly Stand-up Sync",
//     content: `Summary of progress from last week's team meeting.

// Completed:
// ✓ Database migration
// ✓ UI redesign mockups
// ✓ User testing round 1

// In Progress:
// → Backend API development
// → Mobile app optimization

// Blocked:
// ⚠ Waiting for legal approval on new terms`,
//     updated_at: "2026-01-15 15:45:30.234567",
//     created_at: "2026-01-15 14:00:00.000000"
//   }
// ];

// Dữ liệu flashcard giả
export const mockFlashcard = [
  {
    "type": "quizz/flashcard",
    "owner": "user_uuid",
    "from_note": [82382, 8379234],
    "from_book": [983, 39274, 739723],
    "title": "....",
    "question": [
      {
        "1": "what is ... of ?",
        "Done": false,
        "Explanation": "...</[note-3849][l52]>",
      },
      {
        "2": "what is ... of ?",
        "Done": false,
      },
      {
        "3": "what is ... of ?",
        "Done": false,
      },
      {
        "4": "what is ... of ?",
        "Done": false,
      },
      {
        "5": "what is ... of ?",
        "Done": false,
      },
    ]
  }
]

//  Dữ liệu quizz giả
export const mockQuizz = [
  {
    "type": "quizz/flashcard",
    "owner": "user_uuid",
    "from_note": [82382, 8379234],
    "from_book": [983, 39274, 739723],
    "title": "....",
    "question": [
      {
        "question": "What is ... of ?",
        "a": "...",
        "b": "...",
        "c": "...",
        "d": "...",
        "anwser": "d",
        "latest_anwser": "c",
        "explanation": "...</[book-23][p83l2]>"
      },
      {
        "question": "What is ... of ?",
        "a": "...",
        "b": "...",
        "c": "...",
        "d": "...",
        "anwser": "d",
        "latest_anwser": "c",
        "explanation": "...</[book-23][p83l2]>"
      },
      {
        "question": "What is ... of ?",
        "a": "...",
        "b": "...",
        "c": "...",
        "d": "...",
        "anwser": "d",
        "latest_anwser": "c",
        "explanation": "...</[book-23][p83l2]>"
      }
    ]
  }
]

// // Book data
// export const mockBook = {
//   "message": "Books retrieved successfully",
//   "data": [
//     {
//       "query_id": "250117366v2",
//       "title": "250117366v2.pdf",
//       "description": "",
//       "saved_path": "./250117366v2.pdf",
//       "id": 2
//     }
//   ],
//   "pagination": {
//     "page": 1,
//     "page_size": 10,
//     "total": 1,
//     "total_pages": 1
//   }
// }

// // Book content data
// export const mockBookContent = {
//   "message": "Book with contents retrieved successfully",
//   "data": {
//     "query_id": "250117366v2",
//     "title": "250117366v2.pdf",
//     "description": "",
//     "saved_path": "./250117366v2.pdf",
//     "id": 2,
//     "contents": [
//       {
//         "position": "/page/0/SectionHeader/1",
//         "box": "[158.9765625, 113.2557373046875, 452.2450866699219, 130.47119140625]",
//         "content": "Forecasting S&P 500 Using LSTM Models"
//       },
//       {
//         "position": "/page/0/Text/2",
//         "box": "[229.798828125, 147.33984375, 382.11126708984375, 184.0767822265625]",
//         "content": "Prashant Pilla, Raji Mekonen 01/29/2025"
//       },
//       {
//         "position": "/page/0/SectionHeader/3",
//         "box": "[282.69140625, 223.0928955078125, 327.88751220703125, 233.05548095703125]",
//         "content": "Abstract"
//       },
//       {
//         "position": "/page/0/Text/4",
//         "box": "[98.015625, 261.421875, 513.984375, 536.7672119140625]",
//         "content": "With the volatile, complex nature of financial data which is also influenced by many external factors, forecasting the stock market has been seen to be a challenging task. Traditional models like ARIMA and GARCH were observed to be good with linear data. However, the stock market data involves non-linear dependencies and intricate patterns that are better handled by machine learning and deep learning approaches. Taking that a step further to patch hyper-parameter tuning and computational complexity that machine learning lacks, we get deep learning models like Long Short-Term Memory (LSTM) networks. In this report, we compare ARIMA and LSTM models in predicting the S&P 500 index, one of the most popular financial benchmarks. Using historical price data and technical indicators, we evaluated these models using the Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) metrics. The ARIMA model showcased reasonable performance with an MAE of 462.1, RMSE of 614, and an accuracy of 89.8%. This demonstrated its effectiveness in capturing short-term trends but also showed that it is limited by its linear assumptions. The LSTM model, with favorable features, achieved an MAE of 369.32, RMSE of 412.84, and an accuracy of 92. 46%, capturing both short- and long-term dependencies. The LSTM model without features outperformed the version with all features, achieving an MAE of 175.9, RMSE of 207.34, and an accuracy of 96.41%, which showcased its ability to handle market data. Accurately forecasting the stock market is crucial because of its effect on investment strategies, risk assessments, and market stability. By taking advantage of the sequential processing capabilities of LSTM, this report confirms how deep learning methods can handle volatile market conditions when compared to traditional models. The results of our analysis not only reaffirm the transformative potential of LSTM but also provide steps that can be taken to improve upon the model. Through this comprehensive study forecasting financial data, we aim to showcase the insights, limitations, and potential for prediction accuracy."
//       },
//       {
//         "position": "/page/1/SectionHeader/0",
//         "box": "[71.71875, 71.74700927734375, 184.976318359375, 86.09326171875]",
//         "content": "1 Introduction"
//       },
//       {
//         "position": "/page/1/Text/1",
//         "box": "[70.5234375, 112.1484375, 539.5859375, 218.08837890625]",
//         "content": "Stock price forecasting has always been a fundamental and challenging problem when dealing with financial time series. When it comes to financial market data, there are many factors in play such as high volatility, non-linear dynamics, and sensitivity to many factors including historical prices, trading volumes, macroeconomic indicators, and investor sentiment. Although predicting exactly where stock prices may move is considered impossible, there are many tools that help investors when trying to forecast a market. These tools allow them to find trends, patterns, and potential price movements in order to have well-considered choices. However, the complexity of stock prices and many other factors can make this a very hard problem."
//       },
//       {
//         "position": "/page/1/Text/2",
//         "box": "[70.5234375, 233.578125, 539.6235961914062, 367.12945556640625]",
//         "content": "Traditional time series models such as Autoregressive Integrated Moving Average (ARIMA) and Generalized Autoregressive Conditional Heteroskedasticity (GARCH) are a good base when trying to solve the challenging problem of forecasting financial data. This is because of their ability to model linear relationships and short-term patterns. ARIMA has been shown to be useful for finding trends and seasonality, while GARCH is better suited for modeling time-varying volatility. Their strengths come with some drawbacks with certain time series data because the models assume stationarity and linearity within the data. These limitations include handling nonlinear dependencies, uncovering complex patterns over time, and finding long-term relationships within the data it is given. These limitations are the reason why it is less effective with financial data as it is non-linear, has some long-range dependencies, and is influenced by many factors."
//       },
//       {
//         "position": "/page/1/Text/3",
//         "box": "[70.5234375, 382.8515625, 539.5909423828125, 489.5859375]",
//         "content": "Some of these challenges can be addressed by using machine/deep learning techniques, which have been shown to be better alternatives. Basic Recurrent Neural Networks (RNNs) introduced the ability to process sequential data by maintaining a hidden state that captures information from prior time steps. This allows the model to learn the temporal dependencies within the data for later use. However, RNNs face a critical limitation: they struggle to keep the information over long sequences because of the vanishing gradient problem. This happens when gradients used in the neural network become increasingly small during backpropagation, which ultimately hinders the network's ability to learn long-term dependencies."
//       },
//       {
//         "position": "/page/1/Text/4",
//         "box": "[70.5234375, 505.2613525390625, 539.6343994140625, 611.0144653320312]",
//         "content": "To go a step further, Long Short-Term Memory (LSTM) networks were developed to overcome the drawbacks of basic RNNs. LSTMs have a unique architecture that includes input, forget, and output gates. The memory capabilities of LSTM networks make it well-suited for financial time series forecasting, allowing the model to capture both short and long-term trends by keeping or discarding certain information. There are also LSTM variants such as Bidirectional LSTM (BiL-STM), Gated Recurrent Units (GRU), and Attention-LSTM that further improve the performance by enhancing parts of the model. These features allow the model to be very well-rounded and suitable for financial data."
//       },
//       {
//         "position": "/page/1/Text/5",
//         "box": "[70.5234375, 627.2043609619141, 539.640380859375, 720.0703125]",
//         "content": "With constant change and many moving pieces in the stock market, it may be challenging for some investors to stay on top of a never-ending cycle of fluctuations. Being able to predict SPX prices can help aid investors in making the right decision and give insight into a never-ending stream of data. This paper explores the applications of machine learning models such as LSTM and traditional models such as ARIMA to forecast the S&P 500 Index (SPX). The goal of using data such as historical prices and other financial metrics is to see if any underlying patterns in the data could help give insight into the market flow. With a combined interest in computer science"
//       },
//       {
//         "position": "/page/2/Text/0",
//         "box": "[70.5234375, 74.4332275390625, 539.5203247070312, 98.891357421875]",
//         "content": "and the financial markets, this project allows us to intersect the two fields. Also, diving deep into machine learning and AI, this project will help develop skills that can be used later on."
//       },
//       {
//         "position": "/page/2/SectionHeader/1",
//         "box": "[71.71875, 133.217041015625, 224.3566436767578, 147.56329345703125]",
//         "content": "2 Literature Review"
//       },
//       {
//         "position": "/page/2/SectionHeader/2",
//         "box": "[70.5234375, 172.86328125, 409.91375732421875, 185.34088134765625]",
//         "content": "2.1 Traditional Statistical Methods for Stock Prediction"
//       },
//       {
//         "position": "/page/4/SectionHeader/1",
//         "box": "[70.5234375, 129.9375, 266.70562744140625, 140.934326171875]",
//         "content": "2.2.2 k-Nearest Neighbors (KNN)"
//       },
//       {
//         "position": "/page/7/ListItem/15",
//         "box": "[87.556640625, 679.46484375, 303.06011962890625, 714.9912948608398]",
//         "content": "SPX Ratios: Price-to-Earnings Ratio (PE RATIO)"
//       },
//       {
//         "position": "/page/2/Text/3",
//         "box": "[70.5234375, 208.0546875, 539.5858764648438, 259.90435791015625]",
//         "content": "Traditional statistical methods have been shown to be great methods for time series forecasting due to their simplicity, interpretability, and ability to perform well on smaller data sets. These models, however, have drawbacks when they are applied to financial data as it is highly complex and nonlinear."
//       },
//     ]
//   }
// }