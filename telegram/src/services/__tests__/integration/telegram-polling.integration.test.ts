import { TelegramPollingService } from '../../telegram-polling';
import { SendMessageOptions } from '@/types/telegram';

// Mock fetch for HTTP requests
global.fetch = jest.fn();

describe('TelegramPollingService Integration', () => {
  let service: TelegramPollingService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new TelegramPollingService();
    mockFetch.mockClear();
  });

  describe('sendMessage integration', () => {
    it('should send message to Telegram API successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            message_id: 123,
            from: { id: 123456, is_bot: true, first_name: 'TestBot' },
            chat: { id: 987654, type: 'private' },
            date: 1234567890,
            text: 'Test message',
          },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const options: SendMessageOptions = {
        chat_id: 987654,
        text: 'Test message',
        parse_mode: 'HTML',
      };

      const result = await service.sendMessage(options);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options),
        })
      );

      expect(result.message_id).toBe(123);
      expect(result.text).toBe('Test message');
    });

    it('should handle Telegram API errors', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 400,
          description: 'Bad Request: chat not found',
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const options: SendMessageOptions = {
        chat_id: 999999,
        text: 'Test message',
      };

      await expect(service.sendMessage(options)).rejects.toThrow('Bad Request: chat not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const options: SendMessageOptions = {
        chat_id: 987654,
        text: 'Test message',
      };

      await expect(service.sendMessage(options)).rejects.toThrow('Network error');
    });

    it('should handle rate limiting', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({
          ok: false,
          error_code: 429,
          description: 'Too Many Requests: retry after 30',
          parameters: { retry_after: 30 },
        }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const options: SendMessageOptions = {
        chat_id: 987654,
        text: 'Test message',
      };

      await expect(service.sendMessage(options)).rejects.toThrow('Too Many Requests');
    });
  });

  describe('sendTypingAction integration', () => {
    it('should send typing action successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ ok: true, result: true }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      await service.sendTypingAction(987654);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendChatAction'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chat_id: 987654,
            action: 'typing',
          }),
        })
      );
    });
  });

  describe('getUpdates integration', () => {
    it('should fetch updates from Telegram API', async () => {
      const mockUpdates = [
        {
          update_id: 1,
          message: {
            message_id: 1,
            from: { id: 123, is_bot: false, first_name: 'User' },
            chat: { id: 123, type: 'private' },
            date: 1234567890,
            text: 'Hello bot',
          },
        },
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({ ok: true, result: mockUpdates }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const updates = await service.getUpdates();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/getUpdates'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            offset: 0,
            limit: 100,
            timeout: 30,
          }),
        })
      );

      expect(updates).toEqual(mockUpdates);
    });

    it('should handle empty updates', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ ok: true, result: [] }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const updates = await service.getUpdates();
      expect(updates).toEqual([]);
    });
  });

  describe('polling integration', () => {
    it('should start and stop polling', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ ok: true, result: [] }),
      };

      mockFetch.mockResolvedValue(mockResponse as Response);

      const updateHandler = jest.fn();
      
      // Start polling
      service.startPolling(updateHandler);
      
      // Wait a bit for polling to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Stop polling
      service.stopPolling();
      
      // Verify that getUpdates was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/getUpdates'),
        expect.any(Object)
      );
    });

    it('should handle updates during polling', async () => {
      const mockUpdate = {
        update_id: 1,
        message: {
          message_id: 1,
          from: { id: 123, is_bot: false, first_name: 'User' },
          chat: { id: 123, type: 'private' },
          date: 1234567890,
          text: 'Hello bot',
        },
      };

      let callCount = 0;
      mockFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, result: [mockUpdate] }),
          } as Response);
        } else {
          return Promise.resolve({
            ok: true,
            json: async () => ({ ok: true, result: [] }),
          } as Response);
        }
      });

      const updateHandler = jest.fn();
      
      service.startPolling(updateHandler);
      
      // Wait for polling to process the update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      service.stopPolling();
      
      expect(updateHandler).toHaveBeenCalledWith(mockUpdate);
    });
  });
});