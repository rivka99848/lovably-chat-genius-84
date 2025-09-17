import React from 'react';
import { Bot, Brain } from 'lucide-react';

interface BotStatusIndicatorProps {
  isThinking?: boolean;
  isDarkMode?: boolean;
}

const BotStatusIndicator: React.FC<BotStatusIndicatorProps> = ({ 
  isThinking = false, 
  isDarkMode = false 
}) => {
  return (
    <div className="flex items-center space-x-2 space-x-reverse mb-4 px-4">
      <div className="flex items-center space-x-2 space-x-reverse">
        <div className={`relative ${isThinking ? 'animate-pulse' : ''}`}>
          {isThinking ? (
            <Brain className="w-5 h-5 text-primary animate-pulse" />
          ) : (
            <Bot className="w-5 h-5 text-primary" />
          )}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 ${
            isDarkMode ? 'border-background' : 'border-white'
          } ${isThinking ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
        </div>
        <span className={`text-sm font-medium transition-all duration-300 ${
          isDarkMode ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {isThinking ? '💭 הבוט חושב...' : '🤖 הבוט מוכן לעזור'}
        </span>
      </div>
    </div>
  );
};

export default BotStatusIndicator;