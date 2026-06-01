# Testing Strategy - State Conflict Prevention

## Tổng quan

Tài liệu này mô tả chiến lược testing để **ngăn chặn conflicts và chồng chéo states** trong ứng dụng React.

## Vấn đề: State Conflicts

### Các loại conflicts phổ biến:

#### 1. **Shared Mutable State**
```javascript
// ❌ BAD: Multiple components mutate same object
const sharedData = { value: 0 };

function ComponentA() {
  sharedData.value = 1; // Affects ComponentB!
}

function ComponentB() {
  console.log(sharedData.value); // Unexpected value
}
```

#### 2. **State Leaking Between Mounts**
```javascript
// ❌ BAD: State persists sau khi unmount
let cachedState = null;

function useMyHook() {
  if (!cachedState) {
    cachedState = { data: 'value' };
  }
  return cachedState; // Leaks to next mount!
}
```

#### 3. **Event Listener Accumulation**
```javascript
// ❌ BAD: Listeners không được cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
  // Missing: return () => removeEventListener(...)
}, []);
// Results in multiple handlers!
```

#### 4. **Race Conditions**
```javascript
// ❌ BAD: Concurrent updates conflict
async function login() {
  setLoading(true);
  await api.login(); // Nếu gọi 2 lần...
  setLoading(false); // State có thể inconsistent
}
```

## Giải pháp: Test Coverage

### ✅ State Isolation Tests

Đảm bảo mỗi state instance độc lập:

```javascript
it('nên không leak state giữa các lần mount/unmount', async () => {
  // Mount lần 1
  const { result: result1, unmount } = renderHook(() => useAuth());
  
  await act(async () => {
    await result1.current.login();
  });
  
  expect(result1.current.authed).toBe(true);
  
  unmount();
  
  // Mount lần 2 - phải clean
  const { result: result2 } = renderHook(() => useAuth());
  expect(result2.current.authed).toBe(false);
});
```

### ✅ Concurrent Operation Tests

Kiểm tra race conditions:

```javascript
it('nên handle race condition khi login đồng thời', async () => {
  const { result } = renderHook(() => useAuth());
  
  // Gọi login nhiều lần đồng thời
  await act(async () => {
    await Promise.all([
      result.current.login(),
      result.current.login(),
      result.current.login(),
    ]);
  });
  
  // State phải consistent
  expect(result.current.authed).toBe(true);
});
```

### ✅ Memory Leak Tests

Đảm bảo cleanup đúng cách:

```javascript
it('nên cleanup event listeners khi unmount', () => {
  const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
  
  const { unmount } = renderHook(() => useTextSelection(containerRef));
  
  unmount();
  
  expect(removeEventListenerSpy).toHaveBeenCalledWith(
    'selectionchange',
    expect.any(Function)
  );
});
```

### ✅ Integration Tests

Kiểm tra nhiều states cùng hoạt động:

```javascript
it('nên có thể login và submit answers mà không conflict', async () => {
  // Setup auth
  const { result: authHook } = renderHook(() => useAuth());
  
  await act(async () => {
    await authHook.current.login();
  });
  
  // Submit data
  const result = await submitMockAnswers({ 'ex_01': 'C' });
  
  // Both states hoạt động bình thường
  expect(authHook.current.authed).toBe(true);
  expect(result.summary).toBeDefined();
});
```

## Test Matrix

| State Type | Isolation | Concurrent | Memory | Integration |
|------------|-----------|------------|--------|-------------|
| Auth | ✅ | ✅ | ✅ | ✅ |
| TextSelection | ✅ | ✅ | ✅ | ✅ |
| MockData | ✅ | ✅ | N/A | ✅ |

## Best Practices

### 1. **Luôn cleanup trong afterEach**
```javascript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  window.getSelection()?.removeAllRanges();
});
```

### 2. **Test isolation riêng biệt**
```javascript
describe('State Isolation', () => {
  it('instance A không affect instance B', () => {
    // Test multiple instances
  });
  
  it('unmount phải clear state', () => {
    // Test cleanup
  });
});
```

### 3. **Mock external dependencies**
```javascript
beforeEach(() => {
  window.getSelection = vi.fn(() => ({
    rangeCount: 0,
    isCollapsed: true,
  }));
});
```

### 4. **Test edge cases**
```javascript
it('nên handle null/undefined values', () => {
  // Test với invalid inputs
});

it('nên handle empty arrays/objects', () => {
  // Test với empty data
});
```

## Metrics

### Coverage Targets:
- **Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 80%

### Test Categories:
- **Unit Tests**: 60% (individual states)
- **Integration Tests**: 30% (state interactions)
- **Edge Cases**: 10% (error handling)

## CI/CD Integration

### Pre-commit Hook
```bash
# .husky/pre-commit
npm run test
```

### Pull Request Check
```yaml
# .github/workflows/pr-check.yml
name: PR Check
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run test:coverage
      - run: npm run lint
```

### Coverage Report
Tự động generate coverage report cho mỗi PR:
```yaml
- name: Coverage Report
  uses: codecov/codecov-action@v2
  with:
    files: ./coverage/coverage-final.json
```

## Debugging Guide

### Khi test fail:

1. **Check isolation**
   ```bash
   npm run test -- --reporter=verbose
   ```

2. **Run single test**
   ```bash
   npm run test -- -t "specific test name"
   ```

3. **Check mock calls**
   ```javascript
   console.log(vi.mocked(fn).mock.calls);
   ```

4. **Inspect state**
   ```javascript
   console.log(JSON.stringify(result.current, null, 2));
   ```

## Maintenance

### Thêm state mới:
1. Tạo test file: `newState.test.js`
2. Test isolation
3. Test concurrent operations
4. Test integration với existing states
5. Update test matrix trong README

### Khi phát hiện bug:
1. Tạo test reproduce bug
2. Fix bug
3. Verify test pass
4. Check không broke existing tests

## Anti-patterns

### ❌ KHÔNG làm:

```javascript
// Shared globals
let globalState = {};

// Missing cleanup
useEffect(() => {
  addListener();
  // No cleanup!
});

// Direct mutation
mockData[0].value = 'changed';

// No isolation
const cache = {}; // Persists between tests
```

### ✅ NÊN làm:

```javascript
// Local state
const [state, setState] = useState({});

// Proper cleanup
useEffect(() => {
  addListener();
  return () => removeListener();
}, []);

// Immutable updates
const newData = [...mockData];
newData[0] = { ...newData[0], value: 'changed' };

// Fresh instances
beforeEach(() => {
  // Reset everything
});
```

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Summary

✅ **4 test files** covering all states  
✅ **State isolation** tests  
✅ **Concurrent operations** tests  
✅ **Memory management** tests  
✅ **Integration** tests  
✅ **Documentation** complete  

**Kết quả:** Ứng dụng có thể scale mà không lo conflicts giữa states!
