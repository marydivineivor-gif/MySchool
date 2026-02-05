
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ModuleType, Student, Teacher, Subject, Department, ClassInfo, ClassAllocation, ExamSession, StudentMark, OnlineExam, ExamSubmission, GradeScale, AuthUser, Resource, Announcement, AttendanceRecord, PeriodAllocation, PeriodSession, PeriodAttendance } from './types';
import { MODULES, MOCK_GRADE_SCALES } from './constants';
import { StudentModule } from './components/StudentModule';
import { TeacherModule } from './components/TeacherModule';
import { EnrollmentModule } from './components/EnrollmentModule';
import { TransferFormModule } from './components/TransferFormModule';
import { ExamAnalysisModule } from './components/ExamAnalysisModule';
import { ExamManagementModule } from './components/ExamManagementModule';
import { AcademicsModule } from './components/AcademicsModule';
import { AdmissionReceiptModule } from './components/AdmissionReceiptModule';
import { SettingsModule } from './components/SettingsModule';
import { RegisterModule } from './components/RegisterModule';
import { ClassModule } from './components/ClassModule';
import { AttendanceModule } from './components/AttendanceModule';
import { OnlineExamModule } from './components/OnlineExamModule';
import { LoginModule } from './components/LoginModule';
import { StudyingResourcesModule } from './components/StudyingResourcesModule';
import { AnnouncementModule } from './components/AnnouncementModule';
import { PeriodmeterModule } from './components/PeriodmeterModule';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.HOME);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => 
    JSON.parse(localStorage.getItem('sms_auth_user') || 'null')
  );
  
  // Institutional Branding
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('sms_schoolLogo') || '');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('sms_schoolName') || 'IvorSmartSchools Academy');
  const [schoolMotto, setSchoolMotto] = useState(() => localStorage.getItem('sms_schoolMotto') || 'Smart Learning for a Smart Future');
  const [schoolContact, setSchoolContact] = useState(() => localStorage.getItem('sms_schoolContact') || '');

  // School Data States - All synchronized with LocalStorage
  const [students, setStudents] = useState<Student[]>(() => JSON.parse(localStorage.getItem('sms_students') || '[]'));
  const [teachers, setTeachers] = useState<Teacher[]>(() => JSON.parse(localStorage.getItem('sms_teachers') || '[]'));
  const [subjects, setSubjects] = useState<Subject[]>(() => JSON.parse(localStorage.getItem('sms_subjects') || '[]'));
  const [departments, setDepartments] = useState<Department[]>(() => JSON.parse(localStorage.getItem('sms_departments') || '[]'));
  const [classes, setClasses] = useState<ClassInfo[]>(() => JSON.parse(localStorage.getItem('sms_classes') || '[]'));
  const [allocations, setAllocations] = useState<ClassAllocation[]>(() => JSON.parse(localStorage.getItem('sms_allocations') || '[]'));
  const [sessions, setSessions] = useState<ExamSession[]>(() => JSON.parse(localStorage.getItem('sms_sessions') || '[]'));
  const [marks, setMarks] = useState<StudentMark[]>(() => JSON.parse(localStorage.getItem('sms_marks') || '[]'));
  const [gradeScales, setGradeScales] = useState<GradeScale[]>(() => JSON.parse(localStorage.getItem('sms_gradeScales') || JSON.stringify(MOCK_GRADE_SCALES)));
  const [onlineExams, setOnlineExams] = useState<OnlineExam[]>(() => JSON.parse(localStorage.getItem('sms_onlineExams') || '[]'));
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(() => JSON.parse(localStorage.getItem('sms_submissions') || '[]'));
  const [resources, setResources] = useState<Resource[]>(() => JSON.parse(localStorage.getItem('sms_resources') || '[]'));
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => JSON.parse(localStorage.getItem('sms_announcements') || '[]'));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => JSON.parse(localStorage.getItem('sms_attendance') || '[]'));
  const [periodAllocations, setPeriodAllocations] = useState<PeriodAllocation[]>(() => JSON.parse(localStorage.getItem('sms_period_allocations') || '[]'));
  const [periodSessions, setPeriodSessions] = useState<PeriodSession[]>(() => JSON.parse(localStorage.getItem('sms_period_sessions') || '[]'));
  const [periodAttendance, setPeriodAttendance] = useState<PeriodAttendance[]>(() => JSON.parse(localStorage.getItem('sms_period_attendance') || '[]'));

  // Persistence side-effects
  useEffect(() => { localStorage.setItem('sms_students', JSON.stringify(students)) }, [students]);
  useEffect(() => { localStorage.setItem('sms_teachers', JSON.stringify(teachers)) }, [teachers]);
  useEffect(() => { localStorage.setItem('sms_subjects', JSON.stringify(subjects)) }, [subjects]);
  useEffect(() => { localStorage.setItem('sms_departments', JSON.stringify(departments)) }, [departments]);
  useEffect(() => { localStorage.setItem('sms_classes', JSON.stringify(classes)) }, [classes]);
  useEffect(() => { localStorage.setItem('sms_allocations', JSON.stringify(allocations)) }, [allocations]);
  useEffect(() => { localStorage.setItem('sms_sessions', JSON.stringify(sessions)) }, [sessions]);
  useEffect(() => { localStorage.setItem('sms_marks', JSON.stringify(marks)) }, [marks]);
  useEffect(() => { localStorage.setItem('sms_gradeScales', JSON.stringify(gradeScales)) }, [gradeScales]);
  useEffect(() => { localStorage.setItem('sms_onlineExams', JSON.stringify(onlineExams)) }, [onlineExams]);
  useEffect(() => { localStorage.setItem('sms_submissions', JSON.stringify(submissions)) }, [submissions]);
  useEffect(() => { localStorage.setItem('sms_resources', JSON.stringify(resources)) }, [resources]);
  useEffect(() => { localStorage.setItem('sms_announcements', JSON.stringify(announcements)) }, [announcements]);
  useEffect(() => { localStorage.setItem('sms_attendance', JSON.stringify(attendance)) }, [attendance]);
  useEffect(() => { localStorage.setItem('sms_period_allocations', JSON.stringify(periodAllocations)) }, [periodAllocations]);
  useEffect(() => { localStorage.setItem('sms_period_sessions', JSON.stringify(periodSessions)) }, [periodSessions]);
  useEffect(() => { localStorage.setItem('sms_period_attendance', JSON.stringify(periodAttendance)) }, [periodAttendance]);

  useEffect(() => {
    localStorage.setItem('sms_schoolName', schoolName);
    localStorage.setItem('sms_schoolMotto', schoolMotto);
    localStorage.setItem('sms_schoolContact', schoolContact);
    localStorage.setItem('sms_schoolLogo', schoolLogo);
  }, [schoolName, schoolMotto, schoolContact, schoolLogo]);

  const handleLogout = () => {
    setAuthUser(null);
    setActiveModule(ModuleType.HOME);
    localStorage.removeItem('sms_auth_user');
  };

  const getVisibleModules = () => {
    if (!authUser) return [];
    if (authUser.role === 'ADMIN') return MODULES;
    if (authUser.role === 'ATTENDANCE_OFFICER') return MODULES.filter(m => [ModuleType.ATTENDANCE, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    if (authUser.role === 'TEACHER') return MODULES.filter(m => [ModuleType.EXAMS, ModuleType.RESOURCES, ModuleType.ATTENDANCE, ModuleType.REGISTER, ModuleType.CLASS, ModuleType.EMIS, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    if (authUser.role === 'STUDENT') return MODULES.filter(m => [ModuleType.EXAMS, ModuleType.RESOURCES, ModuleType.EXAM_ANALYSIS, ModuleType.ATTENDANCE, ModuleType.ADMISSION_RECEIPT, ModuleType.EMIS, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    return [];
  };

  const currentStudentProfile = useMemo(() => 
    authUser?.role === 'STUDENT' ? students.find(s => s.id === authUser.id) : null
  , [authUser, students]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      {authUser?.role === 'STUDENT' && currentStudentProfile && (
        <div className="bg-blue-950 border border-sky-500/20 p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-sky-500/20 transition-all duration-700"></div>
          
          <div className="w-40 h-40 shrink-0 border-4 border-black rounded-3xl overflow-hidden shadow-2xl relative z-10 bg-black">
             {currentStudentProfile.photo ? (
               <img src={currentStudentProfile.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Student Photo" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-sky-700 bg-blue-950">
                 <i className="fas fa-user-graduate text-5xl"></i>
               </div>
             )}
          </div>

          <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-sky-400 transition-colors">
              Welcome Back, {currentStudentProfile.name}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               <span className="px-4 py-1.5 bg-sky-600/10 text-sky-400 border border-sky-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Class: {currentStudentProfile.class}</span>
               <span className="px-4 py-1.5 bg-black text-slate-400 border border-blue-900 rounded-full text-[10px] font-black uppercase tracking-widest font-mono">ID: {currentStudentProfile.id}</span>
               <span className="px-4 py-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">Status: {currentStudentProfile.status}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Registered Students', val: students.length, icon: 'fa-user-graduate', color: 'text-sky-400', bg: 'bg-sky-400/10' },
          { label: 'Faculty Members', val: teachers.length, icon: 'fa-chalkboard-teacher', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Active Classes', val: classes.length, icon: 'fa-school', color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Published Exams', val: onlineExams.length, icon: 'fa-file-invoice', color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-blue-950 border border-white/5 p-6 rounded-3xl shadow-xl flex items-center justify-between group hover:border-sky-500/30 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tighter">{stat.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Command Center</h3>
              <div className="h-px flex-1 mx-6 bg-white/5"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {getVisibleModules().map((module) => (
                <button 
                  key={module.id} 
                  onClick={() => setActiveModule(module.id)} 
                  className="bg-blue-950 border border-white/5 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:bg-sky-500 transition-all hover:-translate-y-1 shadow-lg overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 group-hover:bg-white/20"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-4 leading-tight group-hover:scale-105 transition-transform">
                    {module.label}
                  </span>
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Feed</h3>
           </div>
           <div className="bg-blue-950 border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
              {announcements.slice(0, 3).map(ann => (
                <div key={ann.id} className="p-4 bg-black/20 rounded-2xl border border-white/5">
                   <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${ann.targetType === 'GLOBAL' ? 'text-sky-400' : 'text-amber-500'}`}>{ann.targetType}</span>
                      <span className="text-[8px] font-mono text-slate-600">{new Date(ann.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h4 className="text-xs font-bold text-white uppercase line-clamp-1">{ann.title}</h4>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-center text-[10px] font-black text-slate-600 uppercase py-10">No recent announcements</p>}
           </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!authUser) return null;
    switch (activeModule) {
      case ModuleType.HOME: return renderDashboard();
      case ModuleType.STUDENTS: return <StudentModule students={students} setStudents={setStudents} />;
      case ModuleType.TEACHERS: return <TeacherModule teachers={teachers} setTeachers={setTeachers} />;
      case ModuleType.EXAMS: return <ExamManagementModule students={students} setStudents={setStudents} sessions={sessions} setSessions={setSessions} marks={marks} setMarks={setMarks} subjects={subjects} classes={classes} allocations={allocations} schoolName={schoolName} schoolLogo={schoolLogo} gradeScales={gradeScales} setGradeScales={setGradeScales} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.RESOURCES: return <StudyingResourcesModule resources={resources} setResources={setResources} subjects={subjects} classes={classes} userRole={authUser.role} userId={authUser.id} teachers={teachers} students={students} />;
      case ModuleType.ANNOUNCEMENTS: return <AnnouncementModule announcements={announcements} setAnnouncements={setAnnouncements} userRole={authUser.role} userId={authUser.id} userName={authUser.name} classes={classes} allocations={allocations} students={students} />;
      case ModuleType.ENROLLMENT: return <EnrollmentModule students={students} />;
      case ModuleType.TRANSFER_FORM: return <TransferFormModule students={students} classes={classes} subjects={subjects} schoolName={schoolName} marks={marks} sessions={sessions} gradeScales={gradeScales} />;
      case ModuleType.EXAM_ANALYSIS: return <ExamAnalysisModule students={students} marks={marks} subjects={subjects} classes={classes} teachers={teachers} allocations={allocations} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.PAYMENT: return <AcademicsModule departments={departments} setDepartments={setDepartments} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} allocations={allocations} setAllocations={setAllocations} teachers={teachers} />;
      case ModuleType.REGISTER: return <RegisterModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.CLASS: return <ClassModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.ATTENDANCE: return <AttendanceModule students={students} classes={classes} schoolName={schoolName} userRole={authUser.role} userId={authUser.id} attendance={attendance} setAttendance={setAttendance} />;
      case ModuleType.ADMISSION_RECEIPT: return <AdmissionReceiptModule students={students} classes={classes} subjects={subjects} schoolLogo={schoolLogo} schoolName={schoolName} schoolMotto={schoolMotto} schoolContact={schoolContact} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.EMIS: return <OnlineExamModule exams={onlineExams} setExams={setOnlineExams} submissions={submissions} setSubmissions={setSubmissions} subjects={subjects} classes={classes} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} userRole={authUser.role} userId={authUser.id} />;
      case ModuleType.SETTINGS: return <SettingsModule schoolLogo={schoolLogo} onLogoChange={setSchoolLogo} schoolName={schoolName} onNameChange={setSchoolName} schoolMotto={schoolMotto} onMottoChange={setSchoolMotto} schoolContact={schoolContact} onContactChange={setSchoolContact} />;
      case ModuleType.PERIODMETER: return <PeriodmeterModule allocations={periodAllocations} setAllocations={setPeriodAllocations} sessions={periodSessions} setSessions={setPeriodSessions} attendance={periodAttendance} setAttendance={setPeriodAttendance} teachers={teachers} classes={classes} subjects={subjects} userRole={authUser.role} userId={authUser.id} students={students} schoolName={schoolName} />;
      default: return null;
    }
  };

  if (!authUser) return <LoginModule onLogin={setAuthUser} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} />;

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-sky-600/30">
      <header className="bg-black border-b border-blue-900 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveModule(ModuleType.HOME)}>
          <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
            <i className="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-none">{schoolName}</h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Local Mode</span></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-blue-950 px-4 py-2 rounded-2xl border border-blue-900">
           <div className="w-7 h-7 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center text-[10px] font-black text-white shadow-lg relative uppercase">
              {currentStudentProfile?.photo ? <img src={currentStudentProfile.photo} className="w-full h-full object-cover" alt="User" /> : authUser.name.charAt(0)}
           </div>
           <div className="flex flex-col"><p className="text-[10px] font-black text-white leading-none uppercase">{authUser.name}</p><p className="text-[8px] font-bold text-sky-400 leading-none uppercase mt-1">{authUser.role}</p></div>
           <button onClick={handleLogout} className="ml-3 w-8 h-8 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center" title="Terminate Session"><i className="fas fa-power-off text-xs"></i></button>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-8">
        {activeModule !== ModuleType.HOME && (
          <button onClick={() => setActiveModule(ModuleType.HOME)} className="mb-6 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-sky-400 transition-colors group no-print">
            <i className="fas fa-arrow-left mr-3 group-hover:-translate-x-1 transition-transform"></i>
            Return to Dashboard
          </button>
        )}
        {renderContent()}
      </main>
      
      <footer className="bg-black border-t border-blue-900 px-6 py-6 text-center no-print">
        <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">
          Offline Management Environment &bull; {schoolName} SMS &bull; &copy; 2024
        </p>
      </footer>
    </div>
  );
};

export default App;
