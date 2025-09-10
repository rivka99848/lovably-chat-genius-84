import React from 'react';
import { Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CodeBlockProps {
  content: string;
  language?: string;
  isDarkMode?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, language = 'code', isDarkMode = true }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "הועתק!",
      description: "הקוד הועתק ללוח הכתיבה.",
    });
  };

  // Clean and format the code content
  const cleanCode = (text: string): string => {
    return text
      .replace(/^```[a-zA-Z]*\n?/, '') // Remove opening code block markers
      .replace(/\n?```$/, '') // Remove closing code block markers
      .trim();
  };

  const processedCode = cleanCode(content);

  return (
    <div className="my-4 relative group" dir="ltr">
      <div className={`rounded-lg border ${
        isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDarkMode 
            ? 'border-gray-700 text-gray-300' 
            : 'border-gray-200 text-gray-600'
        }`}>
          <span className="text-sm font-medium">
            {language}
          </span>
          <button
            onClick={() => copyToClipboard(processedCode)}
            className={`p-2 rounded text-sm transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
            }`}
            title="העתק קוד"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        
        {/* Code */}
        <div className="p-4 overflow-x-auto max-w-full">
          <pre className={`text-sm font-mono whitespace-pre-wrap break-words text-left ${
            isDarkMode ? 'text-gray-100' : 'text-gray-800'
          }`} dir="ltr">
            <code className="block">{processedCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;