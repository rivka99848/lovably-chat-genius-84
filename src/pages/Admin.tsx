
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Settings, Save, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface BotSettings {
  welcomeMessage: string;
  categories: string[];
  webhookUrl: string;
  systemPrompts: { [key: string]: string };
  planLimits: {
    free: number;
    pro: number;
    enterprise: number;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<BotSettings>({
    welcomeMessage: 'ברוכים הבאים לבוט המסונן שלנו – לצרכי עבודה בלבד',
    categories: ['תכנות', 'עיצוב', 'שיווק', 'כתיבה', 'עסקים'],
    webhookUrl: 'https://n8n.smartbiz.org.il/webhook',
    systemPrompts: {
      'תכנות': 'אתה מומחה תכנות המסייע בכתיבת קוד ופתרון בעיות טכניות',
      'עיצוב': 'אתה מומחה עיצוב המסייע ביצירת עיצובים ו-UI/UX',
      'שיווק': 'אתה מומחה שיווק המסייע באסטרטגיות שיווק ופרסום',
      'כתיבה': 'אתה מומחה כתיבה המסייע בכתיבת תוכן ועריכה',
      'עסקים': 'אתה מומחה עסקים המסייע בייעוץ עסקי ואסטרטגיה'
    },
    planLimits: {
      free: 50,
      pro: 500,
      enterprise: 2000
    }
  });
  const [newCategory, setNewCategory] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadSettings();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('bot_admin_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const saveSettings = () => {
    localStorage.setItem('bot_admin_settings', JSON.stringify(settings));
    toast({
      title: "הגדרות נשמרו",
      description: "הגדרות הבוט עודכנו בהצלחה"
    });
  };

  const addCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
        systemPrompts: {
          ...prev.systemPrompts,
          [newCategory.trim()]: `אתה מומחה ${newCategory.trim()} המסייע בתחום זה`
        }
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings(prev => {
      const newSystemPrompts = { ...prev.systemPrompts };
      delete newSystemPrompts[category];
      return {
        ...prev,
        categories: prev.categories.filter(c => c !== category),
        systemPrompts: newSystemPrompts
      };
    });
  };

  const updateSystemPrompt = (category: string, prompt: string) => {
    setSettings(prev => ({
      ...prev,
      systemPrompts: {
        ...prev.systemPrompts,
        [category]: prompt
      }
    }));
  };

  return (
    <div className={`min-h-screen premium-gradient ${isDarkMode ? 'dark text-white' : 'text-gray-900'}`} dir="rtl">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className={isDarkMode ? 'border-gray-700 text-white hover:bg-gray-700' : ''}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לצ'אט
            </Button>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                ניהול הבוט
              </h1>
            </div>
          </div>
          <Button onClick={saveSettings} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 ml-2" />
            שמור הגדרות
          </Button>
        </div>

        <div className="space-y-6">
          {/* Welcome Message */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              הודעת ברכה
            </h2>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              className={`min-h-[100px] text-right ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="הזן את הודעת הברכה..."
            />
          </Card>

          {/* Categories Management */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              ניהול קטגוריות
            </h2>
            
            {/* Add new category */}
            <div className="flex space-x-2 space-x-reverse mb-4">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="קטגוריה חדשה..."
                className={`flex-1 text-right ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
              <Button onClick={addCategory} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Categories list */}
            <div className="space-y-4">
              {settings.categories.map((category) => (
                <div key={category} className={`p-4 rounded-lg border ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {category}
                    </h3>
                    <Button
                      onClick={() => removeCategory(category)}
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={settings.systemPrompts[category] || ''}
                    onChange={(e) => updateSystemPrompt(category, e.target.value)}
                    placeholder="הזן את ההנחיות למומחה בקטגוריה זו..."
                    className={`text-right ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Webhook URL */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              כתובת Webhook
            </h2>
            <Input
              value={settings.webhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className={`text-right ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="https://..."
            />
          </Card>

          {/* Plan Limits */}
          <Card className={`p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              מגבלות תוכניות
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  חינם
                </label>
                <Input
                  type="number"
                  value={settings.planLimits.free}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    planLimits: { ...prev.planLimits, free: parseInt(e.target.value) }
                  }))}
                  className={isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                  }
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Pro
                </label>
                <Input
                  type="number"
                  value={settings.planLimits.pro}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    planLimits: { ...prev.planLimits, pro: parseInt(e.target.value) }
                  }))}
                  className={isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                  }
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Enterprise
                </label>
                <Input
                  type="number"
                  value={settings.planLimits.enterprise}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    planLimits: { ...prev.planLimits, enterprise: parseInt(e.target.value) }
                  }))}
                  className={isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
