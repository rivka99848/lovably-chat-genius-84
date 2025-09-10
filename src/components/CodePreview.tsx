
import React, { useState, useEffect } from 'react';
import { X, Code, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  code: string;
  onClose: () => void;
}

const CodePreview: React.FC<Props> = ({ code, onClose }) => {
  const [previewContent, setPreviewContent] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    // Extract and process code for preview
    const codeBlocks = code.match(/```[\s\S]*?```/g) || [];
    let combinedCode = '';

    codeBlocks.forEach((block: string) => {
      const codeContent = block.slice(3, -3).trim();
      const lines = codeContent.split('\n');
      const language = lines[0]?.includes(' ') ? '' : lines[0] || '';
      const actualCode = language ? lines.slice(1).join('\n') : codeContent;
      
        if (language === 'html' || actualCode.includes('<html') || actualCode.includes('<!DOCTYPE')) {
          combinedCode = actualCode;
        } else if (actualCode.includes('<') && (actualCode.includes('div') || actualCode.includes('span'))) {
          // Wrap HTML fragments
          combinedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
        * { box-sizing: border-box; }
    </style>
</head>
<body>
${actualCode}
</body>
</html>`;
        } else if (actualCode.includes('function') || actualCode.includes('const') || actualCode.includes('class')) {
          // JavaScript/React code - create a simple demo
          combinedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JavaScript Preview</title>
    <style>
        body { font-family: 'Courier New', monospace; padding: 20px; background: #f5f5f5; }
        .code-block { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="code-block">
        <h3>Code Output:</h3>
        <pre id="output"></pre>
    </div>
    <script>
        try {
            ${actualCode}
            console.log('Code executed successfully');
        } catch (error) {
            document.getElementById('output').textContent = 'Error: ' + error.message;
        }
    </script>
</body>
</html>`;
        }
    });

    setPreviewContent(combinedCode);
  }, [code]);

  const downloadCode = () => {
    const blob = new Blob([previewContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-preview.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-6xl h-5/6 bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Code Preview</h2>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" onClick={downloadCode}>
              <Download className="w-4 h-4 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col overflow-hidden">
            <TabsList className="mb-4">
              <TabsTrigger value="preview" className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center">
                <Code className="w-4 h-4 mr-1" />
                Source Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 h-full">
              <div className="h-full border rounded-lg overflow-hidden bg-white">
                {previewContent ? (
                  <iframe
                    srcDoc={previewContent}
                    className="w-full h-full border-0 min-h-[600px]"
                    sandbox="allow-scripts allow-same-origin"
                    title="Code Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 min-h-[400px]">
                    <div className="text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No previewable code found</p>
                      <p className="text-sm">Try the Source Code tab to view the raw content</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex-1 overflow-hidden">
              <div className="h-full border rounded-lg overflow-hidden">
                <div className="h-full bg-gray-900 text-gray-100 overflow-auto">
                  <div className="p-4">
                    <pre className="text-sm whitespace-pre-wrap break-words">
                      <code className="block">{previewContent || code}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default CodePreview;
