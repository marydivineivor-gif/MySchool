
import React, { useState, useEffect, useMemo } from 'react';
import { Student, ClassInfo, Subject, UserRole } from '../types';

interface AdmissionReceiptModuleProps {
  students: Student[];
  classes: ClassInfo[];
  subjects: Subject[];
  schoolLogo?: string;
  schoolName: string;
  schoolMotto: string;
  schoolContact: string;
  userRole: UserRole;
  userId: string;
}

export const AdmissionReceiptModule: React.FC<AdmissionReceiptModuleProps> = ({ 
  students, classes, subjects, schoolLogo, schoolName, schoolMotto, schoolContact, userRole, userId 
}) => {
  const sortedStudents = useMemo(() => [...students].sort((a, b) => a.id.localeCompare(b.id)), [students]);

  const [selectedStudentId, setSelectedStudentId] = useState(
    userRole === 'STUDENT' ? userId : (sortedStudents[0]?.id || '')
  );
  
  useEffect(() => {
    if (userRole === 'STUDENT') {
      setSelectedStudentId(userId);
    }
  }, [userRole, userId]);

  const student = sortedStudents.find(s => s.id === selectedStudentId);
  const classInfo = classes.find(c => c.name === student?.class);
  const assignedSubjects: Subject[] = classInfo 
    ? subjects.filter(s => classInfo.subjectIds.includes(s.id))
    : [];

  const handlePrint = () => {
    window.print();
  };

  const COAT_OF_ARMS_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Coat_of_arms_of_Zambia.svg/512px-Coat_of_arms_of_Zambia.svg.png";

  const renderReceiptContent = () => (
    <div className="bg-white text-black p-4 md:p-8 shadow-2xl mx-auto max-w-[850px] border border-slate-300 printable-card min-h-[1050px] flex flex-col font-sans animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="grid grid-cols-12 mb-2 relative">
        <div className="col-span-3 flex flex-col items-start justify-start">
           {schoolLogo ? (
             <img src={schoolLogo} alt="School Logo" className="w-24 h-24 object-contain" />
           ) : (
             <div className="w-20 h-20 border border-black flex items-center justify-center p-1 text-[8px] font-bold text-center uppercase italic opacity-30">
                Logo
             </div>
           )}
           <div className="text-[8px] font-black leading-none mt-2 space-y-0.5">
             <p>ALL CORRESPONDENCE TO BE</p>
             <p className="border-b border-black inline-block">ADDRESSED TO THE HEADTEACHER</p>
             <p>NOT TO ANY INDIVIDUAL BY NAME</p>
           </div>
        </div>
        
        <div className="col-span-6 text-center pt-6">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none mb-4">{schoolName.toUpperCase()}</h1>
          <div className="text-[11px] font-black uppercase space-y-1">
             <p>P.O. BOX 124</p>
             <p>MPULUNGU</p>
          </div>
        </div>

        <div className="col-span-3 flex flex-col items-end">
           <img 
             src={COAT_OF_ARMS_URL} 
             alt="Coat of Arms of Zambia" 
             className="w-24 h-24 object-contain"
           />
        </div>
      </div>

      <div className="text-[10px] font-black uppercase mb-4">
         CELL: {schoolContact || '+260977134049'}
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest border-b-2 border-black inline-block pb-1">
          OFFICIAL ADMISSION RECEIPT
        </h2>
      </div>

      {/* STUDENT DATA GRID */}
      <div className="grid grid-cols-12 border-t-2 border-l-2 border-black text-[10px] md:text-[11px] uppercase font-black">
        {/* Row 1 */}
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">STUDENT NO.</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center">{student?.id || '-'}</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">DOA</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center">{student?.dateOfAdmission?.split('-').reverse().join('.') || '0'}</div>

        {/* Row 2 */}
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">NAME</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center text-center">{student?.name || '-'}</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">CLUB</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center text-center">{student?.club || '-'}</div>

        {/* Row 3 */}
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">CLASS</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center text-center">{student?.class || '-'}</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">GUARDIAN</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center text-center">{student?.guardianName || '-'}</div>

        {/* Row 4 */}
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">GENDER</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center">{student?.gender || '-'}</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">ADDRESS</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center text-center">{student?.residentialAddress || '-'}</div>

        {/* Row 5 */}
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">DOB</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center">{student?.dob?.split('-').reverse().join('.') || '-'}</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black bg-[#E8E8E8] p-2 flex items-center">CONTACT</div>
        <div className="col-span-3 border-r-2 border-b-2 border-black p-2 flex items-center justify-center">{student?.contact || '-'}</div>
      </div>

      <div className="text-center my-8">
        <p className="text-lg md:text-xl font-black uppercase">You will be taking the following subjects:</p>
      </div>

      {/* SUBJECTS GRID */}
      <div className="grid grid-cols-2 gap-x-16 gap-y-4 mb-12 px-2">
        {assignedSubjects.length > 0 ? (
          assignedSubjects.slice(0, 10).map((sub, idx) => (
            <div key={idx} className="border border-black px-4 py-1 text-center font-bold text-[11px] md:text-xs uppercase">
              {sub.name}
            </div>
          ))
        ) : (
          <>
            <div className="border border-black px-4 py-1 text-center font-bold text-[11px] md:text-xs uppercase italic opacity-20">ENGLISH LANGUAGE</div>
            <div className="border border-black px-4 py-1 text-center font-bold text-[11px] md:text-xs uppercase italic opacity-20">GEOGRAPHY</div>
            <div className="border border-black px-4 py-1 text-center font-bold text-[11px] md:text-xs uppercase italic opacity-20">MATHEMATICS</div>
            <div className="border border-black px-4 py-1 text-center font-bold text-[11px] md:text-xs uppercase italic opacity-20">ADDITIONAL MATHS</div>
          </>
        )}
      </div>

      {/* FOOTER SIGNATURE SECTION */}
      <div className="mt-auto space-y-8 pb-4">
        <div className="grid grid-cols-2 gap-x-20">
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-left">DEPUTY HEADTEACHER</p>
              <div className="border border-black h-10 w-full"></div>
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-left">GRADE TEACHER</p>
              <div className="border border-black h-10 w-full"></div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-x-20">
           <div className="invisible"></div>
           <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-left">GUIDANCE TEACHER</p>
              <div className="border border-black h-10 w-full"></div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {userRole !== 'STUDENT' ? (
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center no-print shadow-lg gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Select Recipient</label>
            <select 
              value={selectedStudentId} 
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full md:w-64 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none uppercase"
            >
              {sortedStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handlePrint}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <i className="fas fa-print"></i> Print Receipt
          </button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 no-print shadow-xl gap-4">
           <div className="text-center md:text-left">
              <h3 className="text-white font-black uppercase tracking-widest text-lg">My Admission Document</h3>
              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Academic Record</p>
           </div>
           <button 
              onClick={handlePrint}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
           >
              <i className="fas fa-print"></i> Generate Official Copy
           </button>
        </div>
      )}

      <div className="overflow-x-auto">
        {renderReceiptContent()}
      </div>
    </div>
  );
};
