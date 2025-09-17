
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfile from '@/components/UserProfile';

interface User {
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

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Redirect to home if no user found
      navigate('/');
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, [navigate]);

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleClose = () => {
    navigate('/');
  };

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <UserProfile
      user={user}
      onClose={handleClose}
      onUpdateUser={handleUpdateUser}
      isDarkMode={isDarkMode}
      onThemeToggle={handleThemeToggle}
    />
  );
};

export default Profile;
