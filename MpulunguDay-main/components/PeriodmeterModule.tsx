import React, { useState, useMemo } from 'react';
import { PeriodAllocation, PeriodSession, PeriodAttendance, Teacher, ClassInfo, Subject, UserRole, Student } from '../types';

interface PeriodmeterModuleProps {
  allocations: PeriodAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<PeriodAllocation[]>>;
  sessions: PeriodSession[];
  setSessions: React.Dispatch<React.SetStateAction<PeriodSession[]>>;
  attendance: PeriodAttendance[];
  setAttendance: React.Dispatch<React.SetStateAction<PeriodAttendance[]>>;
  teachers: Teacher[];
  classes: ClassInfo[];
  subjects: Subject[];
  userRole: UserRole;
  userId: string;
  students: Student[];
  schoolName: string;
}

type Tab = 'TRACKING' | 'TARGETS' | 'REPORTS' | 'CLASS_AUDIT' | 'STUDENT_VIEW';

export const PeriodmeterModule: React.FC<PeriodmeterModuleProps> = ({
  allocations, setAllocations, sessions, setSessions, attendance, setAttendance, teachers, classes, subjects, userRole, userId, students, schoolName
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(userRole === 'STUDENT' ? 'STUDENT_VIEW' : 'TRACKING');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAuditClassId, setSelectedAuditClassId] = useState('');
  const [activePupilLogId, setActivePupilLogId] = useState<string | null>(null); // allocationId for attendance modal
  
  // Local state for "unsaved" changes in tracking
  const [stagedPeriods, setStagedPeriods] = useState<Record<string, number>>({});
  const [stagedAttendance, setStagedAttendance] = useState<Record<string, Record<string, 'P' | 'A'>>>({});

  const canManageTargets = userRole === 'ADMIN';
  
  // Helper mappings
  const teacherMap = useMemo(() => Object.fromEntries(teachers.map(t => [t.id, t.name])), [teachers]);
  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map(s => [s.id, s.name])), [subjects]);

  const handleStagePeriod = (allocId: string, count: number) => {
    setStagedPeriods(prev => ({ ...prev, [allocId]: count }));
  };

  const handleStagePupil = (allocId: string, studentId: string, status: 'P' | 'A') => {
    setStagedAttendance(prev => {
      const classAtt = prev[allocId] || {};
      return {
        ...prev,
        [allocId]: { ...classAtt, [studentId]: status }
      };
    });
  };

  const handleSaveLogs = () => {
    const newSessions = [...sessions];
    const newAttendance = [...attendance];

    Object.entries(stagedPeriods).forEach(([allocId, periods]: [string, number]) => {
      const existingIdx = newSessions.findIndex(s => s.allocationId === allocId && s.date === selectedDate);
      let sessionId: string;

      if (existingIdx > -1) {
        if (periods === 0) {
          sessionId = newSessions[existingIdx].id;
          newSessions.splice(existingIdx, 1);
          const filteredAtt = newAttendance.filter(a => a.sessionId !== sessionId);
          newAttendance.length = 0;
          newAttendance.push(...filteredAtt);
        } else {
          newSessions[existingIdx].periodsHeld = periods;
          sessionId = newSessions[existingIdx].id;
        }
      } else if (periods > 0) {
        sessionId = `PS-${allocId}-${selectedDate}`;
        newSessions.push({
          id: sessionId,
          allocationId: allocId,
          date: selectedDate,
          periodsHeld: periods,
          recordedBy: userId
        });
      } else {
        return;
      }

      const classAtt = stagedAttendance[allocId];
      if (classAtt) {
        Object.entries(classAtt).forEach(([studentId, status]) => {
          const attIdx = newAttendance.findIndex(a => a.sessionId === sessionId && a.studentId === studentId);
          if (attIdx > -1) {
            newAttendance[attIdx].status = status;
          } else {
            newAttendance.push({
              id: `PA-${sessionId}-${studentId}`,
              sessionId,
              studentId,
              status
            });
          }
        });
      }
    });

    setSessions(newSessions);
    setAttendance(newAttendance);
    setStagedPeriods({});
    setStagedAttendance({});
    alert("Logs committed and queued for cloud synchronization.");
  };

  const renderPupilLogModal = () => {
    if (!activePupilLogId) return null;
    const alloc = allocations.find(a => a.id === activePupilLogId);
    if (!alloc) return null;
    
    const classInfo = classes.find(c => c.id === alloc.classId);
    const classStudents = students.filter(s => s.class === classInfo?.name);
    const sessionRecord = sessions.find(s => s.allocationId === alloc.id && s.date === selectedDate);
    const sessionId = sessionRecord?.id || `PS-${alloc.id}-${selectedDate}`;
    
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Pupil Session Log</h3>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">
                  {classInfo?.name} • {subjectMap[alloc.subjectId]}
                </p>
             </div>
             <button onClick={() => setActivePupilLogId(null)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
               <i className="fas fa-times"></i>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {classStudents.map(student => {
              const staged = stagedAttendance[activePupilLogId]?.[student.id];
              const existing = attendance.find(a => a.sessionId === sessionId && a.studentId === student.id)?.status;
              const status = staged || existing || 'P';

              return (
                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                       {student.photo ? <img src={student.photo} className="w-full h-full object-cover" /> : <i className="fas fa-user text-slate-600"></i>}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase">{student.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{student.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleStagePupil(activePupilLogId, student.id, 'P')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${status === 'P' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      P
                    </button>
                    <button 
                      onClick={() => handleStagePupil(activePupilLogId, student.id, 'A')}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${status === 'A' ? 'bg-rose-600 border-rose-400 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      A
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-4">
             <button onClick={() => setActivePupilLogId(null)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
               Apply Pupil Log
             </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTracking = () => {
    const hasUnsavedChanges = Object.keys(stagedPeriods).length > 0 || Object.keys(stagedAttendance).length > 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl no-print">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[20px] flex items-center justify-center text-white text-2xl shadow-2xl shadow-blue-500/20">
               <i className="fas fa-clock"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Period Log Engine</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Official Attendance & Period Meter</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
             <div className="flex flex-col gap-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Log Date</label>
               <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-3 text-sm text-white font-bold outline-none focus:border-blue-600 transition-all" />
             </div>
             {hasUnsavedChanges && (
               <button 
                 onClick={handleSaveLogs}
                 className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 transition-all flex items-center gap-3 animate-bounce"
               >
                 <i className="fas fa-save"></i> Commit Changes
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {allocations
             .filter(a => userRole !== 'TEACHER' || a.teacherId === userId)
             .map(alloc => {
                const sessionRecord = sessions.find(s => s.allocationId === alloc.id && s.date === selectedDate);
                const currentCount = stagedPeriods[alloc.id] !== undefined ? stagedPeriods[alloc.id] : (sessionRecord?.periodsHeld || 0);
                const classStudents = students.filter(s => s.class === classMap[alloc.classId]);
                const presentCount = stagedAttendance[alloc.id] 
                  ? Object.values(stagedAttendance[alloc.id]).filter(v => v === 'P').length 
                  : attendance.filter(a => a.sessionId === sessionRecord?.id && a.status === 'P').length;

                return (
                  <div key={alloc.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-xl relative group hover:border-blue-500/30 transition-all">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{subjectMap[alloc.subjectId]}</p>
                           <h4 className="text-xl font-black text-white uppercase leading-tight">{teacherMap[alloc.teacherId]}</h4>
                           <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Class: {classMap[alloc.classId]}</p>
                        </div>
                        <button 
                          onClick={() => setActivePupilLogId(alloc.id)}
                          className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white p-4 rounded-2xl transition-all flex flex-col items-center gap-1 group shadow-lg"
                        >
                           <i className="fas fa-users text-lg"></i>
                           <span className="text-[8px] font-black uppercase">Pupil Log</span>
                        </button>
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                           <span className="text-[10px] font-black text-slate-600 uppercase">Periods Held Today</span>
                           <span className="text-2xl font-black text-white">{currentCount}</span>
                        </div>
                        <div className="flex gap-2">
                           {[0, 1, 2, 3, 4, 5].map(num => (
                             <button
                               key={num}
                               onClick={() => handleStagePeriod(alloc.id, num)}
                               className={`flex-1 py-4 rounded-xl text-sm font-black transition-all border-2 ${
                                 currentCount === num 
                                 ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' 
                                 : 'bg-slate-950 border-slate-800 text-slate-700 hover:border-slate-600'
                               }`}
                             >
                               {num}
                             </button>
                           ))}
                        </div>
                     </div>

                     <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-blue-500 text-sm border border-slate-800">
                              <i className="fas fa-user-check"></i>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pupils Present</p>
                              <p className="text-sm font-black text-white">{currentCount > 0 ? `${presentCount} / ${classStudents.length}` : 'Log Session First'}</p>
                           </div>
                        </div>
                        {stagedPeriods[alloc.id] !== undefined && (
                          <div className="flex items-center gap-2 text-amber-500">
                             <i className="fas fa-circle-notch animate-spin text-[8px]"></i>
                             <span className="text-[8px] font-black uppercase tracking-widest">Unsaved</span>
                          </div>
                        )}
                     </div>
                  </div>
                );
             })}
        </div>

        {renderPupilLogModal()}
      </div>
    );
  };

  const renderTargets = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <i className="fas fa-bullseye text-blue-500"></i> Configure Academic Loads
        </h3>
        
        {canManageTargets && (
          <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 mb-10">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">New Target Definition</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Teacher</label>
                  <select id="t-id" className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-blue-600 transition-all">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Class</label>
                  <select id="c-id" className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-blue-600 transition-all">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Subject</label>
                  <select id="s-id" className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-blue-600 transition-all">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-600 uppercase ml-1">Weekly Target</label>
                  <div className="flex gap-3">
                     <input id="w-target" type="number" defaultValue="5" className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-2xl p-3 text-xs text-white outline-none focus:border-blue-600 transition-all" />
                     <button 
                       onClick={() => {
                         const tid = (document.getElementById('t-id') as HTMLSelectElement).value;
                         const cid = (document.getElementById('c-id') as HTMLSelectElement).value;
                         const sid = (document.getElementById('s-id') as HTMLSelectElement).value;
                         const wt = parseInt((document.getElementById('w-target') as HTMLInputElement).value) || 0;
                         if(!tid || !cid || !sid) return alert("Fill all fields");
                         setAllocations([...allocations, { id: `PT-${Date.now()}`, teacherId: tid, classId: cid, subjectId: sid, weeklyTarget: wt }]);
                       }}
                       className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-2xl shadow-lg transition-all active:scale-95"
                     >
                       <i className="fas fa-plus"></i>
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map(alloc => (
            <div key={alloc.id} className="bg-slate-950 border border-slate-800 p-6 rounded-[24px] group relative overflow-hidden">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{subjectMap[alloc.subjectId]}</p>
              <h4 className="text-white font-black uppercase text-sm mb-1">{teacherMap[alloc.teacherId]}</h4>
              <p className="text-slate-500 text-[10px] font-bold uppercase mb-4">{classMap[alloc.classId]}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                <span className="text-[10px] font-black text-slate-600 uppercase">Load: {alloc.weeklyTarget} Per Week</span>
                {canManageTargets && (
                  <button onClick={() => setAllocations(allocations.filter(a => a.id !== alloc.id))} className="text-slate-800 hover:text-rose-500 transition-colors">
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReports = () => {
    const stats = allocations.map(alloc => {
      const held = sessions
        .filter(s => s.allocationId === alloc.id)
        .reduce((sum, s) => sum + s.periodsHeld, 0);
      return { ...alloc, held };
    });

    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex justify-between items-center no-print shadow-2xl">
           <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Institutional Analytics</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Teacher & Pupil Coverage Metrics</p>
           </div>
           <button onClick={() => window.print()} className="bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:bg-slate-200 flex items-center gap-3">
             <i className="fas fa-file-pdf"></i> Generate Final PDF
           </button>
        </div>

        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-2 border-slate-100 printable-card text-black font-sans">
           <div className="text-center mb-10 border-b-2 border-black pb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">{schoolName}</h2>
              <h3 className="text-xl font-black uppercase tracking-widest mt-2 text-slate-900 underline decoration-4 underline-offset-8 decoration-blue-600">ACADEMIC PERIOD AUDIT</h3>
              <p className="text-[11px] font-black uppercase text-slate-500 mt-4">Cloud Verified Reporting Engine</p>
           </div>

           <table className="w-full border-collapse border-2 border-black">
              <thead>
                 <tr className="bg-slate-900 text-white">
                    <th className="border-2 border-black p-4 text-left text-[11px] font-black uppercase">Staff Member</th>
                    <th className="border-2 border-black p-4 text-left text-[11px] font-black uppercase">Curriculum Load</th>
                    <th className="border-2 border-black p-4 text-center text-[11px] font-black uppercase">Target</th>
                    <th className="border-2 border-black p-4 text-center text-[11px] font-black uppercase">Executed</th>
                    <th className="border-2 border-black p-4 text-center text-[11px] font-black uppercase">Yield %</th>
                 </tr>
              </thead>
              <tbody>
                 {stats.map(s => {
                    const percentage = (s.held / s.weeklyTarget) * 100;
                    return (
                       <tr key={s.id} className="h-14 text-[12px] font-bold text-black border-2 border-black">
                          <td className="border-2 border-black px-6 uppercase font-black">{teacherMap[s.teacherId]}</td>
                          <td className="border-2 border-black px-6 uppercase font-bold text-slate-600">
                             {subjectMap[s.subjectId]} • {classMap[s.classId]}
                          </td>
                          <td className="border-2 border-black text-center font-black">{s.weeklyTarget}</td>
                          <td className="border-2 border-black text-center font-black bg-slate-50">{s.held}</td>
                          <td className="border-2 border-black text-center">
                             <span className={`px-4 py-1 rounded-full border-2 font-black ${percentage >= 100 ? 'bg-green-100 text-green-900 border-green-800' : 'bg-rose-100 text-rose-900 border-rose-800'}`}>
                                {percentage.toFixed(0)}%
                             </span>
                          </td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>

           <div className="mt-24 flex justify-between px-10">
              <div className="text-center w-64 border-t-2 border-black pt-4">
                 <p className="font-black uppercase text-[10px]">Academic Registrar</p>
              </div>
              <div className="text-center w-64 border-t-2 border-black pt-4">
                 <p className="font-black uppercase text-[10px]">Institutional Head</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderClassAudit = () => {
    const auditClass = classes.find(c => c.id === selectedAuditClassId);
    const classStudents = students.filter(s => s.class === auditClass?.name);
    const classAllocations = allocations.filter(a => a.classId === selectedAuditClassId);
    
    const auditResults = classStudents.map(student => {
      let totalHeld = 0;
      let totalAttended = 0;

      classAllocations.forEach(alloc => {
        const relevantSessions = sessions.filter(s => s.allocationId === alloc.id);
        const heldInSubject = relevantSessions.reduce((sum, s) => sum + s.periodsHeld, 0);
        const attendedInSubject = attendance.filter(a => 
          relevantSessions.some(s => s.id === a.sessionId) && 
          a.studentId === student.id && 
          a.status === 'P'
        ).length;

        totalHeld += heldInSubject;
        totalAttended += attendedInSubject;
      });

      return {
        ...student,
        totalHeld,
        totalAttended,
        rate: totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0
      };
    });

    return (
      <div className="animate-in fade-in duration-500 space-y-8">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 flex flex-col md:flex-row justify-between items-center no-print shadow-2xl gap-6">
           <div className="flex-1 w-full md:w-auto">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Select Class for Audit</label>
              <select 
                value={selectedAuditClassId} 
                onChange={e => setSelectedAuditClassId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-blue-600 transition-all uppercase"
              >
                <option value="">Choose Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
           </div>
           <button onClick={() => window.print()} disabled={!selectedAuditClassId} className="bg-white text-black px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all hover:bg-slate-200 flex items-center gap-3 disabled:opacity-50">
             <i className="fas fa-print"></i> Print Class Audit
           </button>
        </div>

        {auditClass && (
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border-2 border-slate-100 printable-card text-black font-sans">
             <div className="text-center mb-10 border-b-2 border-black pb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">{schoolName}</h2>
                <h3 className="text-xl font-black uppercase tracking-widest mt-1 text-slate-900 underline decoration-4 underline-offset-8 decoration-blue-600">CLASS PARTICIPATION AUDIT</h3>
                <div className="mt-6 flex justify-center gap-12">
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Academic Stream</p>
                      <p className="text-sm font-black uppercase">{auditClass.name}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Ref Date</p>
                      <p className="text-sm font-black uppercase">{new Date().toLocaleDateString()}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Subjects</p>
                      <p className="text-sm font-black uppercase">{classAllocations.length}</p>
                   </div>
                </div>
             </div>

             <table className="w-full border-collapse border-2 border-black">
                <thead>
                   <tr className="bg-slate-900 text-white">
                      <th className="border-2 border-black p-4 text-left text-[10px] font-black uppercase">#</th>
                      <th className="border-2 border-black p-4 text-left text-[10px] font-black uppercase">Student Identity</th>
                      <th className="border-2 border-black p-4 text-center text-[10px] font-black uppercase w-24">Total Periods</th>
                      <th className="border-2 border-black p-4 text-center text-[10px] font-black uppercase w-24">Present</th>
                      <th className="border-2 border-black p-4 text-center text-[10px] font-black uppercase w-32">Overall Yield</th>
                   </tr>
                </thead>
                <tbody>
                   {auditResults.map((res, idx) => (
                      <tr key={res.id} className="h-12 text-[11px] font-bold text-black border-2 border-black hover:bg-slate-50 transition-colors">
                         <td className="border-2 border-black text-center font-black">{idx + 1}</td>
                         <td className="border-2 border-black px-4 uppercase">
                            <span className="font-black">{res.name}</span>
                            <span className="ml-3 text-[9px] font-mono text-slate-500">{res.id}</span>
                         </td>
                         <td className="border-2 border-black text-center font-bold text-slate-400">{res.totalHeld}</td>
                         <td className="border-2 border-black text-center font-black bg-slate-50">{res.totalAttended}</td>
                         <td className="border-2 border-black text-center">
                            <span className={`px-3 py-1 rounded-full border-2 font-black ${res.rate >= 75 ? 'bg-green-100 text-green-900 border-green-800' : 'bg-rose-100 text-rose-900 border-rose-800'}`}>
                               {res.rate.toFixed(0)}%
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>

             <div className="mt-20 flex justify-between px-10">
                <div className="text-center w-64 border-t-2 border-black pt-4">
                   <p className="font-black uppercase text-[10px]">Registry Verification</p>
                </div>
                <div className="text-center w-64 border-t-2 border-black pt-4">
                   <p className="font-black uppercase text-[10px]">School Administrator</p>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderStudentView = () => {
    const student = students.find(s => s.id === userId);
    if (!student) return null;
    
    const myClassId = classes.find(c => c.name === student.class)?.id;
    const mySessions = sessions.filter(s => {
      const alloc = allocations.find(a => a.id === s.allocationId);
      return alloc?.classId === myClassId;
    });

    const totalHeld = mySessions.reduce((sum, s) => sum + s.periodsHeld, 0);
    const myAttendanceCount = attendance.filter(a => 
      mySessions.some(s => s.id === a.sessionId) && 
      a.studentId === userId && 
      a.status === 'P'
    ).length;

    const weeklyTarget = 45; 

    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Academic Pulse</h2>
          <p className="text-blue-500 text-[12px] font-black uppercase tracking-[0.4em]">Personal Participation Metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-1 bg-slate-900 p-12 rounded-[50px] border border-slate-800 flex flex-col items-center justify-center text-center shadow-2xl group hover:border-blue-500/30 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <i className="fas fa-chart-line text-9xl"></i>
              </div>
              <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-950" />
                    <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={540} strokeDashoffset={540 - (Math.min(100, (totalHeld/weeklyTarget)*100) / 100) * 540} className="text-blue-600 transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-black text-white tracking-tighter">{totalHeld}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Sessions Held</p>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-xs font-black text-white uppercase">{((totalHeld / weeklyTarget) * 100).toFixed(0)}% Coverage</p>
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Target: {weeklyTarget} Periods</p>
              </div>
           </div>

           <div className="md:col-span-2 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Presence Count</p>
                    <p className="text-3xl font-black text-white uppercase">{myAttendanceCount}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Official Log Checkins</p>
                 </div>
                 <div className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-2">Subject Breadth</p>
                    <p className="text-3xl font-black text-white uppercase">{new Set(mySessions.map(s => allocations.find(a => a.id === s.allocationId)?.subjectId)).size}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Active Modules Tracked</p>
                 </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="flex justify-between items-center mb-8">
                    <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Learning Stream</h4>
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Live Sync</span>
                 </div>
                 <div className="space-y-5">
                    {mySessions.slice(-4).reverse().map(s => {
                      const alloc = allocations.find(a => a.id === s.allocationId);
                      const myAtt = attendance.find(a => a.sessionId === s.id && a.studentId === userId);
                      return (
                        <div key={s.id} className="flex justify-between items-center bg-slate-950 p-5 rounded-2xl border border-slate-800 hover:border-slate-600 transition-all group">
                           <div className="flex items-center gap-5">
                              <div className={`w-3 h-3 rounded-full ${myAtt?.status === 'P' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                              <div>
                                 <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{subjectMap[alloc?.subjectId || '']}</p>
                                 <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{s.date} • {teacherMap[alloc?.teacherId || '']}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800">+{s.periodsHeld} P</span>
                           </div>
                        </div>
                      );
                    })}
                    {mySessions.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center gap-4">
                         <i className="fas fa-layer-group text-4xl text-slate-800"></i>
                         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">No academic stream data detected</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 no-print">
        {[
          { id: 'TRACKING', label: 'Quick Log', icon: 'fa-bolt', roles: ['ADMIN', 'ATTENDANCE_OFFICER', 'TEACHER'] },
          { id: 'TARGETS', label: 'Load Settings', icon: 'fa-cog', roles: ['ADMIN'] },
          { id: 'REPORTS', label: 'Teacher Audit', icon: 'fa-chalkboard-teacher', roles: ['ADMIN', 'TEACHER'] },
          { id: 'CLASS_AUDIT', label: 'Class Audit', icon: 'fa-users', roles: ['ADMIN', 'TEACHER'] },
          { id: 'STUDENT_VIEW', label: 'My Participation', icon: 'fa-wave-square', roles: ['STUDENT'] }
        ]
        .filter(tab => tab.roles.includes(userRole))
        .map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-3 px-8 py-4 rounded-full text-[10px] font-black transition-all uppercase tracking-widest ${
              activeTab === tab.id 
              ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
              : 'bg-slate-900 text-slate-500 hover:text-white border border-slate-800'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'TARGETS' && renderTargets()}
        {activeTab === 'TRACKING' && renderTracking()}
        {activeTab === 'REPORTS' && renderReports()}
        {activeTab === 'CLASS_AUDIT' && renderClassAudit()}
        {activeTab === 'STUDENT_VIEW' && renderStudentView()}
      </div>
    </div>
  );
};