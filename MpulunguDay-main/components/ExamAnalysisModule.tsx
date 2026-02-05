
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_GRADE_SCALES } from '../constants';
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, PieChart, Pie 
} from 'recharts';
import { Student, StudentMark, Subject, ClassInfo, Teacher, ClassAllocation, UserRole } from '../types';

interface ExamAnalysisModuleProps {
  students: Student[];
  marks: StudentMark[];
  subjects: Subject[];
  classes: ClassInfo[];
  teachers: Teacher[];
  allocations: ClassAllocation[];
  userRole: UserRole;
  userId: string;
}

type AnalysisTab = 'OVERVIEW' | 'GENDER' | 'GRADES' | 'TEACHERS' | 'AI_INSIGHTS';

export const ExamAnalysisModule: React.FC<ExamAnalysisModuleProps> = ({ 
  students, marks, subjects, classes, teachers, allocations, userRole, userId 
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('OVERVIEW');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const getGrade = (score: number) => {
    if (score === -1) return 'X';
    const scale = MOCK_GRADE_SCALES.find(g => score >= g.minMark && score <= g.maxMark && g.label !== 'X');
    return scale ? scale.label : '9';
  };

  const stats = useMemo(() => {
    const classData: Record<string, { total: number, count: number, students: Set<string> }> = {};
    const subjectData: Record<string, { total: number, count: number, passes: number }> = {};
    const genderData: Record<string, { total: number, count: number }> = { 'Male': { total: 0, count: 0 }, 'Female': { total: 0, count: 0 }, 'Other': { total: 0, count: 0 } };
    const teacherData: Record<string, { total: number, count: number, name: string }> = {};
    const gradeMatrix: Record<string, Record<string, number>> = {};

    marks.forEach(mark => {
      const student = students.find(s => s.id === mark.studentId);
      const subject = subjects.find(sub => sub.id === mark.subjectId);
      if (!student || !subject) return;

      const score = mark.score >= 0 ? mark.score : 0;
      const gradeLabel = getGrade(mark.score);

      // Class Aggregation
      if (!classData[student.class]) classData[student.class] = { total: 0, count: 0, students: new Set() };
      classData[student.class].total += score;
      classData[student.class].count++;
      classData[student.class].students.add(student.id);

      // Subject Aggregation
      if (!subjectData[subject.name]) subjectData[subject.name] = { total: 0, count: 0, passes: 0 };
      subjectData[subject.name].total += score;
      subjectData[subject.name].count++;
      if (score >= 40) subjectData[subject.name].passes++;

      // Gender Aggregation
      if (genderData[student.gender]) {
        genderData[student.gender].total += score;
        genderData[student.gender].count++;
      }

      // Grade Frequency
      if (!gradeMatrix[student.class]) gradeMatrix[student.class] = {};
      gradeMatrix[student.class][gradeLabel] = (gradeMatrix[student.class][gradeLabel] || 0) + 1;

      // Teacher Mapping
      const classInfo = classes.find(c => c.name === student.class);
      if (classInfo) {
        const allocation = allocations.find(a => a.classId === classInfo.id && a.subjectId === mark.subjectId);
        if (allocation) {
          const teacher = teachers.find(t => t.id === allocation.teacherId);
          if (teacher) {
            if (!teacherData[teacher.id]) teacherData[teacher.id] = { total: 0, count: 0, name: teacher.name };
            teacherData[teacher.id].total += score;
            teacherData[teacher.id].count++;
          }
        }
      }
    });

    return { 
      classStats: Object.entries(classData).map(([name, data]) => ({ name, avg: data.total / data.count, students: data.students.size })),
      subjectStats: Object.entries(subjectData).map(([name, data]) => ({ name, avg: data.total / data.count, passRate: (data.passes / data.count) * 100 })),
      genderStats: Object.entries(genderData).filter(([_, d]) => d.count > 0).map(([gender, data]) => ({ name: gender, avg: data.total / data.count })),
      teacherStats: Object.values(teacherData).map(t => ({ name: t.name, avg: t.total / t.count })),
      gradeMatrix 
    };
  }, [students, marks, subjects, classes, teachers, allocations]);

  useEffect(() => {
    if (activeTab === 'AI_INSIGHTS' && !aiAnalysis && !loadingAi) {
      const fetchAi = async () => {
        setLoadingAi(true);
        const insight = await getExamPerformanceAnalysis({ 
          subjects: stats.subjectStats, 
          classes: stats.classStats, 
          gender: stats.genderStats 
        });
        setAiAnalysis(insight || 'No data available for analysis.');
        setLoadingAi(false);
      };
      fetchAi();
    }
  }, [activeTab, stats, aiAnalysis, loadingAi]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Academic <span className="text-blue-500">Analytics</span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Institutional Performance Breakdown</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['OVERVIEW', 'GENDER', 'GRADES', 'TEACHERS', 'AI_INSIGHTS'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as AnalysisTab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl min-h-[500px]">
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
            <div className="h-[400px]">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center">Class Averages (%)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.classStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '12px'}} />
                  <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[400px]">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center">Subject Pass Rates (%)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.subjectStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} axisLine={false} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '12px'}} />
                  <Bar dataKey="passRate" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'GENDER' && (
          <div className="flex flex-col items-center justify-center py-12">
             <div className="h-[400px] w-full max-w-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.genderStats}
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={8}
                      dataKey="avg"
                    >
                      {stats.genderStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#000', border: 'none', borderRadius: '12px'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-8">Performance Gap Analysis</p>
          </div>
        )}

        {activeTab === 'GRADES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Class</th>
                  {MOCK_GRADE_SCALES.map(g => (
                    <th key={g.label} className="px-4 py-4 text-[10px] font-black text-white">{g.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Object.entries(stats.gradeMatrix).map(([className, grades]) => (
                  <tr key={className} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-white text-left uppercase">{className}</td>
                    {MOCK_GRADE_SCALES.map(g => (
                      <td key={g.label} className={`px-4 py-4 text-xs font-bold ${grades[g.label] ? 'text-blue-400' : 'text-slate-700'}`}>
                        {grades[g.label] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'TEACHERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.teacherStats.map((t, idx) => (
              <div key={idx} className="bg-black/20 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                 <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                    <i className="fas fa-user-tie text-2xl"></i>
                 </div>
                 <h4 className="text-sm font-black text-white uppercase mb-1">{t.name}</h4>
                 <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Efficiency Rating</p>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{width: `${t.avg}%`}}></div>
                 </div>
                 <p className="text-xl font-black text-white mt-3">{t.avg.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'AI_INSIGHTS' && (
          <div className="prose prose-invert max-w-none">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing results via Gemini Strategic Engine...</p>
              </div>
            ) : (
              <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-3xl">
                 <h3 className="text-lg font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                   <i className="fas fa-brain"></i> Strategic Assessment Summary
                 </h3>
                 <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                   {aiAnalysis}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
