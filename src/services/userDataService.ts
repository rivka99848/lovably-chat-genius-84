export interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  registrationDate?: string;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  profileImage?: string;
}

export interface ServerConversation {
  session_id: string;
  title: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  plan: string;
  description?: string;
}

export interface UsageStats {
  daily_messages: number;
  weekly_messages: number;
  monthly_messages: number;
  total_conversations: number;
  last_active: string;
}

export interface LoginResponse {
  success: boolean;
  user_data: ExtendedUser;
  conversations: ServerConversation[];
  payment_history: PaymentRecord[];
  usage_stats: UsageStats;
  token?: string;
  message?: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  shouldProcess: boolean;
  user_data?: Partial<ExtendedUser>;
  conversations?: ServerConversation[];
  updated_stats?: Partial<UsageStats>;
  token?: string;
}

export interface PaymentResponse {
  success: boolean;
  user_data: ExtendedUser;
  payment_record: PaymentRecord;
  message: string;
}

export interface CancellationResponse {
  success: boolean;
  user_data: ExtendedUser;
  message: string;
}

class UserDataService {
  private static instance: UserDataService;
  
  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  processLoginResponse(responseData: any): LoginResponse | null {
    try {
      // Handle different response formats from server
      if (responseData === true) {
        return null; // Fallback to old behavior
      }

      if (typeof responseData === 'object' && responseData.success) {
        return {
          success: responseData.success,
          user_data: responseData.user_data || responseData,
          conversations: responseData.conversations || [],
          payment_history: responseData.payment_history || [],
          usage_stats: responseData.usage_stats || {
            daily_messages: 0,
            weekly_messages: 0,
            monthly_messages: 0,
            total_conversations: 0,
            last_active: new Date().toISOString()
          },
          token: responseData.token,
          message: responseData.message
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing login response:', error);
      return null;
    }
  }

  processChatResponse(responseData: any): ChatResponse | null {
    try {
      // Handle different response formats from server
      if (responseData === true) {
        return {
          success: true,
          message: 'ההודעה נשלחה בהצלחה לשרת.',
          shouldProcess: true
        };
      }

      if (Array.isArray(responseData) && responseData.length > 0) {
        const firstItem = responseData[0];
        if (typeof firstItem === 'object' && firstItem.success !== undefined) {
          return {
            success: firstItem.success,
            message: firstItem.message || firstItem.response || firstItem.content || firstItem.text || 'קיבלתי תגובה מהשרת',
            shouldProcess: firstItem.shouldProcess || firstItem.success,
            user_data: firstItem.user_data,
            conversations: firstItem.conversations,
            updated_stats: firstItem.updated_stats,
            token: firstItem.token
          };
        }
      }

      if (typeof responseData === 'object' && responseData.success !== undefined) {
        return {
          success: responseData.success,
          message: responseData.message || responseData.response || responseData.content || responseData.text || 'קיבלתי תגובה מהשרת',
          shouldProcess: responseData.shouldProcess || responseData.success,
          user_data: responseData.user_data,
          conversations: responseData.conversations,
          updated_stats: responseData.updated_stats,
          token: responseData.token
        };
      }

      if (typeof responseData === 'string') {
        return {
          success: true,
          message: responseData,
          shouldProcess: true
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing chat response:', error);
      return null;
    }
  }

  processPaymentResponse(responseData: any): PaymentResponse | null {
    try {
      if (typeof responseData === 'object' && responseData.success) {
        return {
          success: responseData.success,
          user_data: responseData.user_data,
          payment_record: responseData.payment_record,
          message: responseData.message || 'התשלום בוצע בהצלחה'
        };
      }
      return null;
    } catch (error) {
      console.error('Error processing payment response:', error);
      return null;
    }
  }

  processCancellationResponse(responseData: any): CancellationResponse | null {
    try {
      if (typeof responseData === 'object' && responseData.success) {
        return {
          success: responseData.success,
          user_data: responseData.user_data,
          message: responseData.message || 'המנוי בוטל בהצלחה'
        };
      }
      return null;
    } catch (error) {
      console.error('Error processing cancellation response:', error);
      return null;
    }
  }

  updateAllUserData(userId: string, userData: ExtendedUser, conversations?: ServerConversation[], paymentHistory?: PaymentRecord[], usageStats?: UsageStats): void {
    try {
      // Update user data
      localStorage.setItem('lovable_user', JSON.stringify(userData));

      // Update conversations if provided
      if (conversations) {
        localStorage.setItem(`lovable_conversations_${userId}`, JSON.stringify(conversations));
      }

      // Update payment history if provided
      if (paymentHistory) {
        localStorage.setItem(`lovable_payment_history_${userId}`, JSON.stringify(paymentHistory));
      }

      // Update usage stats if provided
      if (usageStats) {
        localStorage.setItem(`lovable_usage_stats_${userId}`, JSON.stringify(usageStats));
      }

      console.log('User data updated successfully');
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }

  syncConversationsFromServer(userId: string, conversations: ServerConversation[]): void {
    try {
      localStorage.setItem(`lovable_conversations_${userId}`, JSON.stringify(conversations));
      console.log('Conversations synced from server');
    } catch (error) {
      console.error('Error syncing conversations:', error);
    }
  }

  getPaymentHistory(userId: string): PaymentRecord[] {
    try {
      const stored = localStorage.getItem(`lovable_payment_history_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  getUsageStats(userId: string): UsageStats | null {
    try {
      const stored = localStorage.getItem(`lovable_usage_stats_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return null;
    }
  }

  extractToken(data: any): string | null {
    if (typeof data === 'object' && data !== null) {
      return data.token || data.jwt || data.access_token || null;
    }
    return null;
  }
}

export default UserDataService.getInstance();