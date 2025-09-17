
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, CreditCard, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { clearToken } from '@/lib/auth';
import ContactForm from './ContactForm';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  profileImage?: string;
}

interface ProfileDropdownProps {
  user?: User; // Make user optional
}

const ProfileDropdown = ({ user }: ProfileDropdownProps) => {
  const navigate = useNavigate();

  // Don't render if no user data is available
  if (!user) {
    return null;
  }

  // Get user initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    navigate('/profile');
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade clicked');
    toast({
      title: "שדרוג התוכנית",
      description: "עמוד השדרוג יהיה זמין בקרוב"
    });
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // Clear JWT token and user data
    clearToken();
    localStorage.removeItem('lovable_user');
    localStorage.removeItem('lovable_chat_history');
    localStorage.removeItem('lovable_session_id');
    localStorage.removeItem('lovable_current_session_id');
    
    toast({
      title: "התנתקת בהצלחה",
      description: "מעבירים אותך לדף ההתחברות"
    });
    
    // Navigate back to home page where the auth modal will appear
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse p-1 h-auto">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.profileImage} alt={user.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-foreground">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border shadow-lg">
        <div className="px-2 py-1.5 text-sm font-semibold">{user.name}</div>
        <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettingsClick} dir="rtl">
          <Settings className="ml-2 h-4 w-4" />
          הגדרות
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUpgradeClick} dir="rtl">
          <CreditCard className="ml-2 h-4 w-4" />
          שדרוג
        </DropdownMenuItem>
        <DropdownMenuItem asChild dir="rtl">
          <ContactForm user={user} />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} dir="rtl" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
          <LogOut className="ml-2 h-4 w-4" />
          התנתק
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
