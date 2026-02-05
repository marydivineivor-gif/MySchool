
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  ModuleType, Student, Teacher, Subject, Department, ClassInfo, 
  ClassAllocation, ExamSession, StudentMark, OnlineExam, 
  ExamSubmission, GradeScale, AuthUser, Resource, Announcement, 
  AttendanceRecord, PeriodAllocation, PeriodSession, PeriodAttendance, 
  FeeStructure, FeePayment 
} from './types';
import { MODULES, MOCK_GRADE_SCALES } from './constants';
import { StudentModule } from './MpulunguDay-main/components/StudentModule';
import { TeacherModule } from './MpulunguDay-main/components/TeacherModule';
import { EnrollmentModule } from './MpulunguDay-main/components/EnrollmentModule';
import { TransferFormModule } from './MpulunguDay-main/components/TransferFormModule';
import { ExamAnalysisModule } from './MpulunguDay-main/components/ExamAnalysisModule';
import { ExamManagementModule } from './MpulunguDay-main/components/ExamManagementModule';
import { AcademicsModule } from './MpulunguDay-main/components/AcademicsModule';
import { AdmissionReceiptModule } from './MpulunguDay-main/components/AdmissionReceiptModule';
import { SettingsModule } from './MpulunguDay-main/components/SettingsModule';
import { RegisterModule } from './MpulunguDay-main/components/RegisterModule';
import { ClassModule } from './MpulunguDay-main/components/ClassModule';
import { AttendanceModule } from './MpulunguDay-main/components/AttendanceModule';
import { OnlineExamModule } from './MpulunguDay-main/components/OnlineExamModule';
import { LoginModule } from './MpulunguDay-main/components/LoginModule';
import { StudyingResourcesModule } from './MpulunguDay-main/components/StudyingResourcesModule';
import { AnnouncementModule } from './MpulunguDay-main/components/AnnouncementModule';
import { PeriodmeterModule } from './MpulunguDay-main/components/PeriodmeterModule';
import { FeesModule } from './components/FeesModule';
import { supabase } from './MpulunguDay-main/services/supabaseClient';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.HOME);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => 
    JSON.parse(localStorage.getItem('sms_auth_user') || 'null')
  );
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  // Institutional Branding
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('sms_schoolLogo') || '');
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('sms_schoolName') || 'IvorSmartSchools Academy');
  const [schoolMotto, setSchoolMotto] = useState(() => localStorage.getItem('sms_schoolMotto') || 'Smart Learning for a Smart Future');
  const [schoolContact, setSchoolContact] = useState(() => localStorage.getItem('sms_schoolContact') || '+260 977 134049');

  // School Data States
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
  const [fees, setFees] = useState<FeeStructure[]>(() => JSON.parse(localStorage.getItem('sms_fee_structures') || '[]'));
  const [payments, setPayments] = useState<FeePayment[]>(() => JSON.parse(localStorage.getItem('sms_fee_payments') || '[]'));

  // Cloud Fetcher
  const fetchCloudData = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const results = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('teachers').select('*'),
        supabase.from('subjects').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('fee_structures').select('*'),
        supabase.from('fee_payments').select('*'),
        supabase.from('announcements').select('*').order('createdAt', { ascending: false }),
        supabase.from('online_exams').select('*'),
        supabase.from('exam_submissions').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('student_marks').select('*'),
        supabase.from('exam_sessions').select('*'),
        supabase.from('grade_scales').select('*'),
        supabase.from('period_allocations').select('*'),
        supabase.from('period_sessions').select('*'),
        supabase.from('period_attendance').select('*'),
        supabase.from('settings').select('*') 
      ]);

      const errors = results.filter(r => r.error).map(r => r.error?.message);
      if (errors.length > 0) throw new Error(errors[0]);

      if (results[0].data) setStudents(results[0].data);
      if (results[1].data) setTeachers(results[1].data);
      if (results[2].data) setSubjects(results[2].data);
      if (results[3].data) setClasses(results[3].data);
      if (results[4].data) setFees(results[4].data);
      if (results[5].data) setPayments(results[5].data);
      if (results[6].data) setAnnouncements(results[6].data);
      if (results[7].data) setOnlineExams(results[7].data);
      if (results[8].data) setSubmissions(results[8].data);
      if (results[9].data) setAttendance(results[9].data);
      if (results[10].data) setMarks(results[10].data);
      if (results[11].data) setSessions(results[11].data);
      if (results[12].data && results[12].data.length > 0) setGradeScales(results[12].data);
      if (results[13].data) setPeriodAllocations(results[13].data);
      if (results[14].data) setPeriodSessions(results[14].data);
      if (results[15].data) setPeriodAttendance(results[15].data);
      
      // Handle Settings Data
      if (results[16].data && results[16].data.length > 0) {
        const cloudSettings = results[16].data as { key: string, value: string }[];
        cloudSettings.forEach(s => {
          if (s.key === 'schoolName') setSchoolName(s.value);
          if (s.key === 'schoolMotto') setSchoolMotto(s.value);
          if (s.key === 'schoolContact') setSchoolContact(s.value);
          if (s.key === 'schoolLogo') setSchoolLogo(s.value);
        });
      }

      setLastSynced(new Date().toLocaleTimeString());
      isFirstLoad.current = false;
    } catch (error: any) {
      console.error("Cloud Sync Failed:", error);
      setSyncError(error.message || "Failed to reach cloud database.");
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 300000);
    return () => clearInterval(interval);
  }, [fetchCloudData]);

  // Dedicated Save Settings Function
  const handleUpdateSettings = async (name: string, motto: string, contact: string, logo: string) => {
    setSchoolName(name);
    setSchoolMotto(motto);
    setSchoolContact(contact);
    setSchoolLogo(logo);
    
    localStorage.setItem('sms_schoolName', name);
    localStorage.setItem('sms_schoolMotto', motto);
    localStorage.setItem('sms_schoolContact', contact);
    localStorage.setItem('sms_schoolLogo', logo);

    try {
      const { error } = await supabase.from('settings').upsert([
        { key: 'schoolName', value: name },
        { key: 'schoolMotto', value: motto },
        { key: 'schoolContact', value: contact },
        { key: 'schoolLogo', value: logo }
      ]);
      if (error) throw error;
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Manual branding sync failed:", e);
      setSyncError("Failed to save settings to cloud.");
    }
  };

  // Push to Supabase Helper
  const syncToCloud = useCallback(async (table: string, data: any[]) => {
    if (isFirstLoad.current || !data || data.length === 0) return;
    try {
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) throw error;
    } catch (e) {
      console.error(`Failed to sync ${table}:`, e);
    }
  }, []);

  // Safe LocalStorage setter with Quota Handling
  const safeSetLocal = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.warn('LocalStorage limit reached. Prioritizing cloud sync.');
        setSyncError("Storage Full: Photos disabled locally.");
      }
    }
  };

  // Persistence hooks - Sync to LocalStorage + Push to Cloud
  useEffect(() => { safeSetLocal('sms_students', JSON.stringify(students)); syncToCloud('students', students); }, [students, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_teachers', JSON.stringify(teachers)); syncToCloud('teachers', teachers); }, [teachers, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_subjects', JSON.stringify(subjects)); syncToCloud('subjects', subjects); }, [subjects, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_classes', JSON.stringify(classes)); syncToCloud('classes', classes); }, [classes, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_announcements', JSON.stringify(announcements)); syncToCloud('announcements', announcements); }, [announcements, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_fee_structures', JSON.stringify(fees)); syncToCloud('fee_structures', fees); }, [fees, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_fee_payments', JSON.stringify(payments)); syncToCloud('fee_payments', payments); }, [payments, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_onlineExams', JSON.stringify(onlineExams)); syncToCloud('online_exams', onlineExams); }, [onlineExams, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_submissions', JSON.stringify(submissions)); syncToCloud('exam_submissions', submissions); }, [submissions, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_attendance', JSON.stringify(attendance)); syncToCloud('attendance', attendance); }, [attendance, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_marks', JSON.stringify(marks)); syncToCloud('student_marks', marks); }, [marks, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_sessions', JSON.stringify(sessions)); syncToCloud('exam_sessions', sessions); }, [sessions, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_gradeScales', JSON.stringify(gradeScales)); syncToCloud('grade_scales', gradeScales); }, [gradeScales, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_period_allocations', JSON.stringify(periodAllocations)); syncToCloud('period_allocations', periodAllocations); }, [periodAllocations, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_period_sessions', JSON.stringify(periodSessions)); syncToCloud('period_sessions', periodSessions); }, [periodSessions, syncToCloud]);
  useEffect(() => { safeSetLocal('sms_period_attendance', JSON.stringify(periodAttendance)); syncToCloud('period_attendance', periodAttendance); }, [periodAttendance, syncToCloud]);

  const handleLogout = () => {
    setAuthUser(null);
    setActiveModule(ModuleType.HOME);
    localStorage.removeItem('sms_auth_user');
  };

  const getVisibleModules = () => {
    if (!authUser) return [];
    if (authUser.role === 'ADMIN') return MODULES;
    if (authUser.role === 'TEACHER') return MODULES.filter(m => [ModuleType.EXAMS, ModuleType.RESOURCES, ModuleType.ATTENDANCE, ModuleType.REGISTER, ModuleType.CLASS, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    if (authUser.role === 'STUDENT') return MODULES.filter(m => [ModuleType.EXAMS, ModuleType.FEES, ModuleType.RESOURCES, ModuleType.ATTENDANCE, ModuleType.ANNOUNCEMENTS, ModuleType.PERIODMETER].includes(m.id));
    if (authUser.role === 'ATTENDANCE_OFFICER') return MODULES.filter(m => [ModuleType.ATTENDANCE, ModuleType.PERIODMETER, ModuleType.ANNOUNCEMENTS].includes(m.id));
    return [];
  };

  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', val: students.length, icon: 'fa-user-graduate', color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Staff Count', val: teachers.length, icon: 'fa-chalkboard-teacher', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Revenue (ZMW)', val: `K${totalRevenue.toLocaleString()}`, icon: 'fa-wallet', color: 'text-amber-400', bg: 'bg-amber-400/10', roles: ['ADMIN'] },
          { label: 'Live Assessments', val: onlineExams.length, icon: 'fa-file-invoice', color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].filter(stat => !stat.roles || stat.roles.includes(authUser?.role || '')).map((stat, i) => (
          <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-[32px] shadow-xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white tracking-tighter">{stat.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shadow-inner`}>
              <i className={`fas ${stat.icon}`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Management Modules</h3>
              <div className="h-px flex-1 mx-6 bg-white/5"></div>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {getVisibleModules().map((module) => (
                <button 
                  key={module.id} 
                  onClick={() => setActiveModule(module.id)} 
                  className="bg-slate-900 border border-white/5 h-28 rounded-[24px] flex flex-col items-center justify-center gap-3 group hover:bg-blue-600 transition-all shadow-lg relative overflow-hidden active:scale-95"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 group-hover:bg-white/20"></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest text-center px-4 leading-tight group-hover:scale-105 transition-transform">
                    {module.label}
                  </span>
                </button>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4">
           <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Official Feed</h3>
           </div>
           <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-6 shadow-2xl space-y-4 min-h-[300px]">
              {announcements.slice(0, 4).map(ann => (
                <div key={ann.id} className="p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all cursor-default">
                   <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase tracking-widest ${ann.targetType === 'GLOBAL' ? 'text-blue-400' : 'text-amber-500'}`}>{ann.targetType}</span>
                      <span className="text-[8px] font-mono text-slate-600">{new Date(ann.createdAt).toLocaleDateString()}</span>
                   </div>
                   <h4 className="text-xs font-bold text-white uppercase line-clamp-1 group-hover:text-blue-400">{ann.title}</h4>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <i className="fas fa-bullhorn text-4xl mb-3 opacity-20"></i>
                  <p className="text-[10px] uppercase font-black tracking-widest">No recent broadcasts</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!authUser) return null;
    const commonProps = { userRole: authUser.role, userId: authUser.id };
    
    switch (activeModule) {
      case ModuleType.HOME: return renderDashboard();
      case ModuleType.STUDENTS: return <StudentModule students={students} setStudents={setStudents} />;
      case ModuleType.TEACHERS: return <TeacherModule teachers={teachers} setTeachers={setTeachers} />;
      case ModuleType.FEES: return <FeesModule students={students} classes={classes} fees={fees} setFees={setFees} payments={payments} setPayments={setPayments} {...commonProps} />;
      case ModuleType.EXAMS: return <ExamManagementModule students={students} setStudents={setStudents} sessions={sessions} setSessions={setSessions} marks={marks} setMarks={setMarks} subjects={subjects} classes={classes} allocations={allocations} schoolName={schoolName} schoolLogo={schoolLogo} gradeScales={gradeScales} setGradeScales={setGradeScales} {...commonProps} />;
      case ModuleType.RESOURCES: return <StudyingResourcesModule resources={resources} setResources={setResources} subjects={subjects} classes={classes} teachers={teachers} students={students} {...commonProps} />;
      case ModuleType.ANNOUNCEMENTS: return <AnnouncementModule announcements={announcements} setAnnouncements={setAnnouncements} userName={authUser.name} classes={classes} allocations={allocations} students={students} {...commonProps} />;
      case ModuleType.ENROLLMENT: return <EnrollmentModule students={students} />;
      case ModuleType.TRANSFER_FORM: return <TransferFormModule students={students} classes={classes} subjects={subjects} schoolName={schoolName} marks={marks} sessions={sessions} gradeScales={gradeScales} />;
      case ModuleType.EXAM_ANALYSIS: return <ExamAnalysisModule students={students} marks={marks} subjects={subjects} classes={classes} teachers={teachers} allocations={allocations} {...commonProps} />;
      case ModuleType.PAYMENT: return <AcademicsModule departments={departments} setDepartments={setDepartments} subjects={subjects} setSubjects={setSubjects} classes={classes} setClasses={setClasses} allocations={allocations} setAllocations={setAllocations} teachers={teachers} />;
      case ModuleType.REGISTER: return <RegisterModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.CLASS: return <ClassModule students={students} classes={classes} schoolName={schoolName} schoolLogo={schoolLogo} />;
      case ModuleType.ATTENDANCE: return <AttendanceModule students={students} classes={classes} schoolName={schoolName} attendance={attendance} setAttendance={setAttendance} {...commonProps} />;
      case ModuleType.ADMISSION_RECEIPT: return <AdmissionReceiptModule students={students} classes={classes} subjects={subjects} schoolLogo={schoolLogo} schoolName={schoolName} schoolMotto={schoolMotto} schoolContact={schoolContact} {...commonProps} />;
      case ModuleType.EMIS: return <OnlineExamModule exams={onlineExams} setExams={setOnlineExams} submissions={submissions} setSubmissions={setSubmissions} subjects={subjects} classes={classes} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} {...commonProps} />;
      case ModuleType.SETTINGS: return <SettingsModule schoolLogo={schoolLogo} schoolName={schoolName} schoolMotto={schoolMotto} schoolContact={schoolContact} onSaveSettings={handleUpdateSettings} />;
      case ModuleType.PERIODMETER: return <PeriodmeterModule allocations={periodAllocations} setAllocations={setPeriodAllocations} sessions={periodSessions} setSessions={setPeriodSessions} attendance={periodAttendance} setAttendance={setPeriodAttendance} teachers={teachers} classes={classes} subjects={subjects} students={students} schoolName={schoolName} {...commonProps} />;
      default: return null;
    }
  };

  if (!authUser) return <LoginModule onLogin={setAuthUser} students={students} teachers={teachers} schoolName={schoolName} schoolLogo={schoolLogo} />;

  return (
    <div className="min-h-screen flex flex-col bg-black selection:bg-blue-600/30">
      <header className="bg-slate-900 border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveModule(ModuleType.HOME)}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg hover:rotate-12 transition-transform">
            <i className="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-none">{schoolName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : (syncError ? 'bg-rose-500' : 'bg-emerald-500')}`}></div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${isSyncing ? 'text-amber-500' : (syncError ? 'text-rose-500' : 'text-emerald-500')}`}>
                  {isSyncing ? 'Syncing...' : (syncError ? 'Sync Notice' : `Cloud Synced: ${lastSynced || 'Never'}`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
           <div className="flex flex-col text-right">
              <p className="text-[10px] font-black text-white leading-none uppercase">{authUser.name}</p>
              <p className="text-[8px] font-bold text-blue-400 leading-none uppercase mt-1 tracking-widest">{authUser.role.replace('_', ' ')}</p>
           </div>
           <div className="h-6 w-px bg-white/10 mx-1"></div>
           <button onClick={handleLogout} className="w-8 h-8 rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all flex items-center justify-center" title="Sign Out">
              <i className="fas fa-power-off text-xs"></i>
           </button>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-8">
        {activeModule !== ModuleType.HOME && (
          <div className="flex justify-between items-center mb-6 no-print">
            <button onClick={() => setActiveModule(ModuleType.HOME)} className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-colors group">
              <i className="fas fa-arrow-left mr-3 group-hover:-translate-x-1 transition-transform"></i> Return to Dashboard
            </button>
            <div className="flex gap-2">
              {syncError && <span className="bg-rose-500/10 text-rose-500 border border-rose-500/20 px-3 py-1 rounded-lg text-[8px] font-black uppercase flex items-center">{syncError}</span>}
              <button onClick={fetchCloudData} className="flex items-center text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                <i className={`fas fa-sync-alt mr-2 ${isSyncing ? 'animate-spin text-blue-500' : ''}`}></i> Cloud Fetch
              </button>
            </div>
          </div>
        )}
        {renderContent()}
      </main>

      <footer className="bg-black/50 py-10 text-center no-print">
         <p className="text-slate-700 text-[9px] font-bold uppercase tracking-[0.4em]">&copy; 2024 IvorSmartSchools Management System &bull; Version 3.2 Optimized</p>
      </footer>
    </div>
  );
};

export default App;
