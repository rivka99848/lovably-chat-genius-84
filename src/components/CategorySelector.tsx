
import React from 'react';
import { Code, Palette, PenTool, Home, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  onSelect: (category: string) => void;
  onClose: () => void;
}

const categories = [
  {
    id: 'programming',
    name: 'תכנות',
    description: 'פיתוח קוד, דיבאג ובניית אפליקציות עם סיוע AI',
    icon: Code,
    color: 'from-blue-600 to-purple-600',
    examples: ['פיתוח React', 'סקריפטים Python', 'שאילתות מסד נתונים', 'אינטגרציית API']
  },
  {
    id: 'architecture',
    name: 'אדריכלות ועיצוב פנים',
    description: 'עיצוב חללים, תכנון פריסות ויצירת פתרונות אדריכליים',
    icon: Home,
    color: 'from-green-600 to-teal-600',
    examples: ['תכניות קומה', 'עיצוב פנים', 'מידול תלת מימד', 'בחירת חומרים']
  },
  {
    id: 'writing',
    name: 'כתיבה ותמלול',
    description: 'יצירת תוכן, עריכת טקסט ותמלול אודיו בדיוק',
    icon: PenTool,
    color: 'from-orange-600 to-red-600',
    examples: ['כתיבת בלוגים', 'תיעוד טכני', 'כתיבה יצירתית', 'תמלול אודיו']
  },
  {
    id: 'design',
    name: 'גרפיקה ועיצוב',
    description: 'יצירת תוכן ויזואלי, לוגואים ואמנות דיגיטלית',
    icon: Palette,
    color: 'from-pink-600 to-purple-600',
    examples: ['עיצוב לוגו', 'עיצוב UI/UX', 'זהות מותג', 'איורים דיגיטליים']
  },
  {
    id: 'copywriting',
    name: 'ניסוח ושכתוב',
    description: 'שכתוב טקסטים, שיפור ניסוח ויצירת תוכן מרתק',
    icon: FileText,
    color: 'from-indigo-600 to-blue-600',
    examples: ['שכתוב מאמרים', 'ניסוח מכתבים', 'תוכן שיווקי', 'עריכה לשונית']
  }
];

const CategorySelector: React.FC<Props> = ({ onSelect, onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-4xl w-full">
        <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                בחרו את המומחה שלכם
              </h1>
              <p className="text-gray-600">
                בחרו את הקטגוריה המקצועית המתאימה ביותר לצרכים שלכם. תוכלו לשנות זאת בכל עת בהגדרות.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card
                  key={category.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200 group"
                  onClick={() => onSelect(category.name)}
                >
                  <div className="flex items-start space-x-4 space-x-reverse">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {category.description}
                      </p>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">מושלם עבור:</p>
                        <div className="flex flex-wrap gap-2">
                          {category.examples.map((example, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      className={`w-full bg-gradient-to-r ${category.color} hover:opacity-90 text-white`}
                    >
                      בחר {category.name}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              לא בטוחים מה לבחור? התחילו עם תכנות - זה המומחה הכי רב-תכליתי שלנו!
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CategorySelector;
