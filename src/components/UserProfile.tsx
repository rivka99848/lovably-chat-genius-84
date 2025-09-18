
import React, { useState } from 'react';
import { User, Mail, Crown, Settings, Save, ArrowRight, Edit3, Shield, Bell, Palette, Globe, MessageCircle, Trash2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import PlanUpgrade from '@/components/PlanUpgrade';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
}

interface SavedConversation {
  id: string;
  title: string;
  messages: Message[];
  date: Date;
  category: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  type: 'free' | 'pro' | 'enterprise';
}

interface Payment {
  id: string;
  packageName: string;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  startDate?: Date;
  endDate?: Date;
}

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  payments?: Payment[];
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  registrationDate?: string;
  profileImage?: string;
}

interface Props {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

const categories = [
  { id: 'programming', name: 'תכנות' },
  { id: 'architecture', name: 'אדריכלות ועיצוב פנים' },
  { id: 'writing', name: 'כתיבה ותמלול' },
  { id: 'design', name: 'גרפיקה ועיצוב' },
  { id: 'copywriting', name: 'ניסוח ושכתוב' }
];

const UserProfile: React.FC<Props> = ({ user, onClose, onUpdateUser, isDarkMode, onThemeToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user.name);
  const [editedCategory, setEditedCategory] = useState(user.category);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  React.useEffect(() => {
    // Load saved conversations
    const saved = localStorage.getItem(`lovable_conversations_${user.id}`);
    if (saved) {
      setSavedConversations(JSON.parse(saved));
    }
  }, [user.id]);

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast({
        title: "שגיאה",
        description: "שם המשתמש לא יכול להיות ריק",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const updatedUser = {
        ...user,
        name: editedName,
        category: editedCategory
      };
      
      onUpdateUser(updatedUser);
      setIsEditing(false);
      
      toast({
        title: "הפרטים נשמרו",
        description: "פרטי החשבון עודכנו בהצלחה"
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "נכשל בשמירת הפרטים",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = savedConversations.filter(conv => conv.id !== conversationId);
    setSavedConversations(updatedConversations);
    localStorage.setItem(`lovable_conversations_${user.id}`, JSON.stringify(updatedConversations));
    
    toast({
      title: "השיחה נמחקה",
      description: "השיחה הוסרה בהצלחה"
    });
  };

  const loadConversation = (conversation: SavedConversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      localStorage.setItem('lovable_chat_history', JSON.stringify(conversation.messages));
      onClose();
      toast({
        title: "השיחה נטענה",
        description: "השיחה נטענה בהצלחה"
      });
    } else {
      toast({
        title: "שגיאה",
        description: "השיחה ריקה או פגומה",
        variant: "destructive"
      });
    }
  };

  const getPlanColor = (plan: string, subscriptionStatus?: string) => {
    if (subscriptionStatus === 'cancel_pending') {
      return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
    }
    
    switch (plan) {
      case 'pro': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'enterprise': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      default: return 'bg-green-600/20 text-green-400 border-green-600/30';
    }
  };

  const getPlanName = (plan: string, subscriptionStatus?: string) => {
    let baseName = '';
    switch (plan) {
      case 'pro': baseName = 'מקצועי'; break;
      case 'enterprise': baseName = 'ארגוני'; break;
      default: baseName = 'חינם';
    }
    
    if (subscriptionStatus === 'cancel_pending') {
      return `${baseName} (בביטול)`;
    }
    
    return baseName;
  };

  return (
    <div className={`min-h-screen premium-gradient flex items-center justify-center p-6 ${isDarkMode ? 'dark' : ''}`} dir="rtl">
      <Card className={`w-full max-w-4xl shadow-2xl backdrop-blur-xl ${
        isDarkMode 
          ? 'bg-gray-900/90 border-gray-700/50 text-white' 
          : 'bg-white/95 border-gray-200 text-gray-900'
      }`}>
        {/* Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">חשבון המשתמש</h1>
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  נהלו את פרטי החשבון והגדרות האפליקציה
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Information */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 ml-2" />
                פרטים אישיים
              </h2>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(!isEditing)}
                className={isDarkMode ? 'text-blue-400 hover:bg-blue-600/20' : 'text-blue-600 hover:bg-blue-50'}
              >
                <Edit3 className="w-4 h-4 ml-1" />
                {isEditing ? 'ביטול' : 'עריכה'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  אימייל
                </Label>
                <div className="relative">
                  <Mail className={`absolute right-3 top-3 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className={`pr-10 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 text-gray-300' 
                        : 'bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  שם מלא
                </Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  disabled={!isEditing}
                  className={`${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-white disabled:text-gray-300' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 disabled:text-gray-600'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  קטגוריה מקצועית
                </Label>
                <Input
                  id="category"
                  value={editedCategory}
                  disabled
                  className={`${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-300' 
                      : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  חבילה נוכחית
                </Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Badge className={getPlanColor(user.plan, user.subscriptionStatus)}>
                      <Crown className="w-3 h-3 ml-1" />
                      {getPlanName(user.plan, user.subscriptionStatus)}
                    </Badge>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {user.messagesUsed.toLocaleString()}/{user.messageLimit.toLocaleString()} טוקנים
                    </span>
                  </div>
                  <Button
                    onClick={() => setShowUpgrade(true)}
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-green-600/20 to-blue-600/20 hover:from-green-600/30 hover:to-blue-600/30 border-green-600/30"
                  >
                    <Crown className="w-3 h-3 ml-1" />
                    שינוי חבילה
                  </Button>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <Save className="w-4 h-4 ml-2" />
                  )}
                  שמור שינויים
                </Button>
              </div>
            )}
          </div>

          {/* Saved Conversations */}
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <MessageCircle className="w-5 h-5 ml-2" />
              שיחות שמורות
            </h2>

            {savedConversations && savedConversations.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {savedConversations.map((conversation) => (
                  <div key={conversation.id} className={`p-4 rounded-lg border flex items-center justify-between ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex-1 cursor-pointer" onClick={() => loadConversation(conversation)}>
                      <div className="font-medium">{conversation.title}</div>
                       <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                         {conversation.messages?.length || 0} הודעות • {new Date(conversation.date).toLocaleDateString('he-IL')}
                       </div>
                      <Badge className="text-xs mt-1 bg-green-600/20 text-green-400 border-green-600/30">
                        {conversation.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConversation(conversation.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                אין שיחות שמורות עדיין
              </div>
            )}
          </div>

          {/* App Settings */}
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <Settings className="w-5 h-5 ml-2" />
              הגדרות האפליקציה
            </h2>

            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Palette className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">מצב כהה</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      החלף בין מצב כהה לבהיר
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={onThemeToggle}
                />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Bell className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">התראות</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      קבל התראות על עדכונים חשובים
                    </div>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Save className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="font-medium">שמירה אוטומטית</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      שמור היסטוריית שיחות אוטומטית
                    </div>
                  </div>
                </div>
                <Switch
                  checked={autoSave}
                  onCheckedChange={setAutoSave}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <CreditCard className="w-5 h-5 ml-2" />
              היסטוריית תשלומים
            </h2>

            {payments && payments.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {payments.map((payment) => (
                  <div key={payment.id} className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-gray-800/50 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{payment.packageName}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ₪{payment.amount} • {payment.date.toLocaleDateString('he-IL')}
                        </div>
                        {payment.startDate && payment.endDate && (
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            תקף מ-{payment.startDate.toLocaleDateString('he-IL')} עד {payment.endDate.toLocaleDateString('he-IL')}
                          </div>
                        )}
                      </div>
                      <Badge className={
                        payment.status === 'completed' 
                          ? 'bg-green-600/20 text-green-400 border-green-600/30'
                          : payment.status === 'pending'
                          ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                          : 'bg-red-600/20 text-red-400 border-red-600/30'
                      }>
                        {payment.status === 'completed' ? 'הושלם' : 
                         payment.status === 'pending' ? 'ממתין' : 'נכשל'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <CreditCard className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <p>היסטוריית התשלומים תהיה זמינה בקרוב</p>
              </div>
            )}
          </div>

          {/* Account Stats */}
          <div>
            <h2 className="text-xl font-semibold flex items-center mb-4">
              <Shield className="w-5 h-5 ml-2" />
              סטטיסטיקות החשבון
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border text-center ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-2xl font-bold text-green-400">{user.messagesUsed.toLocaleString()}</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  טוקנים נשלחו
                </div>
              </div>

              <div className={`p-4 rounded-lg border text-center ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(((user.messageLimit - user.messagesUsed) / user.messageLimit) * 100)}%
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  טוקנים נותרו
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <PlanUpgrade
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

export default UserProfile;
