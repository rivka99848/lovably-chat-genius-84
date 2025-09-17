import React, { useState } from 'react';
import { Crown, Package, CreditCard, X, Check, Zap, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import PaymentIframe from './PaymentIframe';

interface Package {
  id: string;
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  type: 'free' | 'pro' | 'enterprise';
  popular?: boolean;
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
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  payments?: Payment[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  isDarkMode: boolean;
}

const PlanUpgrade = ({ isOpen, onClose, user, onUpdateUser, isDarkMode }: Props) => {
  // Guard against null user
  if (!user) {
    return null;
  }

  const packages: Package[] = [
  {
    id: '1',
    name: 'חבילה חינם',
    price: 0,
    messageLimit: 50,
    features: ['50 טוקנים חינם', 'תמיכה בסיסית', 'גישה לכל התכונות הבסיסיות'],
    type: 'free'
  },
  {
    id: '2',
    name: 'חבילה בסיסית',
    price: 15,
    messageLimit: 300000,
    features: ['300,000 טוקנים', 'תמיכה מועדפת', 'גישה מוקדמת לתכונות', 'ייצוא שיחות', 'אולוית עדיפות'],
    type: 'pro',
    popular: true
  },
  {
    id: '3',
    name: 'חבילה מתקדמת',
    price: 25,
    messageLimit: 600000,
    features: ['600,000 טוקנים', 'תמיכה', 'נהל מרובה', 'ניתוח תמונות', ],
    type: 'enterprise'
  }
];

const PlanUpgrade: React.FC<Props> = ({ isOpen, onClose, user, onUpdateUser, isDarkMode }) => {
  const [paymentIframeOpen, setPaymentIframeOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const generateEventId = () => {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleUpgrade = (packageData: Package) => {
    setSelectedPackage(packageData);
    setPaymentIframeOpen(true);
  };

  const handleDowngradeOrCancel = async (packageData: Package) => {
    const eventId = generateEventId();
    const currentPackage = packages.find(p => p.type === user.plan);
    const isDowngrade = packageData.price < (currentPackage?.price || 0);
    const isCancellation = packageData.type === 'free' && user.plan !== 'free';
    
    const webhookData = {
      event: isCancellation ? "subscription.cancelled" : "subscription.downgraded",
      event_id: eventId,
      timestamp: new Date().toISOString(),
      customer: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        category: user.category
      },
      plan_change: {
        previous_plan: user.plan,
        new_plan: packageData.type,
        previous_limit: user.messageLimit,
        new_limit: packageData.messageLimit,
        change_type: isCancellation ? "cancellation" : "downgrade",
        immediate: !isCancellation,
        reason: "user_initiated"
      },
      source: "chat_naki_app"
    };

    try {
      await fetch('https://n8n.chatnaki.co.il/webhook/f7386e64-b5f4-485b-9de4-7798794f9c72', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      console.log('Cancellation/downgrade webhook sent:', webhookData);
      
      let updatedUser;
      
      if (isCancellation) {
        // For cancellation, keep current plan but mark as cancel_pending
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // Cancel at end of current billing period
        
        updatedUser = {
          ...user,
          subscriptionStatus: 'cancel_pending' as const,
          subscriptionEndDate: endDate
        };
        
        toast({
          title: "המנוי בוטל",
          description: `המנוי יישאר פעיל עד ${endDate.toLocaleDateString('he-IL')}. לאחר מכן תועבר לתוכנית החינמית.`
        });
      } else {
        // For immediate downgrade
        updatedUser = {
          ...user,
          plan: packageData.type,
          messageLimit: packageData.messageLimit,
          subscriptionStatus: packageData.type === 'free' ? 'free' : 'active'
        };
        
        toast({
          title: "החבילה שונתה",
          description: `עברת ל${packageData.name}`
        });
      }
      
      onUpdateUser(updatedUser);
      onClose();
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        title: "שגיאה",
        description: "נכשלה עדכון החבילה. אנא נסה שוב.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = (updatedUser: User) => {
    onUpdateUser(updatedUser);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'enterprise': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      default: return 'bg-green-600/20 text-green-400 border-green-600/30';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Zap className="w-4 h-4" />;
      case 'enterprise': return <Users className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50 text-white' 
          : 'bg-white/95 border-gray-200 text-gray-900'
      }`} dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            <Crown className="w-6 h-6 ml-2 text-yellow-500" />
            שדרוג החבילה
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  {getPlanIcon(user.plan)}
                </div>
                <div>
                  <div className="font-medium">החבילה הנוכחית שלך</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user.messagesUsed.toLocaleString()}/{user.messageLimit.toLocaleString()} טוקנים בשימוש
                  </div>
                </div>
              </div>
              <Badge className={getPlanColor(user.plan)}>
                {packages.find(p => p.type === user.plan)?.name || 'חבילה חינם'}
              </Badge>
            </div>
          </div>

          {/* Available Plans */}
          <div>
            <h3 className="text-lg font-semibold mb-4">בחר חבילה</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={`relative p-6 ${
                  isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                } ${
                  pkg.popular ? 'ring-2 ring-blue-500/50' : ''
                } ${
                  user.plan === pkg.type ? 'opacity-50' : ''
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white border-blue-600">
                        <Star className="w-3 h-3 ml-1" />
                        הכי פופולרי
                      </Badge>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      {getPlanIcon(pkg.type)}
                    </div>
                    <h4 className="text-xl font-bold">{pkg.name}</h4>
                    <div className={`text-3xl font-bold mt-2 ${
                      pkg.price === 0 ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {pkg.price === 0 ? 'חינם' : `₪${pkg.price}`}
                      {pkg.price > 0 && (
                        <span className={`text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          /חודש
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {pkg.messageLimit.toLocaleString()} טוקנים
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 space-x-reverse">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {user.plan === pkg.type ? (
                    <Button disabled className="w-full" variant="outline">
                      החבילה הנוכחית
                    </Button>
                  ) : pkg.price === 0 ? (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        if (window.confirm(`האם אתה בטוח שברצונך לבטל את המנוי? המנוי יישאר פעיל עד סוף התקופה הנוכחית ולאחר מכן תועבר לתוכנית החינמית.`)) {
                          handleDowngradeOrCancel(pkg);
                        }
                      }}
                    >
                      בטל מנוי ועבור לחינמי
                    </Button>
                  ) : pkg.price < packages.find(p => p.type === user.plan)?.price! ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDowngradeOrCancel(pkg)}
                    >
                      שנמך לחבילה
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(pkg)}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <CreditCard className="w-4 h-4 ml-2" />
                      שדרג עכשיו
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className={`p-4 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <h4 className="font-semibold mb-2">למה לשדרג?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>יותר טוקנים לשימוש</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>תמיכה מהירה יותר</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>תכונות מתקדמות</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Check className="w-4 h-4 text-green-400" />
                <span>גישה מוקדמת לעדכונים</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      {selectedPackage && (
        <PaymentIframe
          isOpen={paymentIframeOpen}
          onClose={() => {
            setPaymentIframeOpen(false);
            setSelectedPackage(null);
          }}
          user={user}
          packageData={selectedPackage}
          onPaymentSuccess={handlePaymentSuccess}
          isDarkMode={isDarkMode}
        />
      )}
    </Dialog>
  );
};

export default PlanUpgrade;