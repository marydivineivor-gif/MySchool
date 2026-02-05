import React, { useState, useMemo } from 'react';
import { Student, ClassInfo } from '../types';

interface ClassButtonProps {
  label: string;
  color: 'green' | 'blue' | 'orange' | 'yellow';
  onClick: () => void;
}

const getClassColor = (name: string): 'green' | 'blue' | 'orange' | 'yellow' => {
  const n = name.toUpperCase();
  if (n.includes('A') || n.includes('GREEN')) return 'green';
  if (n.includes('B') || n.includes('BLUE')) return 'blue';
  if (n.includes('C') || n.includes('ORANGE')) return 'orange';
  if (n.includes('YELLOW')) return 'yellow';
  return 'blue';
};

const ClassButton: React.FC<ClassButtonProps> = ({ label, color, onClick }) => {
  const colorClasses = {
    green: "from-green-500 to-green-700 border-green-400 shadow-green-900/50",
    blue: "from-blue-500 to-blue-700 border-blue-400 shadow-blue-900/50",
    orange: "from-orange-400 to-orange-600 border-orange-300 shadow-orange-900/50",
    yellow: "from-yellow-400 to-yellow-600 border-yellow-300 shadow-yellow-900/50",
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative w-full py-5 px-6 rounded-2xl border-2 bg-gradient-to-b 
        shadow-[0_12px_24px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.5)]
        transition-all duration-200 active:scale-95 active:translate-y-1
        ${colorClasses[color]}
        flex items-center justify-center text-center
      `}
    >
      <span className="text-black font-black text-base uppercase tracking-widest drop-shadow-md">
        {label}
      </span>
    </button>
  );
};

interface RegisterModuleProps {
  students: Student[];
  classes: ClassInfo[];
  schoolName: string;
  schoolLogo: string;
}

export const RegisterModule: React.FC<RegisterModuleProps> = ({ students, classes, schoolName, schoolLogo }) => {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('');
  const [term, setTerm] = useState('1');
  const [year, setYear] = useState('2024');

  const studentsInClass = useMemo(() => {
    return students
      .filter(s => s.class === selectedClass)
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [students, selectedClass]);

  const weeks = Array.from({ length: 13 }, (_, i) => i + 1);
  const dayInitials = ['M', 'T', 'W', 'T', 'F'];

  const handlePrint = () => { window.print(); };

  const renderRegisterTable = () => {
    const studentsPerPage = 16;
    const studentPages: Student[][] = [];
    for (let i = 0; i < studentsInClass.length; i += studentsPerPage) {
      studentPages.push(studentsInClass.slice(i, i + studentsPerPage));
    }

    if (studentPages.length === 0) { studentPages.push([]); }

    return (
      <div className="space-y-0 text-black block overflow-x-auto pb-20">
        {studentPages.map((pageStudents, pageIdx) => (
          <div key={pageIdx} className="bg-white p-4 md:p-8 font-sans shadow-2xl mx-auto border border-slate-200 mb-10 block min-w-[1200px]">
            {pageIdx === 0 && (
              <>
                <div className="flex justify-between items-start mb-6 relative block">
                  <div className="w-48 invisible"></div>
                  <div className="text-center flex-1">
                    <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
                      {schoolName.toUpperCase()} - PERIOD REGISTER
                    </h1>
                  </div>
                  <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center overflow-hidden shrink-0">
                    {schoolLogo ? <img src={schoolLogo} className="w-full h-full object-contain" /> : <i className="fas fa-school opacity-20"></i>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-6 text-[9px] md:text-[10px] font-black uppercase text-black block">
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <p className="flex-1 min-w-[300px]">STAFF: <span className="border-b border-black inline-block min-w-[200px]">{teacherName || '......................................'}</span></p>
                      <p>CLASS: <span className="border-b border-black inline-block min-w-[80px]">{selectedClass || '.............'}</span></p>
                      <p>SUBJECT: <span className="border-b border-black inline-block min-w-[120px]">{subject || '...................'}</span></p>
                      <p>YR: <span className="border-b border-black inline-block min-w-[40px] text-center">{year}</span></p>
                      <p>TERM: <span className="border-b border-black inline-block min-w-[40px] text-center">{term}</span></p>
                  </div>
                </div>
              </>
            )}

            <div className="block">
              <table className="w-full border-collapse border-2 border-black text-[8px] font-black uppercase text-black table-fixed">
                <thead>
                  <tr className="bg-slate-50">
                    <th rowSpan={2} className="border-2 border-black p-1 w-10 text-center">S/N</th>
                    <th rowSpan={2} className="border-2 border-black p-1 text-left w-32">STUDENT NAME</th>
                    <th rowSpan={2} className="border-2 border-black p-1 text-center w-12">GEN</th>
                    {weeks.map(w => (
                      <th key={w} colSpan={5} className="border-2 border-black p-1 text-center bg-slate-50">WK {w}</th>
                    ))}
                  </tr>
                  <tr className="bg-white h-7">
                    {weeks.map(w => dayInitials.map((d, di) => (
                      <th key={`${w}-${di}`} className="border border-black p-0 text-center w-5 text-[6px] align-middle">{d}</th>
                    )))}
                  </tr>
                </thead>
                <tbody>
                  {pageStudents.map((student, idx) => (
                    <tr key={student.id} className="h-8">
                      <td className="border-2 border-black text-center">{(pageIdx * studentsPerPage) + idx + 1}</td>
                      <td className="border-2 border-black px-1 text-left truncate">{student.name}</td>
                      <td className="border-2 border-black text-center text-[7px]">{student.gender.charAt(0)}</td>
                      {weeks.map(w => dayInitials.map((_, di) => (
                        <td key={`${w}-${di}`} className="border border-black"></td>
                      )))}
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, studentsPerPage - pageStudents.length) }).map((_, i) => (
                    <tr key={`x-${i}`} className="h-8"><td className="border-2 border-black" colSpan={3 + (weeks.length * 5)}></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center text-[7px] font-black uppercase text-slate-500 block">
               <p>{schoolName} System &bull; Page {pageIdx + 1}</p>
               <p>Printed {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-12 pb-24 block">
      {!selectedClass && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 block">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em] border-b-4 border-blue-600 inline-block pb-3 mb-6">REGISTER PORTAL</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Select class to generate official period tracking roll</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
            {classes.map(cls => (
              <ClassButton key={cls.id} label={cls.name} color={getClassColor(cls.name)} onClick={() => setSelectedClass(cls.name)} />
            ))}
          </div>
        </div>
      )}

      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 block">
          <div className="bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-800 flex flex-col lg:flex-row justify-between items-center no-print shadow-2xl gap-8 mb-12">
            <div className="flex items-center gap-6 self-start md:self-center">
              <button onClick={() => setSelectedClass(null)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white border border-slate-700 transition-all active:scale-90 shadow-lg"><i className="fas fa-arrow-left"></i></button>
              <div>
                <h3 className="text-white font-black uppercase text-xl tracking-[0.1em]">{selectedClass} Register</h3>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Period Attendance Document</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="Staff Name" className="flex-1 md:w-40 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none" />
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="flex-1 md:w-40 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none" />
              <button onClick={handlePrint} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"><i className="fas fa-print"></i> Generate</button>
            </div>
          </div>
          <div className="block">{renderRegisterTable()}</div>
        </div>
      )}
    </div>
  );
};