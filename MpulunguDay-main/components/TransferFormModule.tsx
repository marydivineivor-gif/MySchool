import React, { useState, useMemo } from 'react';
import { Subject, Student, ClassInfo, StudentMark, ExamSession, GradeScale } from '../types';

interface TransferFormModuleProps {
  students: Student[];
  classes: ClassInfo[];
  subjects: Subject[];
  schoolName: string;
  marks: StudentMark[];
  sessions: ExamSession[];
  gradeScales: GradeScale[];
}

export const TransferFormModule: React.FC<TransferFormModuleProps> = ({ 
  students, classes, subjects, schoolName, marks, sessions, gradeScales 
}) => {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.id.localeCompare(b.id)), [students]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [destinationSchool, setDestinationSchool] = useState('Any School');

  const student = sortedStudents.find(s => s.id === selectedStudentId);
  const classInfo = classes.find(c => c.name === student?.class);
  
  const assignedSubjects: Subject[] = useMemo(() => {
    if (!classInfo) return [];
    return subjects.filter(s => classInfo.subjectIds.includes(s.id));
  }, [classInfo, subjects]);

  const studentPerformance = useMemo(() => {
    if (!selectedStudentId) return null;
    
    const studentMarks = marks.filter(m => m.studentId === selectedStudentId);
    if (studentMarks.length === 0) return null;

    const activeSessionIds = new Set(studentMarks.map(m => m.sessionId));
    const activeSessions = sessions.filter(s => activeSessionIds.has(s.id));
    
    const latestSession = [...activeSessions].sort((a, b) => b.id.localeCompare(a.id))[0];
    
    if (!latestSession) return null;

    const latestMarks = studentMarks.filter(m => m.sessionId === latestSession.id);
    
    return {
      session: latestSession,
      marks: latestMarks
    };
  }, [selectedStudentId, marks, sessions]);

  const getGradeLabel = (score: number) => {
    if (score === -1) return 'X';
    const scale = gradeScales.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
    return scale ? scale.label : '-';
  };

  const COAT_OF_ARMS_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png";

  const handlePrint = () => window.print();

  const renderTransferForm = (isPrint: boolean = false) => {
    if (!student) return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
        <i className="fas fa-file-import text-4xl text-slate-700 mb-4"></i>
        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Select a student to generate transfer request</p>
      </div>
    );

    return (
      <div className={`bg-white text-black p-8 md:p-12 ${isPrint ? 'w-full' : 'shadow-2xl mx-auto max-w-[850px] border border-slate-200'} printable-card min-h-[1050px] flex flex-col font-sans relative`}>
        <div className="text-center space-y-2 mb-8 relative z-10">
          <img src={COAT_OF_ARMS_URL} alt="Zambia" className="w-20 h-20 mx-auto mb-4 object-contain" />
          <h1 className="text-base font-black uppercase tracking-widest leading-none">REPUBLIC OF ZAMBIA</h1>
          <h2 className="text-base font-black uppercase tracking-widest leading-none">MINISTRY OF EDUCATION</h2>
        </div>

        <div className="flex justify-end mb-10 relative z-10">
          <div className="text-right font-black uppercase text-sm space-y-1">
            <p className="text-base font-bold">{schoolName}</p>
            <p>P.O. BOX 124</p>
            <p>OFFICIAL RESIDENCE</p>
          </div>
        </div>

        <div className="mb-10 relative z-10">
          <div className="font-black uppercase text-sm space-y-1">
            <p>The Headteacher</p>
            <div className="flex items-center gap-2">
               <span className="hidden print:inline-block">{destinationSchool}</span>
               <input 
                 value={destinationSchool} 
                 onChange={(e) => setDestinationSchool(e.target.value)} 
                 className="print:hidden border-b border-black outline-none font-black text-sm uppercase px-1 w-64"
                 placeholder="Enter Destination School..."
               />
            </div>
          </div>
        </div>

        <div className="mb-8 relative z-10">
          <p className="font-black text-sm">Dear Sir/Madam,</p>
        </div>

        <div className="mb-4 relative z-10">
           <p className="font-black text-sm underline uppercase">RE: TRANSFER OF STUDENT: {student.name}</p>
        </div>

        <div className="grid grid-cols-12 border-t border-l border-black mb-10 relative z-10">
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">STUDENT NO.</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center">{student.id}</div>
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">DOA</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center">{student.dateOfAdmission.split('-').reverse().join('.')}</div>

          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">NAME</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.name}</div>
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">CLUB</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.club || 'NONE'}</div>

          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">CLASS</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.class}</div>
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">GUARDIAN</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.guardianName}</div>

          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">GENDER</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.gender}</div>
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">ADDRESS</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center uppercase">{student.residentialAddress}</div>

          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">DOB</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center">{student.dob.split('-').reverse().join('.')}</div>
          <div className="col-span-3 border-r border-b border-black bg-slate-100 p-2 font-black uppercase text-[10px]">PHONE</div>
          <div className="col-span-3 border-r border-b border-black p-2 font-black text-[11px] text-center">{student.contact}</div>
        </div>

        <div className="mb-8 relative z-10">
          {studentPerformance ? (
            <>
              <p className="font-black text-[11px] mb-4 underline uppercase tracking-widest">
                Latest Examination Performance ({studentPerformance.session.name} - {studentPerformance.session.year}):
              </p>
              <table className="w-full border-collapse border-2 border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black p-2 text-left uppercase">Subject</th>
                    <th className="border border-black p-2 text-center uppercase w-20">Mark (%)</th>
                    <th className="border border-black p-2 text-center uppercase w-20">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPerformance.marks.map(m => {
                    const sub = subjects.find(s => s.id === m.subjectId);
                    return (
                      <tr key={m.subjectId}>
                        <td className="border border-black p-2 font-black uppercase">{sub?.name || 'N/A'}</td>
                        <td className="border border-black p-2 text-center font-bold">{m.score === -1 ? 'X' : m.score}</td>
                        <td className="border border-black p-2 text-center font-black">{getGradeLabel(m.score)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <>
              <p className="font-black text-[11px] mb-4 underline uppercase tracking-widest">Offered Curriculum (No Exam Records Found):</p>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3 px-4">
                {assignedSubjects.length > 0 ? (
                  assignedSubjects.map((sub, idx) => (
                    <div key={idx} className="border-b border-slate-300 py-1.5 text-center font-bold uppercase text-[10px] italic">{sub.name}</div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-slate-400 font-black uppercase text-[10px] py-4 border border-dashed border-slate-300">
                    No curriculum subjects associated with current class profile.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-auto pt-12 relative z-10 grid grid-cols-2 gap-12 items-end">
           <div className="border-t-2 border-black pt-2 text-center text-[9px] font-black uppercase">HEADTEACHER'S SIGNATURE</div>
           <div className="border border-slate-300 h-28 flex items-center justify-center italic text-slate-200 text-[9px] font-black uppercase">OFFICIAL STAMP</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center no-print shadow-xl gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full md:w-72 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white font-bold outline-none uppercase">
            <option value="">Select Student...</option>
            {sortedStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
          </select>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handlePrint} disabled={!selectedStudentId} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2">
            <i className="fas fa-print"></i> Print Letter
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center pb-20">
        {renderTransferForm(false)}
      </div>
    </div>
  );
};