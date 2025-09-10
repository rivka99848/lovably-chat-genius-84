import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionManager from '@/components/SubscriptionManager';
import { toast } from '@/hooks/use-toast';

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

const Subscription = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load user from localStorage or your auth context
    const storedUser = localStorage.getItem('lovable_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser({
        ...parsedUser,
        registrationDate: parsedUser.registrationDate || new Date().toISOString()
      });
    } else {
      // Redirect to login if no user
      navigate('/');
      toast({
        title: "נדרשת התחברות",
        description: "אנא התחבר כדי לגשת לניהול המנוי",
        variant: "destructive"
      });
    }

    // Load theme preference
    const theme = localStorage.getItem('lovable_theme');
    setIsDarkMode(theme === 'dark');
  }, [navigate]);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
  };

  const handleClose = () => {
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SubscriptionManager
      user={user}
      onUpdateUser={handleUpdateUser}
      isDarkMode={isDarkMode}
      onClose={handleClose}
    />
  );
};

export default Subscription;