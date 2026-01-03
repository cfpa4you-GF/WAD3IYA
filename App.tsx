
import React, { useState, useRef, useEffect } from 'react';
import { GRADES, SUBJECTS } from './constants';
import { generateIntegrationTasks, generateEducationalImage, getLessonSuggestions } from './services/geminiService';
import { GenerationResponse, IntegrationTask, MindMap, AssessmentCriterion } from './types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import saveAs from 'file-saver';

const VISUAL_SUBJECTS = [
  'الرياضيات', 
  'العلوم الفيزيائية', 
  'علوم الطبيعة والحياة', 
  'التكنولوجيا', 
  'الهندسة الميكانيكية', 
  'الهندسة الكهربائية', 
  'الهندسة المدنية', 
  'هندسة الطرائق',
  'الإعلام الآلي'
];

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600 dark:text-pink-400">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const ProcessingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fadeIn">
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4 text-center space-y-6">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 border-4 border-blue-100 dark:border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">جاري المعالجة</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{message}</p>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-full w-1/2 animate-[progress_2s_ease-in-out_infinite] rounded-full"></div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [lesson, setLesson] = useState('');
  const [objective, setObjective] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [results, setResults] = useState<GenerationResponse | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async () => {
    if (!grade || !subject) return;
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    try {
      const list = await getLessonSuggestions(grade, subject);
      setSuggestions(list);
    } catch (e) { console.error(e); } finally { setLoadingSuggestions(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade || !subject || !lesson) return;

    setLoading(true);
    setIsEditing(false);
    try {
      const data = await generateIntegrationTasks(grade, subject, lesson, objective);
      if (VISUAL_SUBJECTS.includes(subject)) {
        try {
          const [img1, img2] = await Promise.all([
            generateEducationalImage(grade, subject, lesson, data.version1.context),
            generateEducationalImage(grade, subject, lesson, data.version2.context)
          ]);
          data.version1.imageUrl = img1;
          data.version2.imageUrl = img2;
        } catch (imgError) { console.error("Failed to fetch images", imgError); }
      }
      setResults(data);
    } catch (error) { alert('حدث خطأ أثناء التوليد.'); } finally { setLoading(false); }
  };

  const handleReset = () => {
    if (window.confirm('هل تريد فعلاً مسح النتائج والبدء من جديد؟')) {
      setResults(null);
      setGrade('');
      setSubject('');
      setLesson('');
      setObjective('');
      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExportPDF = async () => {
    if (!pdfTemplateRef.current) return;
    setExporting(true);
    setExportStatus('جارٍ تحضير ملف PDF رسمي شامل...');
    
    try {
      const element = pdfTemplateRef.current;
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`DzEd-${lesson}-${subject}.pdf`);
    } catch (error) {
      console.error(error);
      alert('فشل تصدير PDF.');
    } finally {
      setExporting(false);
      setExportStatus('');
    }
  };

  const handleExportWord = async () => {
    if (!results) return;
    setExportingWord(true);
    setExportStatus('جارٍ إنشاء مستند Word شامل...');
    try {
      const docChildren: any[] = [];
      
      docChildren.push(
        new Paragraph({ 
          children: [new TextRun({ text: `المادة: ${subject} | المستوى: ${grade}`, bold: true, size: 24 })],
          alignment: AlignmentType.RIGHT, 
          bidirectional: true 
        }),
        new Paragraph({ 
          children: [new TextRun({ text: `عنوان الدرس: ${lesson}`, bold: true, size: 28, underline: {} })],
          alignment: AlignmentType.CENTER, 
          bidirectional: true 
        }),
        new Paragraph({ text: "" })
      );

      const addVersionToDoc = async (task: IntegrationTask, title: string) => {
        docChildren.push(
          new Paragraph({ text: "" }),
          new Paragraph({ 
            children: [new TextRun({ text: title, bold: true, size: 32, color: "2563eb", underline: {} })], 
            alignment: AlignmentType.RIGHT, 
            bidirectional: true 
          })
        );
        
        if (task.imageUrl) {
          try {
            const base64Data = task.imageUrl.split(",")[1];
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
            docChildren.push(new Paragraph({ 
              children: [new ImageRun({ data: bytes, transformation: { width: 450, height: 250 } })], 
              alignment: AlignmentType.CENTER 
            }));
          } catch (e) {}
        }

        docChildren.push(
          new Paragraph({ children: [new TextRun({ text: "السياق:", bold: true, color: "1e40af" })], alignment: AlignmentType.RIGHT, bidirectional: true }),
          new Paragraph({ text: task.context, alignment: AlignmentType.RIGHT, bidirectional: true }),
          new Paragraph({ children: [new TextRun({ text: "السند:", bold: true, color: "1e40af" })], alignment: AlignmentType.RIGHT, bidirectional: true }),
          new Paragraph({ text: task.support, alignment: AlignmentType.RIGHT, bidirectional: true }),
          new Paragraph({ children: [new TextRun({ text: "التعليمات:", bold: true, color: "1e40af" })], alignment: AlignmentType.RIGHT, bidirectional: true })
        );

        task.instructions.forEach((inst, idx) => {
          docChildren.push(new Paragraph({ text: `${idx + 1}- ${inst}`, alignment: AlignmentType.RIGHT, bidirectional: true }));
        });
        docChildren.push(new Paragraph({ text: "---", alignment: AlignmentType.CENTER }));
      };

      await addVersionToDoc(results.version1, "الوضعية الإدماجية (النموذج 1)");
      await addVersionToDoc(results.version2, "الوضعية الإدماجية (النموذج 2)");

      docChildren.push(
        new Paragraph({ text: "" }),
        new Paragraph({ 
          children: [new TextRun({ text: "خلاصة الدرس: الخريطة الذهنية للمفاهيم", bold: true, size: 36, color: "4f46e5" })], 
          alignment: AlignmentType.CENTER, 
          bidirectional: true 
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ 
          children: [new TextRun({ text: results.mindMap.centralTopic, bold: true, size: 32, color: "ffffff", shading: { fill: "4f46e5" } })], 
          alignment: AlignmentType.CENTER, 
          bidirectional: true 
        }),
        new Paragraph({ text: "" })
      );

      results.mindMap.branches.forEach((branch) => {
        docChildren.push(
          new Paragraph({ 
            children: [new TextRun({ text: `📍 ${branch.title}:`, bold: true, size: 28, color: "4f46e5" })], 
            alignment: AlignmentType.RIGHT, 
            bidirectional: true 
          })
        );
        branch.details.forEach(detail => {
          docChildren.push(new Paragraph({ text: `• ${detail}`, alignment: AlignmentType.RIGHT, bidirectional: true }));
        });
        docChildren.push(new Paragraph({ text: "" }));
      });

      const doc = new Document({ 
        sections: [{ 
          properties: { page: { textDirection: "rtl" as any } }, 
          children: docChildren 
        }] 
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `DzEd-${lesson}-${subject}.docx`);
    } catch (error) { 
      console.error(error);
      alert("حدث خطأ أثناء تصدير Word."); 
    } finally { setExportingWord(false); setExportStatus(''); }
  };

  const updateResult = (path: string, value: any) => {
    if (!results) return;
    const newResults = { ...results };
    const keys = path.split('.');
    let current: any = newResults;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setResults(newResults);
  };

  const MindMapCard = ({ mindMap }: { mindMap: MindMap }) => (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-8 mt-12 overflow-hidden transition-colors">
      <div className="text-center mb-10">
        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-1 rounded-full text-sm font-bold uppercase mb-2 inline-block tracking-widest">خلاصة الدرس</span>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">الخريطة الذهنية للمفاهيم</h2>
      </div>
      <div className="flex flex-col items-center">
        {isEditing ? (
          <input 
            value={mindMap.centralTopic}
            onChange={(e) => updateResult('mindMap.centralTopic', e.target.value)}
            className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl z-20 mb-12 text-center min-w-[200px] border-4 border-indigo-200 dark:border-indigo-800 transition-colors text-xl font-bold w-full max-w-md outline-none focus:ring-4 focus:ring-indigo-400"
          />
        ) : (
          <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl z-20 mb-12 text-center min-w-[200px] border-4 border-indigo-200 dark:border-indigo-800 transition-colors">
            <h3 className="text-xl font-bold">{mindMap.centralTopic}</h3>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {mindMap.branches.map((branch, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all">
              {isEditing ? (
                <input 
                  value={branch.title}
                  onChange={(e) => {
                    const newBranches = [...mindMap.branches];
                    newBranches[idx].title = e.target.value;
                    updateResult('mindMap.branches', newBranches);
                  }}
                  className="font-bold text-indigo-800 dark:text-indigo-300 mb-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 bg-transparent w-full outline-none focus:border-indigo-500"
                />
              ) : (
                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-2">{branch.title}</h4>
              )}
              
              <ul className="space-y-2">
                {branch.details.map((detail, dIdx) => (
                  <li key={dIdx} className="text-slate-600 dark:text-slate-400 text-sm flex items-start gap-2">
                    <span className="text-indigo-400 mt-1">•</span>
                    {isEditing ? (
                      <textarea 
                        value={detail}
                        onChange={(e) => {
                          const newBranches = [...mindMap.branches];
                          newBranches[idx].details[dIdx] = e.target.value;
                          updateResult('mindMap.branches', newBranches);
                        }}
                        className="bg-transparent w-full outline-none focus:ring-1 focus:ring-indigo-200 rounded p-1 resize-none overflow-hidden"
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    ) : (
                      <span>{detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TaskCard = ({ task, title, subjectName, versionKey }: { task: IntegrationTask; title: string; subjectName: string; versionKey: string }) => {
    const isVisualSubject = VISUAL_SUBJECTS.includes(subjectName);
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full transition-all hover:shadow-xl">
        <div className="bg-blue-600 dark:bg-blue-700 p-4 text-white font-bold text-center text-lg">{title}</div>
        <div className="p-6 flex-1 space-y-6">
          {task.imageUrl ? (
            <img src={task.imageUrl} alt="Diagram" className="w-full rounded-lg shadow-sm max-h-64 object-cover" crossOrigin="anonymous" />
          ) : isVisualSubject ? (
            <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-slate-400 text-sm">يُفضل إدراج رسم توضيحي هنا</p>
            </div>
          ) : null}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm uppercase tracking-wide mb-1">السياق:</h4>
              {isEditing ? (
                <textarea 
                  value={task.context}
                  onChange={(e) => updateResult(`${versionKey}.context`, e.target.value)}
                  className="w-full p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              ) : (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border-r-4 border-blue-500">{task.context}</p>
              )}
            </div>
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm uppercase tracking-wide mb-1">السند:</h4>
              {isEditing ? (
                <textarea 
                  value={task.support}
                  onChange={(e) => updateResult(`${versionKey}.support`, e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm outline-none focus:ring-2 focus:ring-blue-500 italic"
                />
              ) : (
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 italic text-slate-600 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-800/50">{task.support}</div>
              )}
            </div>
            <div>
              <h4 className="font-bold text-blue-800 dark:text-blue-400 text-sm uppercase tracking-wide mb-1">التعليمات:</h4>
              <ol className="space-y-2 text-slate-700 dark:text-slate-300 list-none pr-0">
                {task.instructions.map((inst, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{idx + 1}</span>
                    {isEditing ? (
                      <textarea 
                        value={inst}
                        onChange={(e) => {
                          const newInstructions = [...task.instructions];
                          newInstructions[idx] = e.target.value;
                          updateResult(`${versionKey}.instructions`, newInstructions);
                        }}
                        className="w-full p-2 text-sm md:text-base border border-slate-100 dark:border-slate-800 rounded bg-transparent outline-none focus:ring-1 focus:ring-blue-400 overflow-hidden resize-none"
                        rows={1}
                      />
                    ) : (
                      <span className="text-sm md:text-base">{inst}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExportPDFTemplate = ({ results }: { results: GenerationResponse }) => {
    const renderTask = (task: IntegrationTask, title: string) => (
      <div className="mb-10 text-right" dir="rtl">
        <h3 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-4">{title}</h3>
        {task.imageUrl && (
          <div className="flex justify-center mb-6">
            <img src={task.imageUrl} alt="Diagram" className="max-w-[80%] h-auto border border-slate-200 rounded" />
          </div>
        )}
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-1">السياق:</p>
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{task.context}</p>
        </div>
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-1">السند:</p>
          <p className="text-slate-700 italic border-r-2 border-slate-300 pr-3 whitespace-pre-wrap">{task.support}</p>
        </div>
        <div className="mb-4">
          <p className="font-bold text-slate-900 mb-2">التعليمات:</p>
          <ul className="list-decimal list-inside pr-4 space-y-1">
            {task.instructions.map((inst, i) => (
              <li key={i} className="text-slate-800">{inst}</li>
            ))}
          </ul>
        </div>
      </div>
    );

    return (
      <div ref={pdfTemplateRef} className="bg-white p-[20mm] text-black hidden" style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Tajawal', sans-serif" }}>
        <div className="border-b-4 border-slate-900 pb-4 mb-8 text-right">
          <div className="flex justify-between items-start">
             <div className="text-sm font-bold">وزارة التربية الوطنية</div>
             <div className="text-right">
                <p className="font-bold text-lg">المادة: {subject}</p>
                <p className="font-bold">المستوى: {grade}</p>
             </div>
          </div>
          <div className="text-center mt-6">
            <h1 className="text-3xl font-extrabold underline">درس: {lesson}</h1>
          </div>
        </div>

        {renderTask(results.version1, "الوضعية الإدماجية - النسخة الأولى")}
        <div className="border-t border-dashed border-slate-300 my-8"></div>
        {renderTask(results.version2, "الوضعية الإدماجية - النسخة الثانية")}

        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">الخريطة الذهنية للمفاهيم</h2>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
             <h3 className="text-xl font-bold text-center mb-6 bg-indigo-600 text-white py-2 rounded">{results.mindMap.centralTopic}</h3>
             <div className="grid grid-cols-2 gap-4">
                {results.mindMap.branches.map((b, i) => (
                  <div key={i} className="border border-indigo-100 p-3 rounded bg-white">
                    <p className="font-bold text-indigo-700 mb-2 border-b border-indigo-50">📍 {b.title}</p>
                    <ul className="text-xs space-y-1">
                      {b.details.map((d, di) => <li key={di} className="text-slate-700 flex gap-1"><span>•</span> <span>{d}</span></li>)}
                    </ul>
                  </div>
                ))}
             </div>
          </div>
        </div>
        
        <div className="mt-10 text-center text-[10px] text-slate-400 border-t pt-4">
          تم التوليد بواسطة تطبيق DzEd للأساتذة الجزائريين
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
      {(exporting || exportingWord) && <ProcessingOverlay message={exportStatus} />}

      <div className="no-print bg-white dark:bg-slate-900 py-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <a href="https://instagram.com/prof.i3lam_ali" target="_blank" className="flex items-center gap-3 text-slate-800 dark:text-slate-100 hover:opacity-80 transition-opacity">
            <InstagramIcon />
            <span className="font-bold text-lg md:text-xl font-sans tracking-tight">prof.i3lam_ali</span>
          </a>
        </div>
      </div>

      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-900 dark:to-indigo-950 text-white py-12 px-4 shadow-md mb-8 no-print relative">
        <div className="absolute top-4 left-4 flex gap-4">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm border border-white/20">
             {isDarkMode ? '☀️' : '🌙'}
           </button>
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">مولد الوضعيات الإدماجية (APC)</h1>
          <p className="text-blue-100 text-lg md:text-xl font-light">وفق المقاربة بالكفاءات والمنهاج التربوي الجزائري</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 md:p-10 mb-12 -mt-16 relative z-10 border border-slate-100 dark:border-slate-800 no-print transition-colors">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm">المستوى الدراسي</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} required className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="">اختر المستوى...</option>
                {GRADES.map(g => <option key={g.id} value={g.label}>{g.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm">المادة</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="">اختر المادة...</option>
                {SUBJECTS.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 relative" ref={suggestionRef}>
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm">عنوان الدرس</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={lesson} 
                  onChange={(e) => setLesson(e.target.value)} 
                  onFocus={fetchSuggestions}
                  placeholder="مثال: الاستجابة المناعية" 
                  required 
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
                {loadingSuggestions && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {showSuggestions && !loadingSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[70] w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-fadeIn">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 uppercase font-bold tracking-wider">اقتراحات المنهاج</div>
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setLesson(sug);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-right px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-sm">الهدف (اختياري)</label>
              <input type="text" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="مثال: تحليل المنحنيات" className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>

            <div className="md:col-span-2 lg:col-span-4 mt-4">
              <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-l from-blue-600 to-indigo-600 hover:scale-[1.01]'}`}>
                {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> جاري التوليد التربوي...</> : "✨ توليد وضعيات إدماجية دقيقة"}
              </button>
            </div>
          </form>
        </section>

        <div ref={resultsRef} className="p-2">
          {results && (
            <>
              <div className="animate-fadeIn">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4 no-print shadow-sm">
                   <div className="flex items-center gap-4">
                      <span className="text-3xl">🎓</span>
                      <div>
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-lg">{lesson}</h3>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">{grade} - {subject}</p>
                      </div>
                   </div>
                   <div className="flex gap-2 flex-wrap justify-center">
                      <button 
                        onClick={() => setIsEditing(!isEditing)} 
                        className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md ${isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                      >
                        {isEditing ? '✅ حفظ التعديلات' : '📝 مراجعة وتعديل'}
                      </button>
                      <button onClick={handleExportWord} disabled={exportingWord || exporting} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-50">📝 تصدير Word</button>
                      <button onClick={handleExportPDF} disabled={exporting || exportingWord} className="bg-white dark:bg-slate-800 border-2 border-indigo-200 text-indigo-700 dark:text-indigo-300 px-6 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2">📄 تصدير PDF</button>
                      <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">🖨️ طباعة</button>
                      <button onClick={handleReset} className="bg-red-100 dark:bg-red-900/20 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-200 transition-all flex items-center gap-2">🔄 حذف</button>
                   </div>
                </div>

                {isEditing && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl mb-8 animate-pulse no-print">
                    <p className="text-amber-800 dark:text-amber-200 text-center font-bold">⚠️ وضع التعديل نشط: يمكنك الآن تغيير أي نص مباشرة في البطاقات أدناه.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <TaskCard title="الوضعية الإدماجية - النسخة الأولى" task={results.version1} subjectName={subject} versionKey="version1" />
                  <TaskCard title="الوضعية الإدماجية - النسخة الثانية" task={results.version2} subjectName={subject} versionKey="version2" />
                </div>
                <MindMapCard mindMap={results.mindMap} />
              </div>

              <ExportPDFTemplate results={results} />
            </>
          )}
        </div>

        {!results && !loading && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-slate-500 dark:text-slate-400">تطبيق DzEd للوضعيات الإدماجية</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2">توليد تلقائي وفق معايير المنهاج الجزائري الرسمي</p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 py-3 px-4 text-center text-slate-500 text-xs no-print">
        جميع الحقوق محفوظة - تطوير الأستاذ لخدمة المنظومة التربوية الجزائرية 🇩🇿
      </footer>
    </div>
  );
};

export default App;
