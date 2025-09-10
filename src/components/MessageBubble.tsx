
import React, { useState } from 'react';
import { Copy, Code, User, Bot, Eye, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import CodePreview from './CodePreview';
import CodeBlock from './CodeBlock';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date | string;
  category?: string;
}

interface Props {
  message: Message;
  isDarkMode?: boolean;
}

const MessageBubble: React.FC<Props> = ({ message, isDarkMode = true }) => {
  const [showPreview, setShowPreview] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "הועתק!",
      description: "התוכן הועתק ללוח הכתיבה.",
    });
  };

  const downloadImage = (imageUrl: string) => {
    // Open image in new window to allow manual download (bypasses CORS issues)
    window.open(imageUrl, '_blank');
    
    toast({
      title: "תמונה נפתחה!",
      description: "התמונה נפתחה בחלון חדש - לחץ ימין ובחר 'שמירה בשם' כדי להוריד.",
    });
  };

  // Improved Hebrew text detection for better mixed content handling
  const isHebrewText = (text: string): boolean => {
    if (!text) return false;
    
    // Remove numbers, punctuation, and whitespace for better language detection
    const cleanText = text.replace(/[\d\s\.,;:!?\(\)\[\]{}"'/\-\u2013\u2014]/g, '');
    if (cleanText.length === 0) return false;
    
    const hebrewChars = cleanText.match(/[\u0590-\u05FF]/g) || [];
    const englishChars = cleanText.match(/[a-zA-Z]/g) || [];
    const totalLetters = hebrewChars.length + englishChars.length;
    
    // If there are no letters, return false
    if (totalLetters === 0) return false;
    
    // If Hebrew is more than 40% of letters, consider it Hebrew
    return (hebrewChars.length / totalLetters) > 0.4;
  };

  // Function to detect if entire paragraph/content is primarily Hebrew
  const isParagraphHebrew = (text: string): boolean => {
    if (!text) return false;
    
    // Split into sentences and check each
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
    if (sentences.length === 0) return isHebrewText(text);
    
    let hebrewSentences = 0;
    sentences.forEach(sentence => {
      if (isHebrewText(sentence)) hebrewSentences++;
    });
    
    return hebrewSentences > sentences.length / 2;
  };

  // Function to detect if text is code
  const isCodeText = (text: string): boolean => {
    if (!text) return false;
    
    const codePatterns = [
      /function\s*\(/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /import\s+/,
      /export\s+/,
      /class\s+\w+/,
      /interface\s+\w+/,
      /\{\s*\w+:/,
      /<\w+/,
      /\$\s*\w+/,
      /npm\s+/,
      /cd\s+/,
      /git\s+/,
      /console\./,
      /document\./,
      /window\./,
      /\w+\(\)/,
      /=>\s*{/,
      /DOCTYPE/,
      /html/,
      /head/,
      /body/,
      /meta/,
      /script/,
      /style/,
      /^[\$#]\s+/,
      /^\w+@\w+:/,
      /\w+\.\w+\(/
    ];
    
    return codePatterns.some(pattern => pattern.test(text));
  };

  // Function to parse content and separate Hebrew text from code
  const parseContent = (content: string) => {
    const segments = [];
    const lines = content.split('\n');
    let currentSegment = { type: '', content: '', lines: [] as string[] };
    let inCodeBlock = false;
    let codeBlockType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line.trim()) {
        if (currentSegment.lines.length > 0) {
          currentSegment.lines.push(line);
        }
        continue;
      }

      // Detect specific code block starts
      let isCodeStart = false;
      let detectedCodeType = '';
      
      if (!inCodeBlock) {
        // HTML/XML documents - including plain "html" start
        if (/^(<!DOCTYPE|<html|<HTML|html\s*$|html$)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'html';
        }
        // CSS
        else if (/^(\s*[\w\-#.:\[\]]+\s*{|\s*@media|\s*@import|\s*\/\*)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'css';
        }
        // JavaScript/TypeScript functions, variables, imports
        else if (/^(function|const|let|var|class|interface|import|export|if|for|while|switch|try|catch)\b/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'javascript';
        }
        // SQL
        else if (/^(CREATE|SELECT|INSERT|UPDATE|DELETE|ALTER|DROP|WITH|FROM|WHERE)\b/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'sql';
        }
        // Python
        else if (/^(def|class|import|from|if __name__|print\(|return\b)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'python';
        }
        // Shell/Terminal commands
        else if (/^(\$|#|\w+@\w+:|\w+>\s*|npm\s+|cd\s+|git\s+|ls\s+|mkdir\s+)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'shell';
        }
        // JSON
        else if (/^(\s*{|\s*\[|\s*"[\w\-]+"\s*:)/i.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'json';
        }
        // XML or other tags
        else if (/^<[a-zA-Z][^>]*>/.test(line.trim())) {
          isCodeStart = true;
          detectedCodeType = 'xml';
        }
      }

      if (isCodeStart) {
        inCodeBlock = true;
        codeBlockType = detectedCodeType;
      }

      // Determine if we should end the code block based on type
      let shouldEndCodeBlock = false;
      if (inCodeBlock) {
        switch (codeBlockType) {
          case 'html':
            // End HTML when we see closing html or body tag, or clear completion patterns
            if (/<\/(html|body)>/i.test(line) || 
                (line.trim().endsWith('>') && i < lines.length - 1)) {
              const nextLine = lines[i + 1].trim();
              // If next line exists and doesn't look like HTML, end the block
              if (nextLine && !nextLine.startsWith('<') && !nextLine.includes('=') && 
                  !nextLine.includes('html') && !nextLine.includes('head') && 
                  !nextLine.includes('body') && !nextLine.includes('script') && 
                  !nextLine.includes('style')) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'css':
            // End CSS when we see closing brace and next line is not CSS
            if (/}/.test(line) && i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !nextLine.startsWith('@') && 
                  !nextLine.includes('{') && !nextLine.includes(':') &&
                  !/^[\w\-#.:\[\]]+\s*{/.test(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'javascript':
            // End JavaScript when we see closing brace/semicolon and next line is not code
            if ((/}|;$/.test(line) && i < lines.length - 1)) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'python':
            // End Python when we see unindented line that's not code
            if (i < lines.length - 1) {
              const nextLine = lines[i + 1];
              if (nextLine.trim() && !nextLine.startsWith(' ') && !nextLine.startsWith('\t') && 
                  !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'sql':
            // End SQL when we see semicolon and next line is not SQL
            if (/;/.test(line) && i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !/^(CREATE|SELECT|INSERT|UPDATE|DELETE|WITH|FROM|WHERE)/i.test(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'shell':
            // End shell when next line doesn't start with command prompt
            if (i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !/^(\$|#|\w+@\w+:|\w+>\s*|npm\s+|cd\s+|git\s+)/i.test(nextLine) &&
                  !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'json':
            // End JSON when we see closing brace/bracket and next line is not JSON
            if (/^\s*[\}\]]/.test(line) && i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !nextLine.startsWith('{') && !nextLine.startsWith('[') && 
                  !nextLine.includes('"') && !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          case 'xml':
            // End XML when we see closing tag and next line is not XML
            if (/<\/[^>]+>/.test(line) && i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !nextLine.includes('<') && !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
            break;
            
          default:
            // Default: end when next line is clearly not code
            if (i < lines.length - 1) {
              const nextLine = lines[i + 1].trim();
              if (nextLine && !isCodeText(nextLine)) {
                shouldEndCodeBlock = true;
              }
            }
        }
      }

      let segmentType = 'text';
      if (inCodeBlock && !shouldEndCodeBlock) {
        segmentType = 'code';
      } else {
        if (shouldEndCodeBlock) {
          inCodeBlock = false;
          codeBlockType = '';
        }
        
        const lineIsHebrew = isHebrewText(line);
        if (lineIsHebrew) segmentType = 'hebrew';
      }

      // If this is a new segment type, finish the current one and start new
      if (currentSegment.type && currentSegment.type !== segmentType) {
        if (currentSegment.lines.length > 0) {
          segments.push({
            type: currentSegment.type,
            content: currentSegment.lines.join('\n').trim()
          });
        }
        currentSegment = { type: segmentType, content: '', lines: [] };
      } else if (!currentSegment.type) {
        currentSegment.type = segmentType;
      }

      currentSegment.lines.push(line);
    }

    // Don't forget the last segment
    if (currentSegment.lines.length > 0) {
      segments.push({
        type: currentSegment.type,
        content: currentSegment.lines.join('\n').trim()
      });
    }

    return segments;
  };

  const cleanContent = (content: string) => {
    if (!content) return '';
    
    try {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        
        if (typeof parsed === 'string') {
          return cleanTextContent(parsed);
        }
        
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => {
              if (typeof item === 'string') return cleanTextContent(item);
              if (item && typeof item === 'object') {
                return extractContentFromObject(item);
              }
              return String(item);
            })
            .filter(item => item && item.trim())
            .join('\n\n');
        }
        
        if (parsed && typeof parsed === 'object') {
          return extractContentFromObject(parsed);
        }
        
        return cleanTextContent(String(parsed));
      }
      
      return cleanTextContent(content);
      
    } catch {
      return cleanTextContent(content);
    }
  };

  const extractContentFromObject = (obj: any): string => {
    const contentFields = ['message', 'response', 'content', 'text', 'data', 'result', 'output'];
    
    for (const field of contentFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return cleanTextContent(obj[field]);
      }
    }
    
    const values = Object.values(obj)
      .filter(val => typeof val === 'string' && val.trim().length > 10)
      .map(val => cleanTextContent(val as string));
    
    return values.length > 0 ? values.join('\n\n') : cleanTextContent(JSON.stringify(obj, null, 2));
  };

  const cleanTextContent = (text: string): string => {
    return text
      .replace(/^[\[\]"]+|[\[\]"]+$/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\u[\dA-Fa-f]{4}/g, (match) => {
        return String.fromCharCode(parseInt(match.replace('\\u', ''), 16));
      })
      .replace(/^\s*["'`]|["'`]\s*$/g, '')
      .replace(/[#]{3,}/g, '')
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '')
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u00A0]/g, ' ')
      .replace(/[^\w\s\u0590-\u05FF\u200E\u200F.,;:!?()[\]{}"'/%-]/g, '')
      .replace(/\s+$/gm, '')
      .replace(/^\s*[\r\n]+|[\r\n]+\s*$/g, '')
      .replace(/[\r\n]{3,}/g, '\n\n')
      .trim();
  };

  const detectContentType = (content: string) => {
    const hasCodeBlocks = content.includes('```');
    const hasSQLKeywords = /\b(CREATE|SELECT|INSERT|UPDATE|DELETE|TABLE|FROM|WHERE|JOIN|ALTER|DROP)\b/i.test(content);
    const hasHTMLTags = /<[^>]+>/g.test(content);
    const hasJavaScript = /\b(function|const|let|var|class|import|export|if|for|while)\b/.test(content);
    const hasProgrammingKeywords = /\b(def|class|import|from|return|if|elif|else|try|except|for|while|with)\b/.test(content);
    
    return {
      hasCodeBlocks,
      hasSQLKeywords,
      hasHTMLTags,
      hasJavaScript,
      hasProgrammingKeywords,
      hasVisualCode: hasHTMLTags || content.includes('className') || content.includes('style=')
    };
  };

  const formatContent = (content: string) => {
    // First handle code blocks wrapped in ```
    if (content.includes('```')) {
      const parts = content.split(/(```[\s\S]*?```)/g);
      
      return parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3).trim();
          const lines = codeContent.split('\n');
          const language = lines[0] && !lines[0].includes(' ') && lines[0].length < 20 ? lines[0] : '';
          const code = language ? lines.slice(1).join('\n') : codeContent;
          
          return (
            <CodeBlock 
              key={index}
              content={part}
              language={language || 'code'}
              isDarkMode={isDarkMode}
            />
          );
        } else {
          // Parse this text part into segments
          const segments = parseContent(part);
          
          return (
            <div key={index}>
              {segments.map((segment, segIndex) => {
                if (segment.type === 'code') {
                  return (
                    <div key={segIndex} dir="ltr" className="text-left my-2">
                      <CodeBlock 
                        content={`\`\`\`\n${segment.content}\n\`\`\``}
                        language="code"
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  );
                } else if (segment.type === 'hebrew') {
                  return (
                    <div key={segIndex} dir="rtl" className="text-right leading-relaxed text-base mb-4 font-medium">
                      {formatPlainText(segment.content)}
                    </div>
                  );
                } else {
                  // For mixed or English content, detect per paragraph
                  const isContentHebrew = isParagraphHebrew(segment.content);
                  return (
                    <div 
                      key={segIndex} 
                      dir={isContentHebrew ? 'rtl' : 'ltr'} 
                      className={`${isContentHebrew ? 'text-right font-medium' : 'text-left'} leading-relaxed text-base mb-4`}
                    >
                      {formatPlainText(segment.content)}
                    </div>
                  );
                }
              })}
            </div>
          );
        }
      });
    } else {
      // No code blocks, parse the entire content
      const segments = parseContent(content);
      
      return segments.map((segment, index) => {
        if (segment.type === 'code') {
          return (
            <div key={index} dir="ltr" className="text-left my-2">
              <CodeBlock 
                content={`\`\`\`\n${segment.content}\n\`\`\``}
                language="code"
                isDarkMode={isDarkMode}
              />
            </div>
          );
        } else if (segment.type === 'hebrew') {
          return (
            <div key={index} dir="rtl" className="text-right leading-relaxed text-base mb-4 font-medium">
              {formatPlainText(segment.content)}
            </div>
          );
        } else {
          // For mixed or English content, detect per paragraph
          const isContentHebrew = isParagraphHebrew(segment.content);
          return (
            <div 
              key={index} 
              dir={isContentHebrew ? 'rtl' : 'ltr'} 
              className={`${isContentHebrew ? 'text-right font-medium' : 'text-left'} leading-relaxed text-base mb-4`}
            >
              {formatPlainText(segment.content)}
            </div>
          );
        }
      });
    }
  };

  // Function to detect and fix image URLs
  const isImageUrl = (text: string): boolean => {
    if (!text) return false;
    const trimmed = text.trim();
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^/]*)?$/i;
    
    console.log('🔍 Checking if URL is image:', trimmed);
    
    // First try to fix the URL and then check if it's valid
    const fixedUrl = fixImageUrl(trimmed);
    console.log('🔧 Fixed URL:', fixedUrl);
    
    // Check if fixed URL is valid and has image extension
    try {
      const url = new URL(fixedUrl);
      const isImage = imageExtensions.test(url.pathname);
      console.log('✅ URL is valid, is image:', isImage, 'pathname:', url.pathname);
      return isImage;
    } catch (error) {
      console.log('❌ URL constructor failed:', error);
      
      // If URL constructor still fails, check for image extension patterns anywhere in the text
      if (imageExtensions.test(trimmed)) {
        console.log('✅ Found image extension in text');
        return true;
      }
      
      // Check for malformed URLs with image extensions - more specific pattern
      const malformedImagePattern = /https?[:\/]*[^\s]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i;
      if (malformedImagePattern.test(trimmed)) {
        console.log('✅ Found malformed image URL pattern');
        return true;
      }
      
      // Enhanced pattern for URLs like files.domain.com/files/filename.png
      const enhancedPattern = /https?[:\/]*[a-zA-Z0-9.-]+[\/][^\s]*\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i;
      if (enhancedPattern.test(trimmed)) {
        console.log('✅ Found enhanced image URL pattern');
        return true;
      }
      
      console.log('❌ No image pattern found');
      return false;
    }
  };

  // Function to fix malformed URLs
  const fixImageUrl = (url: string): string => {
    let fixed = url.trim();
    
    // Fix missing colon after https
    if (fixed.startsWith('https:') && !fixed.startsWith('https://')) {
      fixed = fixed.replace('https:', 'https://');
    }
    
    // Fix missing colon after http  
    if (fixed.startsWith('http:') && !fixed.startsWith('http://')) {
      fixed = fixed.replace('http:', 'http://');
    }
    
    // Fix domain without proper slash - handle cases like "domain.comfiles" 
    // Look for pattern: protocol + domain + path (without slash between them)
    const domainPattern = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/?.*)$/;
    const match = fixed.match(domainPattern);
    if (match) {
      const protocol = match[1];
      const domain = match[2];
      let path = match[3];
      
      // If path doesn't start with slash but has content, add it
      if (path && !path.startsWith('/')) {
        fixed = protocol + domain + '/' + path;
      }
    }
    
    return fixed;
  };

  const formatPlainText = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Check if line is an image URL (entire line or just contains URL)
      if (isImageUrl(trimmedLine)) {
        const fixedUrl = fixImageUrl(trimmedLine);
        console.log('📸 Rendering image:', fixedUrl);
        return (
          <div key={lineIndex} className="mb-4 relative group">
            <img 
              src={fixedUrl} 
              alt="תמונה מהבוט"
              className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              style={{ maxHeight: '400px' }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', fixedUrl);
              }}
              onError={(e) => {
                console.log('❌ Image failed to load:', fixedUrl);
                // If image fails to load, show the URL as a clickable link instead
                const target = e.target as HTMLImageElement;
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p class="text-sm text-red-600 dark:text-red-400 mb-2">לא ניתן לטעון את התמונה (שגיאת SSL/CORS)</p>
                      <a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline break-all">
                        ${trimmedLine}
                      </a>
                    </div>
                  `;
                }
              }}
            />
            <button
              onClick={() => downloadImage(fixedUrl)}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                isDarkMode 
                  ? 'bg-black/70 text-white hover:bg-black/90' 
                  : 'bg-white/80 text-gray-700 hover:bg-white/90'
              } shadow-lg`}
              title="הורד תמונה"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        );
      }
      
      // Check if line contains an image URL within text - enhanced pattern
      const imageUrlPattern = /(https?[:\/]*[^\s]+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?[^\s]*)?)/gi;
      const matches = trimmedLine.match(imageUrlPattern);
      
      console.log('🔍 Checking for image URLs in line:', trimmedLine);
      console.log('📝 Matches found:', matches);
      
      if (matches && matches.length > 0) {
        // Replace each image URL with an img tag
        return (
          <div key={lineIndex} className="mb-4">
            {matches.map((url, urlIndex) => {
              const fixedUrl = fixImageUrl(url);
              return (
                <div key={urlIndex} className="mb-2 relative group">
                  <img 
                    src={fixedUrl} 
                    alt="תמונה מהבוט"
                    className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                    style={{ maxHeight: '400px' }}
                    onLoad={() => {
                      console.log('✅ Inline image loaded successfully:', fixedUrl);
                    }}
                    onError={(e) => {
                      console.log('❌ Inline image failed to load:', fixedUrl);
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <p class="text-sm text-red-600 dark:text-red-400 mb-1">שגיאה בטעינת תמונה</p>
                            <a href="${fixedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline text-sm break-all">
                              ${url}
                            </a>
                          </div>
                        `;
                      }
                    }}
                  />
                  <button
                    onClick={() => downloadImage(fixedUrl)}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                      isDarkMode 
                        ? 'bg-black/70 text-white hover:bg-black/90' 
                        : 'bg-white/80 text-gray-700 hover:bg-white/90'
                    } shadow-lg`}
                    title="הורד תמונה"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        );
      }
      
      // Check if line starts with number followed by dot
      const numberedListMatch = line.match(/^(\d+\.)\s*(.*)$/);
      
      if (numberedListMatch) {
        const isHebrewLine = isHebrewText(numberedListMatch[2]);
        
        return (
          <div key={lineIndex} className={`mb-4 ${isHebrewLine ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-start gap-4 ${isHebrewLine ? '' : 'flex-row'}`}>
              {isHebrewLine ? (
                // Hebrew: Number on the right, text on the left
                <>
                  <div className="flex-1 text-right leading-7 text-base pr-2">
                    {numberedListMatch[2]}
                  </div>
                  <div className={`font-semibold text-lg leading-7 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  } flex-shrink-0 text-right min-w-[2.5rem]`}>
                    {numberedListMatch[1]}
                  </div>
                </>
              ) : (
                // English: Number on the left, text on the right
                <>
                  <div className={`font-semibold text-lg leading-7 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  } flex-shrink-0 text-left min-w-[2.5rem]`}>
                    {numberedListMatch[1]}
                  </div>
                  <div className="flex-1 text-left leading-7 text-base pl-2">
                    {numberedListMatch[2]}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
      
      // Check for bullet points (-, *, •)
      const bulletListMatch = line.match(/^([•\-\*])\s*(.*)$/);
      
      if (bulletListMatch) {
        const isHebrewLine = isHebrewText(bulletListMatch[2]);
        
        return (
          <div key={lineIndex} className={`mb-4 ${isHebrewLine ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-start gap-3 ${isHebrewLine ? '' : 'flex-row'}`}>
              {isHebrewLine ? (
                // Hebrew: Bullet on the right, text on the left
                <>
                  <div className="flex-1 text-right leading-7 text-base pr-2">
                    {bulletListMatch[2]}
                  </div>
                  <div className={`font-bold text-lg leading-7 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  } flex-shrink-0 text-right min-w-[1.5rem]`}>
                    •
                  </div>
                </>
              ) : (
                // English: Bullet on the left, text on the right
                <>
                  <div className={`font-bold text-lg leading-7 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  } flex-shrink-0 text-left min-w-[1.5rem]`}>
                    •
                  </div>
                  <div className="flex-1 text-left leading-7 text-base pl-2">
                    {bulletListMatch[2]}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
      
      // Regular line
      if (!line.trim()) return <br key={lineIndex} />;
      
      // Detect line direction and apply proper styling
      const isHebrewLine = isHebrewText(line);
      
      return (
        <div 
          key={lineIndex} 
          className={`mb-4 leading-7 text-base ${
            isHebrewLine ? 'text-right' : 'text-left'
          }`}
          dir={isHebrewLine ? 'rtl' : 'ltr'}
        >
          {line}
        </div>
      );
    });
  };

  const getFormattedTime = () => {
    const date = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const processedContent = cleanContent(message.content);
  const contentTypes = detectContentType(processedContent);

  return (
    <div className="w-full mb-6">
      {/* Message Header - Only Icon and Time */}
      <div className="flex items-center mb-2 justify-start">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`p-1.5 rounded-full ${
            message.isUser 
              ? 'bg-green-500' 
              : isDarkMode 
                ? 'bg-blue-500' 
                : 'bg-blue-600'
          }`}>
            {message.isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>
          <span className={`text-xs ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {getFormattedTime()}
          </span>
        </div>
      </div>

      {/* Message Content */}
      <div className={`text-base leading-relaxed ${
        isDarkMode ? 'text-gray-100' : 'text-gray-800'
      } mb-3`}>
        {formatContent(processedContent)}
      </div>

      {/* Action Buttons for Bot Messages */}
      {!message.isUser && (
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => copyToClipboard(processedContent)}
            className={`p-2 rounded-md transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="העתק תשובה"
          >
            <Copy className="w-4 h-4" />
          </button>

          {(contentTypes.hasCodeBlocks || contentTypes.hasSQLKeywords || contentTypes.hasProgrammingKeywords) && (
            <button
              onClick={() => {
                const codeBlocks = processedContent.match(/```[\s\S]*?```/g) || [];
                const allCode = codeBlocks.map(block => {
                  const content = block.slice(3, -3).trim();
                  const lines = content.split('\n');
                  const isLanguageLine = lines[0] && !lines[0].includes(' ') && lines[0].length < 20;
                  return isLanguageLine ? lines.slice(1).join('\n') : content;
                }).join('\n\n');
                copyToClipboard(allCode || processedContent);
              }}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="העתק קוד"
            >
              <Code className="w-4 h-4" />
            </button>
          )}

          {contentTypes.hasHTMLTags && (
            <button
              onClick={() => setShowPreview(true)}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="תצוגה מקדימה"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Code Preview Modal */}
      {showPreview && (
        <CodePreview 
          code={processedContent} 
          onClose={() => setShowPreview(false)} 
        />
      )}

    </div>
  );
};

export default MessageBubble;
