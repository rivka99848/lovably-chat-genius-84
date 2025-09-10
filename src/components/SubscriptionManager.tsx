import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messageLimit: number;
  messagesUsed: number;
  registrationDate?: string;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
}

interface Payment {
  id: string;
  amount: number;
  date: Date;
  packageName: string;
  status: 'completed' | 'pending' | 'failed';
  transactionId?: string;
}

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  onClose: () => void;
}

const SubscriptionManager: React.FC<Props> = ({ user, onUpdateUser, isDarkMode, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleRefreshData = async () => {
    setIsLoading(true);
    try {
      // Simple refresh from localStorage - no backend needed for now
      const savedUser = localStorage.getItem('lovable_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        onUpdateUser(userData);
        toast({
          title: "הנתונים עודכנו",
          description: "הנתונים נטענו מחדש מהמערכת"
        });
      } else {
        toast({
          title: "לא ניתן לעדכן", 
          description: "לא נמצאו נתונים שמורים",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הנתונים",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check for expired subscriptions and auto-downgrade
  useEffect(() => {
    const checkSubscriptionExpiry = () => {
      if (user.subscriptionStatus === 'cancel_pending' && user.subscriptionEndDate) {
        const now = new Date();
        const endDate = new Date(user.subscriptionEndDate);
        
        if (now > endDate) {
          // Subscription has expired, downgrade to free
          const updatedUser = {
            ...user,
            plan: 'free' as const,
            messageLimit: 50,
            subscriptionStatus: 'expired' as const
          };
          
          onUpdateUser(updatedUser);
          
          toast({
            title: "המנוי הסתיים",
            description: "החבילה שלך הועברה לחבילה החינמית",
          });
          
          // Optional: Send webhook about expired subscription
          const webhookData = {
            event: "subscription.expired",
            timestamp: new Date().toISOString(),
            customer: {
              id: user.id,
              email: user.email,
              name: user.name,
              category: user.category
            },
            plan_change: {
              previous_plan: user.plan,
              new_plan: "free",
              expired_at: new Date().toISOString()
            }
          };
          
          fetch('https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
          }).catch(error => console.error('Failed to send expiry webhook:', error));
        }
      }
    };

    // Check on mount
    checkSubscriptionExpiry();
    
    // Check every minute
    const interval = setInterval(checkSubscriptionExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [user, onUpdateUser]);

  // Empty payments array - will be implemented with real data later
  const payments: Payment[] = [];

  const generateEventId = () => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getPlanName = (plan: string, subscriptionStatus?: string) => {
    let baseName = '';
    switch (plan) {
      case 'free': baseName = 'חינמי'; break;
      case 'pro': baseName = 'Pro'; break;
      case 'enterprise': baseName = 'Enterprise'; break;
      default: baseName = 'לא ידוע';
    }
    
    if (subscriptionStatus === 'cancel_pending') {
      return `${baseName} (בביטול)`;
    }
    
    return baseName;
  };

  const getPlanColor = (plan: string, subscriptionStatus?: string) => {
    if (subscriptionStatus === 'cancel_pending') {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    }
    
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'pro': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'enterprise': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'pro': return '₪15/חודש';
      case 'enterprise': return '₪25/חודש'; 
      default: return 'חינם';
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    
    const eventId = generateEventId();
    const webhookData = {
      event: "subscription.cancellation_requested",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        category: user.category
      },
      subscription_details: {
        current_plan: user.plan,
        current_limit: user.messageLimit,
        cancellation_type: "user_requested",
        immediate: false
      },
      source: "chat_naki_app"
    };

    try {
      await fetch('https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      });

      console.log('Cancellation webhook sent:', webhookData);
      
      // Set subscription to cancel_pending with end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const updatedUser = {
        ...user,
        subscriptionStatus: 'cancel_pending' as const,
        subscriptionEndDate: endDate
      };
      
      onUpdateUser(updatedUser);
      
      toast({
        title: "בקשת ביטול נשלחה",
        description: `המנוי יישאר פעיל עד ${endDate.toLocaleDateString('he-IL')}`,
      });
      
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Error sending cancellation webhook:', error);
      toast({
        title: "שגיאה בביטול המנוי",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (user.messageLimit === -1) return 0; // Unlimited
    return Math.min((user.messagesUsed / user.messageLimit) * 100, 100);
  };

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`} dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-3xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Crown className="w-8 h-8 ml-3 text-yellow-500" />
              ניהול מנוי
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                רענן נתונים
              </Button>
              <Button variant="outline" onClick={onClose}>
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
              </Button>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        <Card className={`p-6 mb-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h2 className={`text-xl font-semibold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Crown className="w-5 h-5 ml-2 text-yellow-500" />
                התוכנית הנוכחית
              </h2>
              <Badge className={getPlanColor(user.plan, user.subscriptionStatus)}>
                {getPlanName(user.plan, user.subscriptionStatus)}
              </Badge>
            </div>

            <div className="text-left">
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {getPlanPrice(user.plan)}
              </div>
              {user.subscriptionStatus === 'cancel_pending' && user.subscriptionEndDate && (
                <div className="text-sm text-orange-600 mt-1">
                  מסתיים ב-{new Date(user.subscriptionEndDate).toLocaleDateString('he-IL')}
                </div>
              )}
            </div>
          </div>

          {/* Usage Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                שימוש בטוקנים
              </span>
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.messagesUsed.toLocaleString()} / {user.messageLimit === -1 ? '∞' : user.messageLimit.toLocaleString()}
              </span>
            </div>
            
            <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getUsagePercentage() > 90 ? 'bg-red-500' : 
                  getUsagePercentage() > 70 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${user.messageLimit === -1 ? 10 : getUsagePercentage()}%` }}
              />
            </div>
          </div>

          {/* Subscription Actions */}
          {user.plan !== 'free' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user.subscriptionStatus === 'cancel_pending' 
                    ? 'המנוי מתוכנן להסתיים בתאריך המצוין למעלה'
                    : 'רוצה לבטל את המנוי? המנוי יישאר פעיל עד סוף התקופה הנוכחית'
                  }
                </div>
                <div className="flex gap-2">
                  {!showCancelConfirm ? (
                    user.subscriptionStatus !== 'cancel_pending' && (
                      <Button
                        onClick={() => setShowCancelConfirm(true)}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                      >
                        <AlertTriangle className="w-4 h-4 ml-1" />
                        ביטול מנוי
                      </Button>
                    )
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCancelConfirm(false)}
                        variant="outline"
                        size="sm"
                      >
                        ביטול
                      </Button>
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={isLoading}
                        variant="destructive"
                        size="sm"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 ml-1" />
                        )}
                        אישור ביטול
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className={`p-4 text-center ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user.messagesUsed.toLocaleString()}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              טוקנים שנשלחו
            </div>
          </Card>
          
          <Card className={`p-4 text-center ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user.messageLimit === -1 ? '∞' : Math.max(0, user.messageLimit - user.messagesUsed).toLocaleString()}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              טוקנים נותרו
            </div>
          </Card>
        </div>

        {/* Payment History */}
        <Card className={`p-6 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h2 className={`text-xl font-semibold flex items-center mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <CreditCard className="w-5 h-5 ml-2" />
            היסטוריית תשלומים
          </h2>

          <div className="text-center py-8">
            <CreditCard className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              היסטוריית התשלומים תהיה זמינה בקרוב
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionManager;