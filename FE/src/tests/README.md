# Test Suite Documentation

## Mục đích

Bộ test này được thiết kế để kiểm tra các state trong ứng dụng và đảm bảo chúng không bị **chồng chéo** (overlapping) hoặc **conflict** với nhau.

## Các Test Files

### 1. `useAuth.test.jsx`
Test authentication state management:
- ✅ Initial state initialization
- ✅ Login/logout actions
- ✅ State persistence với localStorage
- ✅ State isolation giữa nhiều instances
- ✅ Concurrent updates (race conditions)
- ✅ Memory leak prevention

**Vấn đề được giải quyết:**
- Đảm bảo auth state không bị leak giữa các lần mount/unmount
- Tránh race conditions khi login/logout liên tiếp
- Isolation giữa các components sử dụng auth

### 2. `useTextSelection.test.js`
Test text selection state management:
- ✅ Selection detection và bounding box calculation
- ✅ Event listener cleanup
- ✅ State isolation giữa nhiều containers
- ✅ Scroll handling
- ✅ Edge cases (empty selections, outside container)

**Vấn đề được giải quyết:**
- Tránh memory leak từ event listeners
- Đảm bảo selection changes không affect các containers khác
- Proper cleanup khi unmount

### 3. `mockServices.test.js`
Test mock data consistency:
- ✅ Data immutability
- ✅ No global state mutation
- ✅ Concurrent operations không conflict
- ✅ Data structure validation
- ✅ Function isolation

**Vấn đề được giải quyết:**
- Đảm bảo mock functions không mutate global data
- Concurrent calls return independent results
- Data structure consistency

### 4. `stateIntegration.test.jsx`
Test integration giữa các states:
- ✅ Auth + Mock Services integration
- ✅ Auth + TextSelection integration
- ✅ Multiple state updates đồng thời
- ✅ State persistence & hydration
- ✅ Memory management

**Vấn đề được giải quyết:**
- Đảm bảo các states có thể hoạt động cùng nhau
- Không có race conditions khi update nhiều states
- Storage events không gây conflicts
- Proper cleanup cho tất cả states

## Cài đặt

Test dependencies đã được cài:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom @vitest/ui
```

## Chạy Tests

### Chạy tất cả tests
```bash
npm run test
```

### Chạy tests với UI
```bash
npm run test:ui
```

### Chạy tests với coverage
```bash
npm run test:coverage
```

### Chạy specific test file
```bash
npm run test -- useAuth.test.jsx
```

### Watch mode (auto re-run khi có thay đổi)
```bash
npm run test:watch
```

## Test Coverage

Các khía cạnh được test:

### 🔒 State Isolation
- Mỗi state không ảnh hưởng lẫn nhau
- State cleanup khi unmount
- Không leak giữa instances

### 🔄 Concurrent Operations
- Multiple state updates cùng lúc
- Race condition handling
- Promise concurrency

### 💾 Persistence & Hydration
- localStorage integration
- State restoration
- Storage events

### 🧹 Memory Management
- Event listener cleanup
- No memory leaks
- Proper unmount behavior

### 🔀 Integration
- Auth + Data services
- Auth + UI states (text selection)
- Multiple states cùng hoạt động

## Cấu trúc Files

```
src/tests/
├── setup.js                      # Test environment setup
├── useAuth.test.jsx              # Auth state tests
├── useTextSelection.test.js      # Text selection tests
├── mockServices.test.js          # Mock data consistency tests
├── stateIntegration.test.jsx     # Integration tests
└── README.md                     # Documentation (file này)
```

## Best Practices

### 1. **Cleanup sau mỗi test**
```javascript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
```

### 2. **Tránh shared state giữa tests**
```javascript
beforeEach(() => {
  // Reset state về clean slate
  localStorage.clear();
  vi.clearAllMocks();
});
```

### 3. **Test isolation**
Mỗi test phải độc lập, không phụ thuộc vào kết quả của test khác.

### 4. **Async handling**
```javascript
await waitFor(() => {
  expect(result.current.initializing).toBe(false);
});
```

### 5. **Act wrapper cho state updates**
```javascript
await act(async () => {
  await result.current.login();
});
```

## Phát hiện Conflicts

Tests giúp phát hiện các loại conflicts:

### ❌ State Overlap
```javascript
// BAD: Một state vô tình override state khác
setState1(value); // Accidentally clears state2
```

### ❌ Shared Mutation
```javascript
// BAD: Multiple components mutate cùng 1 object
mockData.exercises[0].answer = 'A'; // Affects all components
```

### ❌ Memory Leaks
```javascript
// BAD: Event listeners không được cleanup
useEffect(() => {
  window.addEventListener('event', handler);
  // Missing cleanup!
});
```

### ✅ Proper Isolation
```javascript
// GOOD: Mỗi state độc lập
const [authState, setAuthState] = useState(...);
const [selectionState, setSelectionState] = useState(...);
// Không affect lẫn nhau
```

## Debugging Failed Tests

### 1. Check console output
```bash
npm run test -- --reporter=verbose
```

### 2. Run single test
```bash
npm run test -- -t "test name"
```

### 3. Debug mode
```javascript
it.only('specific test', () => {
  // This test runs alone
});
```

### 4. Check mocks
```javascript
console.log(vi.mocked(mockFunction).mock.calls);
```

## Thêm Tests Mới

### Template cho state test:
```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('New State Tests', () => {
  beforeEach(() => {
    // Cleanup
  });

  describe('Initial State', () => {
    it('should initialize correctly', () => {
      // Test
    });
  });

  describe('State Isolation', () => {
    it('should not conflict with other states', () => {
      // Test isolation
    });
  });
});
```

## Continuous Integration

Thêm vào CI/CD pipeline:
```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:coverage
  
- name: Check coverage threshold
  run: npm run test:coverage -- --coverage.threshold.lines=80
```

## Liên hệ

Nếu có vấn đề với tests hoặc phát hiện state conflicts mới, vui lòng tạo issue hoặc liên hệ team.

---

**Lưu ý:** Tests này focus vào **state management** và **conflict prevention**. Đảm bảo chạy full test suite trước khi merge code.
