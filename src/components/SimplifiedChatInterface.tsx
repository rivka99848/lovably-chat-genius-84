import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, Settings, Crown, Upload, Moon, Sun, LogOut, CreditCard, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
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
  registrationDate?: string;
}

interface ChatSession {
  id: string;
  session_id: string;
  title: string;
  created_at: string;
  last_message_at: string;
}

const SimplifiedChatInterface = () => {
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
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Updated webhook URLs
  const CHATBOT_WEBHOOK_URL = 'https://n8n.chatnaki.co.il/webhook/chatbot';
  const LOGIN_WEBHOOK_URL = 'https://n8n.smartbiz.org.il/webhook/login';

  // Create new session ID
  const createNewSessionId = () => {
    const sessionId = crypto.randomUUID();
    setCurrentSessionId(sessionId);
    console.log('Generated new session ID:', sessionId);
    return sessionId;
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      setAuthLoading(true);
      
      // Check for existing session in localStorage
      const savedUser = localStorage.getItem('lovable_user');
      if (savedUser) {
        try {
          const currentUser = JSON.parse(savedUser);
          setUser(currentUser);
          loadChatHistory();
          loadSavedConversations(currentUser.id);
          createNewSessionId();
          setShowAuth(false);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('lovable_user');
          setShowAuth(true);
        }
      } else {
        setShowAuth(true);
      }
      
      setAuthLoading(false);
    };

    initializeAuth();

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = (sessionId?: string) => {
    const sessionKey = sessionId || currentSessionId;
    if (!sessionKey) return;
    
    const savedMessages = localStorage.getItem(`lovable_chat_history:${sessionKey}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  const saveChatHistory = (newMessages: Message[], sessionId?: string) => {
    const sessionKey = sessionId || currentSessionId;
    if (!sessionKey) return;
    
    localStorage.setItem(`lovable_chat_history:${sessionKey}`, JSON.stringify(newMessages));
  };

  const loadSavedConversations = (userId: string) => {
    try {
      const savedSessions = localStorage.getItem(`lovable_conversations:${userId}`);
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        setSavedConversations(sessions);
      } else {
        setSavedConversations([]);
      }
    } catch (error) {
      console.error('Error loading saved conversations:', error);
      setSavedConversations([]);
    }
  };

  const authenticateUser = async (email: string, name: string, category: string, isSignUp: boolean, password?: string) => {
    try {
      const response = await fetch(LOGIN_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          category,
          isSignUp
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'שגיאה בהתחברות');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('lovable_user', JSON.stringify(data.user));
        localStorage.setItem('lovable_token', data.token || '');
        setShowAuth(false);
        
        toast({
          title: "ברוכים הבאים!",
          description: isSignUp 
            ? `נרשמתם בהצלחה כמומחה ב${category}.`
            : `התחברתם בהצלחה כמומחה ב${data.user.category}.`
        });
        
        // Load conversations for this user
        loadSavedConversations(data.user.id);
        createNewSessionId();
      } else {
        throw new Error(data.message || 'שגיאה בהתחברות');
      }
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    try {
      // Clear all user data from localStorage
      setUser(null);
      setMessages([]);
      setSavedConversations([]);
      localStorage.removeItem('lovable_user');
      localStorage.removeItem('lovable_token');
      
      // Clear all session-specific chat histories
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lovable_chat_history:') || key.startsWith('lovable_conversations:')) {
          localStorage.removeItem(key);
        }
      });
      
      setShowAuth(true);
      
      toast({
        title: "התנתקתם בהצלחה",
        description: "להתראות!"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      category: user.category
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    
    console.log('Preparing to send message with session ID:', currentSessionId);
    
    setInputValue('');
    setIsLoading(true);

    try {
      // Create session in localStorage on first message
      if (currentSessionId && messages.length === 0) {
        const sessionTitle = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        const newSession: ChatSession = {
          id: currentSessionId,
          session_id: currentSessionId,
          title: sessionTitle,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        };
        
        // Save to conversations list
        const existingConversations = localStorage.getItem(`lovable_conversations:${user.id}`);
        const conversations = existingConversations ? JSON.parse(existingConversations) : [];
        conversations.unshift(newSession);
        localStorage.setItem(`lovable_conversations:${user.id}`, JSON.stringify(conversations));
        
        // Update local state
        setSavedConversations(conversations);
      }

      // Get session title from existing conversation or create from message
      const sessionTitle = savedConversations.find(conv => conv.session_id === currentSessionId)?.title || 
                           userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '') || 'שיחה חדשה';

      // Note: In real implementation, would send request with these parameters:
      // - userId: user.id
      // - userEmail: user.email  
      // - message: inputValue (clean text only)
      // - messagePosition: messages.length + 1
      // - sessionTitle: sessionTitle
      // - sessionId: currentSessionId
      // - clientId: getOrCreateClientId()
      // - file: uploadedFiles (if any)

      // Simple mock AI response for now
      setTimeout(() => {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `קיבלתי את השאלה שלך: "${userMessage.content}". זהו מענה דמה. בקרוב אשלב עם המערכת המלאה.`,
          isUser: false,
          timestamp: new Date(),
          category: user.category
        };

        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        saveChatHistory(finalMessages);
        
        // Update session last message time in localStorage
        if (currentSessionId) {
          const existingConversations = localStorage.getItem(`lovable_conversations:${user.id}`);
          if (existingConversations) {
            const conversations = JSON.parse(existingConversations);
            const updatedConversations = conversations.map((conv: ChatSession) => 
              conv.session_id === currentSessionId 
                ? { ...conv, last_message_at: new Date().toISOString() }
                : conv
            );
            localStorage.setItem(`lovable_conversations:${user.id}`, JSON.stringify(updatedConversations));
            setSavedConversations(updatedConversations);
          }
        }
        
        // Update user message count
        const updatedUser = { ...user, messagesUsed: user.messagesUsed + 1 };
        setUser(updatedUser);
        localStorage.setItem('lovable_user', JSON.stringify(updatedUser));

        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'מצטער, אירעה שגיאה בשליחת ההודעה. אנא נסה שוב.',
        isUser: false,
        timestamp: new Date(),
        category: user.category
      };
      
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);

      toast({
        title: "שגיאה בשליחה",
        description: "לא ניתן לשלוח את ההודעה כרגע",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    createNewSessionId();
    // Focus input after creating new chat
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSelectConversation = (conversation: ChatSession) => {
    setCurrentSessionId(conversation.session_id);
    loadChatHistory(conversation.session_id);
  };

  const handleDeleteConversation = (conversation: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    try {
      // Remove from localStorage chat history
      localStorage.removeItem(`lovable_chat_history:${conversation.session_id}`);
      
      // Remove from conversations list
      if (user) {
        const existingConversations = localStorage.getItem(`lovable_conversations:${user.id}`);
        if (existingConversations) {
          const conversations = JSON.parse(existingConversations);
          const updatedConversations = conversations.filter((conv: ChatSession) => 
            conv.session_id !== conversation.session_id
          );
          localStorage.setItem(`lovable_conversations:${user.id}`, JSON.stringify(updatedConversations));
          setSavedConversations(updatedConversations);
        }
      }
      
      // If this was the current session, start a new one
      if (conversation.session_id === currentSessionId) {
        handleNewChat();
      }
      
      toast({
        title: "שיחה נמחקה",
        description: "השיחה נמחקה בהצלחה"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את השיחה",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (showAuth) {
    return (
      <div className={`h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="h-full bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
          <AuthModal 
            onAuth={authenticateUser}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden premium-dark-surface border-r border-sidebar-border`}>
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-sidebar-foreground">היסטוריית צ'אטים</h2>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="premium-icon-button"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat History */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {savedConversations.map((conversation) => (
              <Card 
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation)}
                className={`p-3 cursor-pointer hover:bg-sidebar-accent/50 transition-colors premium-dark-surface border-sidebar-border relative group ${
                  conversation.session_id === currentSessionId ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="text-sm font-medium text-sidebar-foreground truncate pr-8">
                  {conversation.title}
                </div>
                <div className="text-xs text-sidebar-foreground/70 mt-1">
                  {new Date(conversation.last_message_at).toLocaleDateString('he-IL')}
                </div>
                <Button
                  onClick={(e) => handleDeleteConversation(conversation, e)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Card>
            ))}
          </div>

          {/* User Info */}
          {user && (
            <div className="pt-4 border-t border-sidebar-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-sidebar-foreground/70">
                      {user.messagesUsed}/{user.messageLimit} טוקנים
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="premium-icon-button">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      פרופיל
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPlanUpgrade(true)}>
                      <Crown className="w-4 h-4 mr-2" />
                      שדרג חבילה
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                      {isDarkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                      {isDarkMode ? 'מצב בהיר' : 'מצב כהה'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      התנתק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-background via-card to-background">
        {/* Header */}
        <div className="premium-dark-surface border-b border-sidebar-border p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              variant="ghost"
              size="sm"
              className="premium-icon-button"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">
              בוט מומחים מסונן
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {user.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {user.plan}
              </Badge>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  ברוכים הבאים לבוט המומחים המסונן
                </h2>
                <p className="text-muted-foreground">
                  שלחו לנו הודעה וקבלו מענה מומחה ב{user?.category}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isDarkMode={isDarkMode}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md premium-dark-surface rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">המומחה כותב...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="premium-dark-surface border-t border-sidebar-border p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="שלחו הודעה למומחה..."
              className="flex-1 text-right premium-dark-surface border-sidebar-border focus:border-primary"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPlanUpgrade && user && (
        <PlanUpgrade 
          isOpen={showPlanUpgrade}
          onClose={() => setShowPlanUpgrade(false)}
          user={user}
          onUpdateUser={(updatedUser: User) => {
            setUser(updatedUser);
            localStorage.setItem('lovable_user', JSON.stringify(updatedUser));
          }}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default SimplifiedChatInterface;