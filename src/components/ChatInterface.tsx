import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown, Upload, Moon, Sun, LogOut, CreditCard, Menu, X, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BotStatusIndicator from './BotStatusIndicator';
import RunningBotBadge from './RunningBotBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { getToken, setToken, clearToken, fetchWithAuth, extractToken } from '@/lib/auth';

// Chat Session interface
interface ChatSession {
  id: string;
  user_id: string;
  session_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import MessageBubble from './MessageBubble';
import AuthModal from './AuthModal';
import PlanUpgrade from './PlanUpgrade';
import ContactForm from './ContactForm';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  category?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  category: string;
  plan: 'free' | 'pro' | 'enterprise';
  messagesUsed: number;
  messageLimit: number;
  subscriptionStatus?: 'free' | 'active' | 'cancel_pending' | 'expired';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  registrationDate?: string;
  profileImage?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPlanUpgrade, setShowPlanUpgrade] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [savedConversations, setSavedConversations] = useState<ChatSession[]>([]);
  const [viewingConversation, setViewingConversation] = useState<ChatSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Updated webhook URLs - separate for login and chatbot
  const LOGIN_WEBHOOK_URL = 'https://n8n.chatnaki.co.il/webhook/login';
  const CHATBOT_WEBHOOK_URL = 'https://n8n.chatnaki.co.il/webhook/chatbot';

  // Generate persistent client ID (once per browser)
  const getOrCreateClientId = () => {
    let clientId = localStorage.getItem('lovable_client_id');
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('lovable_client_id', clientId);
      console.log('Generated new client ID:', clientId);
    }
    return clientId;
  };

  // Create new session ID and persist it
  const createNewSessionId = () => {
    const sessionId = crypto.randomUUID();
    setCurrentSessionId(sessionId);
    localStorage.setItem('lovable_current_session_id', sessionId);
    console.log('Generated new session ID:', sessionId);
    return sessionId;
  };

  // Restore session ID from localStorage
  const restoreSessionId = () => {
    const savedSessionId = localStorage.getItem('lovable_current_session_id');
    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
      console.log('Restored session ID:', savedSessionId);
      return savedSessionId;
    }
    return createNewSessionId();
  };

  useEffect(() => {
    // Load user from localStorage with profile image
    const savedUser = localStorage.getItem('lovable_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      // Add default profile image if not exists
      if (!userData.profileImage) {
        userData.profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8043&color=fff`;
        localStorage.setItem('lovable_user', JSON.stringify(userData));
      }
      setUser(userData);
      loadChatHistory();
      loadSavedConversations(userData.id);
      // Restore existing session ID or create new one
      restoreSessionId();
    } else {
      setShowAuth(true);
    }
    
    // Load theme preference and apply immediately
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    // Apply theme to body element for global theming
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    const savedMessages = localStorage.getItem('lovable_chat_history');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const saveChatHistory = (newMessages: Message[]) => {
    localStorage.setItem('lovable_chat_history', JSON.stringify(newMessages));
  };

  const loadSavedConversations = async (userId: string) => {
    try {
      // Load conversations from localStorage  
      const saved = localStorage.getItem(`lovable_conversations_${userId}`);
      if (saved) {
        const conversations = JSON.parse(saved);
        setSavedConversations(conversations);
      }
    } catch (error) {
      console.error('Error loading saved conversations:', error);
    }
  };

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean, password?: string) => {
    try {
      const userId = crypto.randomUUID();
      
      if (isSignUp) {
        // רישום משתמש חדש
        const registerResponse = await fetch(LOGIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'register',
            userId,
            email,
            name,
            category,
            password,
            timestamp: new Date().toISOString()
          })
        });

        if (registerResponse.ok) {
          const responseText = await registerResponse.text();
          console.log('Register response:', responseText);
          
          let userData;
          try {
            userData = JSON.parse(responseText);
          } catch {
            userData = responseText;
          }
          
          // חלץ טוקן אם קיים
          const token = extractToken(userData);
          if (token) {
            setToken(token);
            console.log('JWT token saved after registration');
          }
          
          // אם זה true - המשתמש נרשם בהצלחה
          if (userData === true || (typeof userData === 'object' && userData.success)) {
            const newUser: User = {
              id: userData.id || userId,
              email,
              name,
              category,
              plan: userData.plan || 'free',
              messagesUsed: userData.messagesUsed || 0,
              messageLimit: userData.messageLimit || 50,
              registrationDate: new Date().toISOString(),
              profileImage: userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8043&color=fff`
            };
            
            setUser(newUser);
            localStorage.setItem('lovable_user', JSON.stringify(newUser));
            setShowAuth(false);
            
            toast({
              title: "ברוכים הבאים!",
              description: `נרשמתם בהצלחה כמומחה ב${category}.`
            });
          } else {
            // אם זה לא true - הצג את ההודעה שהשרת החזיר
            const errorMessage = typeof userData === 'string' ? userData : 'המשתמש כבר קיים במערכת';
            throw new Error(errorMessage);
          }
        } else {
          throw new Error('שגיאה ברישום. אנא נסו שוב.');
        }
      } else {
        // התחברות משתמש קיים
        const loginResponse = await fetch(LOGIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'login',
            email,
            password,
            timestamp: new Date().toISOString()
          })
        });

        if (loginResponse.ok) {
          const responseText = await loginResponse.text();
          console.log('Login response:', responseText);
          
          let userData;
          try {
            userData = JSON.parse(responseText);
          } catch {
            userData = responseText;
          }
          
          // חלץ טוקן אם קיים
          const token = extractToken(userData);
          if (token) {
            setToken(token);
            console.log('JWT token saved after login');
          }
          
          // אם זה true או array עם success: true - המשתמש התחבר בהצלחה
          if (userData === true || 
              (typeof userData === 'object' && userData.success) ||
              (Array.isArray(userData) && userData.length > 0 && userData[0].success)) {
            const existingUser: User = {
              id: userData.id || userId,
              email,
              name: userData.name || name,
              category: userData.category || 'תכנות',
              plan: userData.plan || 'free',
              messagesUsed: userData.messagesUsed || 0,
              messageLimit: userData.messageLimit || 50,
              registrationDate: userData.registrationDate || new Date().toISOString(),
              profileImage: userData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || name)}&background=0D8043&color=fff`
            };
            
            setUser(existingUser);
            localStorage.setItem('lovable_user', JSON.stringify(existingUser));
            setShowAuth(false);
            
            toast({
              title: "ברוכים הבאים!",
              description: `התחברתם בהצלחה כמומחה ב${existingUser.category}.`
            });
          } else {
            // אם זה לא true - הצג את ההודעה שהשרת החזיר
            const errorMessage = typeof userData === 'string' ? userData : 'שגיאה בהתחברות';
            throw new Error(errorMessage);
          }
        } else {
          throw new Error('שגיאה בהתחברות. אנא נסו שוב.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const detectFileType = (file: File): string => {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    
    // Audio files - check file extension first to ensure correct format detection
    if (fileName.endsWith('.mp3') || fileName.endsWith('.mpga')) return 'mp3';
    if (fileName.endsWith('.wav')) return 'wav';
    if (fileName.endsWith('.weba')) return 'weba';
    if (fileName.endsWith('.aac')) return 'aac';
    if (fileName.endsWith('.ogg')) return 'ogg';
    if (fileName.endsWith('.m4a')) return 'm4a';
    
    // Video files
    if (mimeType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.avi') || fileName.endsWith('.mov') || fileName.endsWith('.mkv') || fileName.endsWith('.wmv') || fileName.endsWith('.webm')) {
      if (fileName.endsWith('.webm')) return 'webm';
      return 'mp4';
    }
    
    // Fallback to mime type check for audio files without recognized extensions
    if (mimeType.startsWith('audio/')) {
      if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
      if (mimeType.includes('wav')) return 'wav';
      if (mimeType.includes('webm')) return 'webm';
      return 'mp3'; // default for audio
    }
    
    return 'file';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Detect file types and show appropriate messages
    const audioVideoFiles = files.filter(file => {
      const type = detectFileType(file);
      return ['mp3', 'wav', 'mp4', 'weba', 'webm', 'aac', 'ogg', 'm4a'].includes(type);
    });
    
    setUploadedFiles(prev => [...prev, ...files]);
    
    if (audioVideoFiles.length > 0) {
      const formats = audioVideoFiles.map(file => detectFileType(file)).join(', ');
      toast({
        title: "קבצי מדיה הועלו",
        description: `הועלו ${audioVideoFiles.length} קבצי אודיו/וידאו בפורמטים: ${formats}`
      });
    } else {
      toast({
        title: "קבצים הועלו",
        description: `הועלו ${files.length} קבצים בהצלחה.`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const generateChatTitle = (content: string): string => {
    const words = content.split(' ').filter(word => word.length > 2);
    return words.slice(0, 3).join(' ') || 'שיחה חדשה';
  };

  const saveCurrentConversation = async () => {
    if (messages.length === 0 || !user || !currentSessionId) return;
    
    const title = generateChatTitle(messages[0]?.content || 'שיחה חדשה');
    
    try {
      // Save to localStorage with consistent structure using session_id
      const conversation: ChatSession = {
        id: crypto.randomUUID(), // Generate ID for localStorage compatibility
        session_id: currentSessionId,
        user_id: user.id,
        title,
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save conversation metadata
      const existing = localStorage.getItem(`lovable_conversations_${user.id}`);
      const conversations = existing ? JSON.parse(existing) : [];
      
      // Remove existing conversation with same session_id
      const filteredConversations = conversations.filter((c: ChatSession) => c.session_id !== currentSessionId);
      filteredConversations.unshift(conversation);
      
      // Keep only last 10 conversations
      if (filteredConversations.length > 10) {
        filteredConversations.splice(10);
      }
      
      localStorage.setItem(`lovable_conversations_${user.id}`, JSON.stringify(filteredConversations));
      
      // Save messages separately by session_id
      localStorage.setItem(`lovable_messages_${currentSessionId}`, JSON.stringify(messages));
      
      toast({
        title: "השיחה נשמרה",
        description: "השיחה נשמרה בחשבון שלכם"
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "שגיאה בשמירה",
        description: "לא ניתן לשמור את השיחה",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if ((!inputValue.trim() && uploadedFiles.length === 0) || !user || isLoading) return;

    // Ensure we have a session ID - create one if empty
    if (!currentSessionId) {
      createNewSessionId();
    }

    // Check token limits  
    if (user.messagesUsed >= user.messageLimit) {
      toast({
        title: "נגמרו הטוקנים",
        description: "נגמרו לכם הטוקנים לחודש זה. שדרגו את התוכנית או המתינו לחידוש החודשי.",
        variant: "destructive"
      });
      setShowPlanUpgrade(true);
      return;
    }

    // Create user message display content
    const displayContent = inputValue || 
                          (uploadedFiles.length > 0 ? `הועלה קובץ: ${uploadedFiles.map(f => f.name).join(', ')}` : '');

    const userMessage: Message = {
      id: Date.now().toString(),
      content: displayContent,
      isUser: true,
      timestamp: new Date(),
      category: user.category
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    
    console.log('Preparing to send message with session ID:', currentSessionId);
    
    // Get session title from existing conversation or create from message
    const sessionTitle = savedConversations.find(conv => conv.session_id === currentSessionId)?.title || 
                         inputValue.slice(0, 50) + (inputValue.length > 50 ? '...' : '') || 'שיחה חדשה';

    // Prepare form data for file upload with all user details and session ID
    const formData = new FormData();
    formData.append('userId', user.id);
    formData.append('userEmail', user.email);
    formData.append('userName', user.name);
    formData.append('userCategory', user.category);
    formData.append('userPlan', user.plan);
    formData.append('userMessagesUsed', user.messagesUsed.toString());
    formData.append('userMessageLimit', user.messageLimit.toString());
    formData.append('message', inputValue);
    formData.append('messagePosition', (messages.length + 1).toString());
    formData.append('sessionTitle', sessionTitle);
    formData.append('category', user.category);
    formData.append('timestamp', new Date().toISOString());
    formData.append('sessionId', currentSessionId);
    formData.append('clientId', getOrCreateClientId());
    
    // Add JWT token to form data
    const token = getToken();
    if (token) {
      formData.append('token', token);
    }
    
    // Add files to form data 
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file, index) => {
        formData.append('file', file);
      });
    }

    // Log all form data for debugging
    console.log('Form data being sent:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      console.log('Sending request to chatbot webhook:', CHATBOT_WEBHOOK_URL, 'with sessionId:', currentSessionId);
      const response = await fetch(CHATBOT_WEBHOOK_URL, {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('Parsed response data:', data);
        } catch (parseError) {
          console.log('Response is not JSON, using as plain text:', responseText);
          data = { message: responseText };
        }
        
        // Check for updated token in response
        const newToken = extractToken(data);
        if (newToken) {
          setToken(newToken);
          console.log('JWT token updated from bot response');
        }
        
        // Handle server response - if it's true, process the message, otherwise just show the message
        let cleanContent = '';
        let shouldProcessMessage = false;
        
        if (data === true) {
          // השרת החזיר true - השליחה הצליחה, מעביר לממשק הבוט
          shouldProcessMessage = true;
          cleanContent = 'ההודעה נשלחה בהצלחה לשרת.';
          navigate('/'); // העברה לממשק הבוט הראשי
        } else if (Array.isArray(data)) {
          console.log('Response is an array:', data);
          if (data.length === 0) {
            cleanContent = 'השרת החזיר תגובה ריקה.';
          } else {
            const firstItem = data[0];
            if (typeof firstItem === 'string') {
              cleanContent = firstItem;
              shouldProcessMessage = true;
            } else if (firstItem && typeof firstItem === 'object') {
              if (firstItem.shouldProcess === true || firstItem.success === true) {
                shouldProcessMessage = true;
                cleanContent = firstItem.message || firstItem.response || firstItem.content || firstItem.text || 'קיבלתי תגובה מהשרת';
              } else {
                // רק הצג את ההודעה בלי לעבד
                cleanContent = firstItem.message || firstItem.response || firstItem.content || firstItem.text || JSON.stringify(firstItem);
              }
            } else {
              cleanContent = JSON.stringify(data);
            }
          }
        } else if (typeof data === 'string') {
          cleanContent = data || 'תגובה ריקה מהשרת';
          shouldProcessMessage = true;
        } else if (data && typeof data === 'object') {
          if (data.shouldProcess === true || data.success === true) {
            shouldProcessMessage = true;
            cleanContent = data.message || data.response || data.content || data.text || 'קיבלתי תגובה מהשרת';
          } else {
            // רק הצג את ההודעה בלי לעבד
            cleanContent = data.message || data.response || data.content || data.text || JSON.stringify(data);
          }
        } else {
          cleanContent = responseText || 'קיבלתי תשובה לא צפויה מהשרת';
        }

        console.log('Final message content:', cleanContent);
        console.log('Should process message:', shouldProcessMessage);

        // Ensure we have some content to display
        if (!cleanContent || cleanContent.trim() === '' || cleanContent === '[]' || cleanContent === 'null') {
          cleanContent = 'השרת לא החזיר תוכן.';
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanContent,
          isUser: false,
          timestamp: new Date(),
          category: user.category
        };

        console.log('Creating bot message:', botMessage);

        const updatedMessages = [...newMessages, botMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);

        // Update session last message time in localStorage
        if (currentSessionId && user) {
          try {
            const existing = localStorage.getItem(`lovable_conversations_${user.id}`);
            if (existing) {
              const conversations = JSON.parse(existing);
              const updated = conversations.map((conv: ChatSession) => 
                conv.session_id === currentSessionId 
                  ? { ...conv, last_message_at: new Date().toISOString() }
                  : conv
              );
              localStorage.setItem(`lovable_conversations_${user.id}`, JSON.stringify(updated));
            }
          } catch (error) {
            console.error('Error updating session timestamp:', error);
          }
        }

        // Update message count only if we should process the message
        if (shouldProcessMessage) {
          const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
          setUser(updatedUser);
          localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
        }

        toast({
          title: "תשובה התקבלה",
          description: shouldProcessMessage ? "השרת השיב בהצלחה" : "הודעה מהשרת"
        });
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        toast({
          title: "שגיאת שרת",
          description: `שגיאה ${response.status}: ${errorText?.slice(0, 180) || response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "שגיאת הודעה",
        description: "נכשל בשליחת ההודעה. אנא נסו שוב.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = (conversation: ChatSession) => {
    try {
      // Load messages by session_id
      const savedMessages = localStorage.getItem(`lovable_messages_${conversation.session_id}`);
      if (savedMessages) {
        const messages = JSON.parse(savedMessages);
        setMessages(messages);
        saveChatHistory(messages);
      } else {
        // Fallback: try to find in old format
        const saved = localStorage.getItem(`lovable_conversations_${user?.id}`);
        if (saved) {
          const conversations = JSON.parse(saved);
          const localConv = conversations.find((c: any) => c.session_id === conversation.session_id || c.title === conversation.title);
          if (localConv && localConv.messages) {
            setMessages(localConv.messages);
            saveChatHistory(localConv.messages);
            // Migrate to new format
            localStorage.setItem(`lovable_messages_${conversation.session_id}`, JSON.stringify(localConv.messages));
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
      
      setViewingConversation(conversation);
      setCurrentSessionId(conversation.session_id);
      localStorage.setItem('lovable_current_session_id', conversation.session_id);
      
      toast({
        title: "שיחה נטענה",
        description: `נטענה השיחה: ${conversation.title}`
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([]);
      setViewingConversation(conversation);
      setCurrentSessionId(conversation.session_id);
      
      toast({
        title: "שיחה נטענה",
        description: `נטענה השיחה: ${conversation.title}`
      });
    }
  };

  const returnToCurrentConversation = () => {
    setViewingConversation(null);
    loadChatHistory();
    restoreSessionId();
    
    toast({
      title: "חזרה לשיחה נוכחית",
      description: "חזרתם לשיחה הנוכחית"
    });
  };

  const startNewConversation = async () => {
    // Save current conversation before starting new one
    if (messages.length > 0 && !viewingConversation) {
      await saveCurrentConversation();
      // Reload saved conversations to show the updated list
      if (user) {
        loadSavedConversations(user.id);
      }
    }
    
    setMessages([]);
    setViewingConversation(null);
    saveChatHistory([]);
    // Create new session ID for new conversation
    createNewSessionId();
    
    toast({
      title: "שיחה חדשה",
      description: "התחלנו שיחה חדשה. השיחה הקודמת נשמרה."
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
    navigate('/profile');
  };

  const handleSubscriptionClick = () => {
    console.log('Subscription clicked');
    navigate('/subscription');
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade clicked');
    setShowPlanUpgrade(true);
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // Clear user data and JWT token
    setUser(null);
    localStorage.removeItem('lovable_user');
    localStorage.removeItem('lovable_chat_history');
    localStorage.removeItem('lovable_current_session_id');
    setCurrentSessionId('');
    clearToken(); // Clear JWT token
    
    // Clear messages
    setMessages([]);
    
    toast({
      title: "התנתקת בהצלחה",
      description: "מעבירים אותך לדף ההתחברות"
    });
    
    // Show auth modal
    setShowAuth(true);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (showAuth) {
    return <AuthModal onAuth={authenticateUser} onClose={() => setShowAuth(false)} />;
  }

  if (showPlanUpgrade) {
    return <PlanUpgrade 
      isOpen={true}
      onClose={() => setShowPlanUpgrade(false)} 
      user={user}
      onUpdateUser={(updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
        setShowPlanUpgrade(false);
      }}
      isDarkMode={isDarkMode}
    />;
  }

  return (
    <div className={`flex h-screen premium-gradient ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`} dir="rtl">
      <RunningBotBadge isDarkMode={isDarkMode} />
      <div className="chat-background-decoration" />
      
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className={`w-80 lg:w-96 border-l backdrop-blur-xl flex flex-col transition-all duration-300 bg-gray-900 ${
          isDarkMode 
            ? 'border-gray-700/50' 
            : 'border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b bg-gray-900 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                בוט מסונן
              </h1>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-white/80' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                  title="החלף צבע"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setShowPlanUpgrade(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-white/10 text-yellow-400' 
                      : 'hover:bg-gray-100 text-yellow-600'
                  }`}
                  title="שדרוג"
                >
                  <Crown className="w-5 h-5" />
                </button>
                {user && <ContactForm showAsIcon={true} user={user} />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-white/10 text-blue-400' 
                          : 'hover:bg-gray-100 text-blue-600'
                      }`}
                      title="הגדרות"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border shadow-lg">
                    <DropdownMenuItem onClick={handleLogout} dir="rtl" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <LogOut className="ml-2 h-4 w-4" />
                      התנתקות
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSettingsClick} dir="rtl">
                      <Settings className="ml-2 h-4 w-4" />
                      הגדרות
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSubscriptionClick} dir="rtl">
                      <FileText className="ml-2 h-4 w-4" />
                      ניהול מנוי
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUpgradeClick} dir="rtl">
                      <CreditCard className="ml-2 h-4 w-4" />
                      שדרוג
                    </DropdownMenuItem>
                    {user && (
                      <DropdownMenuItem asChild dir="rtl">
                        <ContactForm user={user} />
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {user && (
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 space-x-reverse text-sm ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}>
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                  {user.category}
                </Badge>
                <div className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                  {user.messagesUsed.toLocaleString()}/{user.messageLimit.toLocaleString()} טוקנים נשלחו
                </div>
              </div>
            )}
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <Button
              onClick={startNewConversation}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border-0 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              שיחה חדשה
            </Button>
          </div>

          {/* Chat History Summary */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>שיחות אחרונות</h3>
            <div className="space-y-2">
              {/* Current conversation */}
              {messages.length > 0 && !viewingConversation && (
                <Card className={`p-3 cursor-pointer transition-colors border-green-500/50 ${
                  isDarkMode 
                    ? 'bg-green-600/20 border-green-600/30 hover:bg-green-600/30' 
                    : 'bg-green-50 border-green-200 hover:bg-green-100'
                }`}>
                  <div className={`text-sm truncate ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    <span className="text-green-400 text-xs">שיחה נוכחית • </span>
                    {generateChatTitle(messages[0]?.content || 'שיחה חדשה')}
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    {messages.length} הודעות
                  </div>
                </Card>
              )}

              {/* Back to current conversation button when viewing saved conversation */}
              {viewingConversation && (
                <Card 
                  onClick={returnToCurrentConversation}
                  className={`p-3 cursor-pointer transition-colors border-blue-500/50 ${
                    isDarkMode 
                      ? 'bg-blue-600/20 border-blue-600/30 hover:bg-blue-600/30' 
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    ↩ חזרה לשיחה נוכחית
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    לחצו לחזרה לשיחה הפעילה
                  </div>
                </Card>
              )}

              {/* Currently viewing conversation indicator */}
              {viewingConversation && (
                <Card className={`p-3 border-purple-500/50 ${
                  isDarkMode 
                    ? 'bg-purple-600/20 border-purple-600/30' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className={`text-sm truncate ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    <span className="text-purple-400 text-xs">צופים כעת • </span>
                    {viewingConversation.title}
                  </div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    שיחה פתוחה
                  </div>
                </Card>
              )}
              
              {/* Saved conversations */}
              {savedConversations.map((conversation, index) => (
                <Card 
                  key={conversation.session_id} 
                  onClick={() => loadConversation(conversation)}
                  className={`p-3 cursor-pointer transition-colors ${
                    viewingConversation?.session_id === conversation.session_id 
                      ? (isDarkMode 
                          ? 'bg-purple-600/20 border-purple-600/30' 
                          : 'bg-purple-50 border-purple-200') 
                      : (isDarkMode 
                          ? 'bg-white/10 border-white/10 hover:bg-white/15' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                  }`}
                >
                  <div className={`text-sm truncate ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>
                    {conversation.title}
                  </div>
                  <div className={`text-xs mt-1 flex justify-between ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
                    <span>שיחה משומרת</span>
                    <span>{new Date(conversation.last_message_at).toLocaleDateString('he-IL')}</span>
                  </div>
                </Card>
              ))}
              
              {/* Empty state */}
              {messages.length === 0 && savedConversations.length === 0 && (
                <div className={`text-sm text-center py-8 ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                  עדיין אין שיחות
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
            <div className={`text-sm text-center ${isDarkMode ? 'text-white/50' : 'text-gray-500'}`}>
              הקטגוריה שלכם: <span className="font-semibold text-green-400">{user?.category}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col chat-container ${isDarkMode ? '' : 'bg-white/95'}`}>
        {/* Toggle Sidebar Button */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-white/10 text-white/80 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            title={isSidebarOpen ? "הסתר תפריט" : "הצג תפריט"}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {/* Chat Messages */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isDarkMode ? '' : 'bg-white text-gray-900'}`}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד
              </h2>
              <p className={`max-w-md mx-auto ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                המומחה שלכם ב{user?.category} מוכן לעזור. 
                שאלו אותי כל שאלה הקשורה ל{user?.category.toLowerCase()}!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} isDarkMode={isDarkMode} />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-end">
              <div className={`rounded-lg p-4 backdrop-blur-sm border max-w-xs ${
                isDarkMode 
                  ? 'bg-white/10 border-white/10' 
                  : 'bg-gray-100 border-gray-200'
              }`}>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t backdrop-blur-xl p-6 bg-gray-900 ${
          isDarkMode 
            ? 'border-white/10' 
            : 'border-gray-200'
        }`}>
          {uploadedFiles.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDarkMode 
                ? 'bg-white/5 border-white/10' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-white border-gray-300'
                  }`}>
                    <span className={`text-sm ${isDarkMode ? 'text-white/70' : 'text-gray-700'}`}>{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-4 space-x-reverse">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".mp3,.txt,.md,.csv,.tsv,.json,.xml,.yml,.yaml,.html,.htm,.ini,.log,.js,.py,.jpeg,.jpg,.png,.webp"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isDarkMode 
                  ? 'hover:bg-white/5 text-white/80 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              } ${user && user.messagesUsed >= user.messageLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading || (user && user.messagesUsed >= user.messageLimit)}
              title="העלאת קבצים"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <div className="flex-1 relative">
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={user && user.messagesUsed >= user.messageLimit ? 
                  "נגמרו הטוקנים - שדרגו את התוכנית כדי להמשיך" :
                  `שאלו את המומחה שלכם ב${user?.category} כל שאלה או העלו קבצים...`}
                className={`w-full min-h-[48px] max-h-32 pl-12 py-3 text-base text-right backdrop-blur-sm resize-none ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 focus:border-green-400 focus:ring-green-400 text-white placeholder-white/50' 
                    : 'bg-white/80 border-gray-200 focus:border-green-500 focus:ring-green-500 text-gray-900 placeholder-gray-500'
                } rounded-lg border ${user && user.messagesUsed >= user.messageLimit ? 'opacity-50' : ''}`}
                disabled={isLoading || (user && user.messagesUsed >= user.messageLimit)}
                rows={1}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={(!inputValue.trim() && uploadedFiles.length === 0) || isLoading || (user && user.messagesUsed >= user.messageLimit)}
              className={`p-3 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                isDarkMode 
                  ? 'hover:bg-white/5 text-white/80 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
              title="שליחת נתונים"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {user && user.messagesUsed >= user.messageLimit && (
            <div className="mt-3 p-3 rounded-lg border bg-white border-gray-300 text-black">
              <p className="text-sm font-medium">
                נגמרו לכם הטוקנים ({user.messagesUsed.toLocaleString()}/{user.messageLimit.toLocaleString()} נשלחו).
                {user.registrationDate && (
                  <span className="block mt-1">
                    נרשמתם ב-{new Date(user.registrationDate).toLocaleDateString('he-IL')} - טוקנים מתחדשים בתחילת החודש הבא.
                  </span>
                )}
                <Button
                  variant="link"
                  className="p-0 mr-1 underline text-black"
                  onClick={() => setShowPlanUpgrade(true)}
                >
                  שדרגו לטוקנים ללא הגבלה
                </Button>
              </p>
            </div>
          )}
          
          {user && user.messagesUsed >= user.messageLimit * 0.8 && user.messagesUsed < user.messageLimit && (
            <div className="mt-3 p-3 rounded-lg border bg-white border-gray-300 text-black">
              <p className="text-sm">
                נגמרים לכם הטוקנים ({user.messagesUsed.toLocaleString()}/{user.messageLimit.toLocaleString()} נשלחו). 
                <Button
                  variant="link"
                  className="p-0 mr-1 underline text-black"
                  onClick={() => setShowPlanUpgrade(true)}
                >
                  שדרגו לטוקנים ללא הגבלה
                </Button>
              </p>
            </div>
          )}
          
          {/* Footer Credit */}
          <div className={`mt-4 pt-3 border-t text-center ${
            isDarkMode 
              ? 'border-white/10 text-white/40' 
              : 'border-gray-200 text-gray-400'
          }`}>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span>פותח על ידי</span>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${
                  isDarkMode ? 'text-white/60 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <img 
                  src="/path-to-your-logo.png" 
                  alt="Developer Logo" 
                  className="h-4 w-auto"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span>Your Name</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
