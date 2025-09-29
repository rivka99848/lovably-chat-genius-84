import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import UserDataService from '@/services/userDataService';

interface Package {
  id: string;
  name: string;
  price: number;
  tokenLimit: number;
  features: string[];
  type: 'free' | 'pro' | 'enterprise';
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  tokens: string;
  tokensUsed: number;
  tokenLimit: number;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
}

interface PaymentIframeProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  packageData: Package;
  onPaymentSuccess: (updatedUser: User) => void;
  isDarkMode: boolean;
}

const PaymentIframe: React.FC<PaymentIframeProps> = ({
  isOpen,
  onClose,
  user,
  packageData,
  onPaymentSuccess,
  isDarkMode
}) => {
  const [iframeUrl, setIframeUrl] = useState<string>('');

  const PostNedarim = (data: any) => {
    const iframe = document.getElementById('NedarimFrame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(data, "*");
    }
  };

  const ReadPostMessage = (event: MessageEvent) => {
    // Security: Only accept messages from Nedarim domain
    if (event.origin !== 'https://matara.pro') {
      return;
    }

    console.log('Nedarim message:', event.data);
    
    switch (event.data.Name) {
      case 'Height':
        // Set iframe height dynamically
        const iframe = document.getElementById('NedarimFrame') as HTMLIFrameElement;
        if (iframe) {
          iframe.style.height = (parseInt(event.data.Value) + 15) + "px";
        }
        break;

      case 'TransactionResponse':
        console.log('Transaction response:', event.data.Value);
        if (event.data.Value.Status === 'Error') {
          toast({
            title: "התשלום נכשל",
            description: event.data.Value.Message || "אנא נסה שוב או פנה לתמיכה",
            variant: "destructive"
          });
          onClose();
        } else {
          const transactionId = event.data.Value.TransactionId;
          console.log('TransactionId received from Nedarim:', transactionId);
          handlePaymentSuccess(transactionId);
        }
        break;

      case 'Error':
        console.error('Nedarim error:', event.data.Value);
        toast({
          title: "שגיאה בתשלום",
          description: event.data.Value?.message || "שגיאה לא ידועה",
          variant: "destructive"
        });
        onClose();
        break;
    }
  };

  const handleCancelTransaction = () => {
    const confirmed = window.confirm("האם אתה בטוח שברצונך לבטל את העסקה?");
    if (confirmed) {
      toast({
        title: "העסקה בוטלה",
        description: "חזרה לבחירת החבילות"
      });
      onClose();
    }
  };

  const handleChangePackage = () => {
    const confirmed = window.confirm("האם אתה בטוח שברצונך לשנות חבילה? התקדמות התשלום תאבד.");
    if (confirmed) {
      toast({
        title: "מעבר לבחירת חבילה",
        description: "חזרה לבחירת חבילות"
      });
      onClose();
    }
  };

  const handlePayButtonClick = () => {
    const requestData = {
      'Name': 'FinishTransaction2',
      'Value': {
        'Mosad': '2813479',
        'ApiValid': '7jZ+r+ukMw',
        'PaymentType': 'HK', // הוראת קבע
        'Currency': '1', // ILS
        'Zeout': '',
        'FirstName': user.name,
        'LastName': '',
        'Street': '',
        'City': '',
        'Phone': user.phone || '',
        'Mail': user.email,
        'Amount': packageData.price.toString(),
        'Tashlumim': '', // ריק עבור הוראת קבע
        'Groupe': '',
        'Comment': `תשלום עבור ${packageData.name}`,
        'Param1': packageData.name,
        'Param2': user.id,
        'Param3': user.name,
        'Param4': user.email,
        'Param5': user.category,
        'ForceUpdateMatching': '1',
        'CallBack': 'https://n8n.chatnaki.co.il/webhook/8736bd97-e422-4fa1-88b7-40822154f84b',
        'CallBackMailError': '',
        'Tokef': ''
      }
    };
    
    console.log('Sending payment request to Nedarim:', {
      PaymentType: requestData.Value.PaymentType,
      Tashlumim: requestData.Value.Tashlumim,
      Amount: requestData.Value.Amount,
      CallBack: requestData.Value.CallBack,
      Param1: requestData.Value.Param1,
      Param2: requestData.Value.Param2,
      Param3: requestData.Value.Param3,
      Param4: requestData.Value.Param4,
      Param5: requestData.Value.Param5
    });
    
    PostNedarim(requestData);
  };

  const handlePaymentSuccess = async (transactionId?: string) => {
    console.log('Processing payment success with TransactionId:', transactionId);
    
    try {
      // Send payment confirmation to server for processing
      const paymentData = {
        user_id: user.id,
        package_id: packageData.id,
        package_name: packageData.name,
        amount: packageData.price,
        transaction_id: transactionId,
        timestamp: new Date().toISOString()
      };

      // Here you would typically call your payment webhook
      // const response = await fetch('YOUR_PAYMENT_WEBHOOK_URL', { method: 'POST', body: JSON.stringify(paymentData) });
      // const responseData = await response.json();
      
      // For now, simulate server response processing
      const mockResponse = {
        success: true,
        user_data: {
          ...user,
          plan: packageData.type,
          tokenLimit: packageData.tokenLimit,
          subscriptionStatus: 'active' as const,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: null
        },
        payment_record: {
          id: transactionId || `pay_${Date.now()}`,
          amount: packageData.price,
          currency: 'ILS',
          status: 'completed',
          created_at: new Date().toISOString(),
          plan: packageData.name,
          description: `${packageData.name} subscription`
        },
        message: 'התשלום בוצע בהצלחה'
      };

      // Process payment response using UserDataService
      const processedResponse = UserDataService.processPaymentResponse(mockResponse);
      
      if (processedResponse) {
        // Update user data and payment history
        const paymentHistory = UserDataService.getPaymentHistory(user.id);
        paymentHistory.push(processedResponse.payment_record);
        
        UserDataService.updateAllUserData(
          user.id,
          processedResponse.user_data,
          undefined, // conversations - keep existing
          paymentHistory
        );
        
        // Update localStorage with subscription details
        localStorage.setItem('lovable_user', JSON.stringify(processedResponse.user_data));

        // Call parent success handler for immediate UI update
        onPaymentSuccess(processedResponse.user_data);

        toast({
          title: "התשלום אושר!",
          description: processedResponse.message || `מנוי ${packageData.name} בעיבוד - תקבל אישור סופי במייל`,
          duration: 5000
        });
      } else {
        // Fallback to old behavior
        const updatedUser = {
          ...user,
          plan: packageData.type,
          tokenLimit: packageData.tokenLimit,
          subscriptionStatus: 'active' as const,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: null
        };

        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
        onPaymentSuccess(updatedUser);

        toast({
          title: "התשלום אושר!",
          description: `מנוי ${packageData.name} בעיבוד - תקבל אישור סופי במייל`,
          duration: 5000
        });
      }

      // Show additional info toast
      setTimeout(() => {
        toast({
          title: "📧 בקרוב במייל",
          description: "אישור התשלום והפעלת המנוי יישלחו אליך במייל תוך מספר דקות",
          duration: 8000
        });
      }, 2000);

    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "שגיאה בעיבוד התשלום",
        description: "אנא פנה לתמיכה",
        variant: "destructive"
      });
    }

    onClose();
  };

  // Listen for messages from iframe (Nedarim response)
  useEffect(() => {
    window.addEventListener('message', ReadPostMessage);
    return () => window.removeEventListener('message', ReadPostMessage);
  }, [user, packageData, onPaymentSuccess, onClose]);

  // Initialize iframe when component opens
  useEffect(() => {
    if (isOpen) {
      setIframeUrl('https://matara.pro/nedarimplus/iframe?language=he');
      toast({
        title: "מעבר לתשלום",
        description: "מועבר לדף התשלום..."
      });
    }
  }, [isOpen]);

  // Setup iframe onload handler
  const handleIframeLoad = () => {
    console.log('StartNedarim');
    PostNedarim({ 'Name': 'GetHeight' });
    
    // Inject CSS for blue borders on input fields
    setTimeout(() => {
      PostNedarim({
        'Name': 'InjectCSS',
        'Value': `
          input[type="text"], 
          input[type="email"], 
          input[type="tel"], 
          input[type="number"],
          select,
          textarea {
            border: 2px solid #3b82f6 !important;
            border-radius: 6px !important;
            transition: border-color 0.2s ease !important;
          }
          input[type="text"]:focus, 
          input[type="email"]:focus, 
          input[type="tel"]:focus, 
          input[type="number"]:focus,
          select:focus,
          textarea:focus {
            border-color: #1d4ed8 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
            outline: none !important;
          }
        `
      });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md max-h-[70vh] overflow-y-auto p-0 ${
        isDarkMode 
          ? 'bg-card border-border' 
          : 'bg-card border-border'
      }`} dir="rtl">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Logo placeholder - will be replaced with actual logo */}
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">ChatNaki</h2>
              <p className="text-sm text-muted-foreground">מערכת תשלומים</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelTransaction}
              className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <ArrowLeft className="h-3 w-3 ml-1" />
              ביטול עסקה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Payment details */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {packageData.name}
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl font-bold text-primary">₪{packageData.price}</span>
              <span className="text-sm text-muted-foreground">לחודש</span>
            </div>
            
            {/* Change package button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleChangePackage}
              className="text-xs hover:bg-accent/10 hover:text-accent border-accent/30"
            >
              <RefreshCw className="h-3 w-3 ml-1" />
              שנה חבילה
            </Button>
          </div>
        </div>

        {/* Payment iframe */}
        <div className="p-3 space-y-3 overflow-y-auto max-h-[50vh]">
          {iframeUrl && (
            <>
              <div className="relative bg-background rounded-lg border-2 border-primary/20 overflow-hidden shadow-sm">
                <iframe
                  id="NedarimFrame"
                  src={iframeUrl}
                  className="w-full min-h-[350px] border-0"
                  title="Nedarim Payment Frame"
                  onLoad={handleIframeLoad}
                />
              </div>
              
              <div className="flex justify-center pt-2">
                <Button
                  onClick={handlePayButtonClick}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    💳 הרשמה למנוי ₪{packageData.price}/חודש
                  </span>
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground mt-4">
                🔒 תשלום מאובטח באמצעות נדרים פלוס
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentIframe;