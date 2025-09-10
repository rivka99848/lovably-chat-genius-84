import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Upload, X } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
}

interface ContactFormProps {
  trigger?: React.ReactNode;
  showAsIcon?: boolean;
  user?: User; // Make user optional
}

const ContactForm = ({ trigger, showAsIcon = false, user }: ContactFormProps) => {
  // Don't render if no user data is available
  if (!user) {
    return null;
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    content: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const categories = [
    'הערות',
    'דיווח על פירצה',
    'הנחה למוסדות',
    'הזמנת בוט לחברות מסחריות'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check if user is on free plan - only allow image files
    if (user.plan === 'free') {
      const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
      if (nonImageFiles.length > 0) {
        toast({
          title: "שגיאה",
          description: "משתמשי התוכנית החינמית יכולים להעלות רק קבצי תמונה",
          variant: "destructive",
        });
        return;
      }
    }
    
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      category: '',
      content: ''
    });
    setUploadedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.content) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const submitData = new FormData();
      
      // Add form fields with user data
      submitData.append('name', user.name);
      submitData.append('phone', user.phone || '');
      submitData.append('email', user.email);
      submitData.append('category', formData.category);
      submitData.append('content', formData.content);
      submitData.append('timestamp', new Date().toISOString());
      
      // Add files
      uploadedFiles.forEach((file, index) => {
        submitData.append(`file_${index}`, file);
      });

      const response = await fetch('https://n8n.smartbiz.org.il/webhook/suport', {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        toast({
          title: "הפניה נשלחה בהצלחה",
          description: "תודה על פנייתך. נחזור אליך בהקדם האפשרי.",
        });
        resetForm();
        setIsOpen(false);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "שגיאה בשליחה",
        description: "אירעה שגיאה בשליחת הפניה. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger = showAsIcon ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full"
      title="פניות לתמיכה"
    >
      <MessageCircle className="h-5 w-5" />
    </Button>
  ) : (
    <Button variant="outline" className="w-full">
      <MessageCircle className="mr-2 h-4 w-4" />
      פניות לתמיכה
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פניה לתמיכה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="category">קטגוריית הפניה *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">תוכן הפניה *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="תאר את הבעיה או השאלה שלך..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">העלאת קבצים</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                בחר קבצים
              </Button>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
              />
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'שולח...' : 'שלח פניה'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactForm;