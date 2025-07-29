import { RetryUtils, CircuitBreaker, FallbackUtils, RetryOptions } from '../retry-utils';
import { ErrorCategory } from '../error-handler';

// Mock the logger
jest.mock('../logger');

describe('RetryUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      
      const result = await RetryUtils.withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const options: RetryOptions = {
        maxAttempts: 3,
        initialDelay: 10, // Short delay for testing
        backoffFactor: 1, // No exponential backoff for predictable timing
      };

      const result = await RetryUtils.withRetry(mockFn, options);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));

      const options: RetryOptions = {
        maxAttempts: 2,
        initialDelay: 10,
      };

      await expect(RetryUtils.withRetry(mockFn, options)).rejects.toThrow('Persistent error');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Validation failed'));

      const options: RetryOptions = {
        maxAttempts: 3,
        nonRetryableErrors: [ErrorCategory.VALIDATION],
        initialDelay: 10,
      };

      await expect(RetryUtils.withRetry(mockFn, options)).rejects.toThrow('Validation failed');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const options: RetryOptions = {
        maxAttempts: 2,
        initialDelay: 10,
        onRetry,
      };

      await RetryUtils.withRetry(mockFn, options);

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it('should respect custom shouldRetry function', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Custom error'));

      const shouldRetry = jest.fn().mockReturnValue(false);

      const options: RetryOptions = {
        maxAttempts: 3,
        initialDelay: 10,
        shouldRetry,
      };

      await expect(RetryUtils.withRetry(mockFn, options)).rejects.toThrow('Custom error');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle timeout', async () => {
      const mockFn = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const options: RetryOptions = {
        timeout: 50,
        maxAttempts: 1,
      };

      await expect(RetryUtils.withRetry(mockFn, options)).rejects.toThrow('timed out');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff with jitter', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();

      const options: RetryOptions = {
        maxAttempts: 3,
        initialDelay: 100,
        backoffFactor: 2,
        maxDelay: 1000,
      };

      await RetryUtils.withRetry(mockFn, options);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should take at least the sum of delays (with jitter, it might be slightly less)
      // First retry: ~100ms, Second retry: ~200ms = ~300ms total minimum
      expect(totalTime).toBeGreaterThan(200); // Account for jitter reducing the delay
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      resetTimeout: 100, // Short timeout for testing
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('should start in CLOSED state', () => {
    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe('CLOSED');
    expect(stats.failureCount).toBe(0);
  });

  it('should execute function successfully when CLOSED', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after failure threshold', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

    // Fail 3 times to reach threshold
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected to fail
      }
    }

    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe('OPEN');
    expect(stats.failureCount).toBe(3);

    // Next call should be blocked
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getStats().state).toBe('OPEN');

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 150));

    // Trigger monitoring check
    const mockSuccessFn = jest.fn().mockResolvedValue('success');
    await circuitBreaker.execute(mockSuccessFn);

    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe('CLOSED');
  });

  it('should reset failure count on successful execution', async () => {
    const mockFailFn = jest.fn().mockRejectedValue(new Error('Service error'));
    const mockSuccessFn = jest.fn().mockResolvedValue('success');

    // Fail once
    try {
      await circuitBreaker.execute(mockFailFn);
    } catch (error) {
      // Expected to fail
    }

    expect(circuitBreaker.getStats().failureCount).toBe(1);

    // Succeed once
    await circuitBreaker.execute(mockSuccessFn);

    expect(circuitBreaker.getStats().failureCount).toBe(0);
  });

  it('should reset circuit breaker manually', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Service error'));

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getStats().state).toBe('OPEN');

    circuitBreaker.reset();

    const stats = circuitBreaker.getStats();
    expect(stats.state).toBe('CLOSED');
    expect(stats.failureCount).toBe(0);
  });
});

describe('FallbackUtils', () => {
  describe('withFallback', () => {
    it('should return primary result when successful', async () => {
      const primary = jest.fn().mockResolvedValue('primary');
      const fallback1 = jest.fn().mockResolvedValue('fallback1');

      const result = await FallbackUtils.withFallback(primary, [fallback1]);

      expect(result).toBe('primary');
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback1).not.toHaveBeenCalled();
    });

    it('should use first fallback when primary fails', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback1 = jest.fn().mockResolvedValue('fallback1');
      const fallback2 = jest.fn().mockResolvedValue('fallback2');

      const result = await FallbackUtils.withFallback(primary, [fallback1, fallback2]);

      expect(result).toBe('fallback1');
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback1).toHaveBeenCalledTimes(1);
      expect(fallback2).not.toHaveBeenCalled();
    });

    it('should try all fallbacks in order', async () => {
      const primary = jest.fn().mockRejectedValue(new Error('Primary failed'));
      const fallback1 = jest.fn().mockRejectedValue(new Error('Fallback1 failed'));
      const fallback2 = jest.fn().mockResolvedValue('fallback2');

      const result = await FallbackUtils.withFallback(primary, [fallback1, fallback2]);

      expect(result).toBe('fallback2');
      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback1).toHaveBeenCalledTimes(1);
      expect(fallback2).toHaveBeenCalledTimes(1);
    });

    it('should throw original error when all fallbacks fail', async () => {
      const primaryError = new Error('Primary failed');
      const primary = jest.fn().mockRejectedValue(primaryError);
      const fallback1 = jest.fn().mockRejectedValue(new Error('Fallback1 failed'));
      const fallback2 = jest.fn().mockRejectedValue(new Error('Fallback2 failed'));

      await expect(
        FallbackUtils.withFallback(primary, [fallback1, fallback2])
      ).rejects.toThrow('Primary failed');

      expect(primary).toHaveBeenCalledTimes(1);
      expect(fallback1).toHaveBeenCalledTimes(1);
      expect(fallback2).toHaveBeenCalledTimes(1);
    });

    it('should retry primary when retryPrimary is true', async () => {
      const primary = jest.fn()
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockResolvedValue('primary success');
      const fallback1 = jest.fn().mockResolvedValue('fallback1');

      const result = await FallbackUtils.withFallback(
        primary, 
        [fallback1], 
        { 
          retryPrimary: true,
          retryOptions: { maxAttempts: 2, initialDelay: 10 }
        }
      );

      expect(result).toBe('primary success');
      expect(primary).toHaveBeenCalledTimes(2);
      expect(fallback1).not.toHaveBeenCalled();
    });
  });

  describe('createSimpleFallback', () => {
    it('should create fallback that returns specified value', async () => {
      const fallback = FallbackUtils.createSimpleFallback('fallback value');
      const result = await fallback();

      expect(result).toBe('fallback value');
    });
  });

  describe('createErrorFallback', () => {
    it('should create fallback that returns error message', async () => {
      const fallback = FallbackUtils.createErrorFallback('Service unavailable');
      const result = await fallback();

      expect(result).toBe('Service unavailable');
    });
  });
});