import React from 'react';

interface RunningBotBadgeProps {
  isDarkMode?: boolean;
}

const RunningBotBadge: React.FC<RunningBotBadgeProps> = ({ isDarkMode = false }) => {
  return (
    <div 
      className="running-bot-badge"
      role="status"
      aria-live="polite"
    >
      הבוט בהרצה
    </div>
  );
};

export default RunningBotBadge;