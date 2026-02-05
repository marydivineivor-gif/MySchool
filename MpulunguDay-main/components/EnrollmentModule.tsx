
import React, { useEffect, useState } from 'react';
import { getEnrollmentInsights } from '../services/geminiService';
import { Student } from '../types';

interface EnrollmentData {
  gradeName: string;
  sections: {
    name: string;
    male: number;
    female: number;
    total: number;
  }[];
  gradeMaleTotal: number;
  gradeFemaleTotal: number;
  gradeOverallTotal: number;
}

export const EnrollmentModule: React.FC<{ students: Student[] }> = ({ students }) => {
  const [insights, setInsights] = useState<string>('Analyzing enrollment trends...');
  const [loading, setLoading] = useState(true);

  // Grouping logic for the specific table layout
  const processEnrollment = (studentList: Student[]): EnrollmentData[] => {
    const groups: Record<string, EnrollmentData> = {};

    studentList.forEach(s => {
      const parts = s.class.split(' ');
      let grade = '';
      let section = '';

      if (parts.length >= 3) {
        grade = parts.slice(0, 2).join(' ');
        section = parts.slice(2).join(' ');
      } else {
        grade = parts[0] || 'Unassigned';
        section = parts[1] || 'General';
      }

      if (!groups[grade]) {
        groups[grade] = {
          gradeName: grade,
          sections: [],
          gradeMaleTotal: 0,
          gradeFemaleTotal: 0,
          gradeOverallTotal: 0
        };
      }

      let secObj = groups[grade].sections.find(sec => sec.name === section);
      if (!secObj) {
        secObj = { name: section, male: 0, female: 0, total: 0 };
        groups[grade].sections.push(secObj);
      }

      if (s.gender === 'Male') {
        secObj.male++;
        groups[grade].gradeMaleTotal++;
      } else if (s.gender === 'Female') {
        secObj.female++;
        groups[grade].gradeFemaleTotal++;
      }
      secObj.total++;
      groups[grade].gradeOverallTotal++;
    });

    const order = ["Grade 12", "Grade 11", "Grade 10", "Form 1", "Form 2"];
    return Object.values(groups).sort((a, b) => {
      const idxA = order.indexOf(a.gradeName);
      const idxB = order.indexOf(b.gradeName);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.gradeName.localeCompare(b.gradeName);
    });
  };

  const enrollmentData = processEnrollment(students);
  const grandTotalMale = enrollmentData.reduce((acc, g) => acc + g.gradeMaleTotal, 0);
  const grandTotalFemale = enrollmentData.reduce((acc, g) => acc + g.gradeFemaleTotal, 0);
  const grandTotalOverall = enrollmentData.reduce((acc, g) => acc + g.gradeOverallTotal, 0);

  useEffect(() => {
    const fetchInsights = async () => {
      if (students.length === 0) {
        setInsights("Register students to receive AI enrollment insights.");
        setLoading(false);
        return;
      }
      const summary = enrollmentData.map(g => ({
        grade: g.gradeName,
        total: g.gradeOverallTotal,
        genderRatio: `${g.gradeMaleTotal}/${g.gradeFemaleTotal}`
      }));
      const result = await getEnrollmentInsights(summary);
      setInsights(result || 'No insights available.');
      setLoading(false);
    };
    fetchInsights();
  }, [students.length]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-5 group hover:border-blue-500/30 transition-all">
          <div className="w-14 h-14 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-users"></i>
          </div>
          <div>
            <h3 className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Total Enrollment</h3>
            <p className="text-3xl font-black text-white">{grandTotalOverall}</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-5 group hover:border-green-500/30 transition-all">
          <div className="w-14 h-14 bg-green-600/10 rounded-xl flex items-center justify-center text-green-500 text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-venus-mars"></i>
          </div>
          <div>
            <h3 className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Gender Balance</h3>
            <p className="text-3xl font-black text-white">{grandTotalOverall > 0 ? ((grandTotalFemale/grandTotalOverall)*100).toFixed(0) : 0}% <span className="text-xs text-slate-500 font-bold tracking-normal">Female</span></p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-5 group hover:border-amber-500/30 transition-all">
          <div className="w-14 h-14 bg-amber-600/10 rounded-xl flex items-center justify-center text-amber-500 text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-chart-line"></i>
          </div>
          <div>
            <h3 className="text-slate-500 uppercase tracking-widest text-[10px] font-black">Growth Status</h3>
            <p className="text-3xl font-black text-white">{students.length > 0 ? 'Active' : 'Empty'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-slate-200">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center no-print">
           <h2 className="text-black font-black uppercase tracking-tight text-lg">Detailed Enrollment Summary Report</h2>
           <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
             <i className="fas fa-print mr-2"></i> Print Report
           </button>
        </div>
        
        <div className="overflow-x-auto p-4 md:p-8 bg-white">
          <table className="w-full border-collapse text-black font-sans min-w-[800px]">
            <thead>
              <tr>
                <th rowSpan={2} className="border-2 border-black bg-slate-100 px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest">Class</th>
                <th colSpan={3} className="border-2 border-black bg-slate-100 px-4 py-1 text-center text-[10px] font-black uppercase tracking-widest">Individual Count</th>
                <th colSpan={3} className="border-2 border-black bg-slate-100 px-4 py-1 text-center text-[10px] font-black uppercase tracking-widest">Per Grade Aggregate</th>
              </tr>
              <tr className="bg-slate-50">
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Male</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Female</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase bg-slate-100">Total</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Male</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Female</th>
                <th className="border-2 border-black px-4 py-2 text-center text-[9px] font-black uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentData.map((grade) => (
                <React.Fragment key={grade.gradeName}>
                  {grade.sections.map((section, idx) => (
                    <tr key={`${grade.gradeName}-${section.name}`} className="hover:bg-slate-50 transition-colors">
                      <td className="border-2 border-black px-4 py-2.5 font-black uppercase text-[11px] tracking-tighter">
                        {grade.gradeName} {section.name}
                      </td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-bold text-xs">{section.male}</td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-bold text-xs">{section.female}</td>
                      <td className="border-2 border-black px-4 py-2.5 text-center font-black text-xs bg-slate-50/50">{section.total}</td>
                      {idx === 0 && (
                        <>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-lg bg-white align-middle">
                            {grade.gradeMaleTotal}
                          </td>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-lg bg-white align-middle">
                            {grade.gradeFemaleTotal}
                          </td>
                          <td rowSpan={grade.sections.length} className="border-2 border-black px-4 py-2.5 text-center font-black text-5xl bg-slate-50/30 align-middle tracking-tighter">
                            {grade.gradeOverallTotal}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  <tr className="h-4 bg-slate-200/50 no-print">
                    <td colSpan={7} className="border-2 border-black"></td>
                  </tr>
                </React.Fragment>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="border-2 border-black py-20 text-center text-slate-400 uppercase font-black tracking-widest text-xs">No Enrollment Data Available</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100">
                <td className="border-2 border-black px-4 py-4 text-left font-black text-2xl uppercase tracking-widest">Total</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-3xl">{grandTotalMale}</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-3xl">{grandTotalFemale}</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-5xl tracking-tighter bg-slate-200">{grandTotalOverall}</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-xl bg-slate-50">{grandTotalMale}</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-xl bg-slate-50">{grandTotalFemale}</td>
                <td className="border-2 border-black px-4 py-4 text-center font-black text-xl bg-slate-50">{grandTotalOverall}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-2xl border border-blue-500/20 shadow-2xl no-print">
        <h3 className="text-xl font-black text-white mb-6 flex items-center uppercase tracking-tight">
          <i className="fas fa-brain text-blue-400 mr-3"></i> AI Administrative Intelligence
        </h3>
        {loading ? (
          <div className="flex items-center gap-4 py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Processing enrollment patterns...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Executive Summary</p>
                <div className="prose prose-invert text-slate-300 text-sm leading-relaxed font-medium">
                  {insights.split('\n').map((line, i) => (
                    <p key={i} className="mb-3">{line}</p>
                  ))}
                </div>
             </div>
             <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-xs font-black text-slate-500 uppercase">System Recommendation</span>
                   <i className="fas fa-lightbulb text-amber-500"></i>
                </div>
                <p className="text-white text-sm font-bold italic leading-relaxed">
                  "Based on current trends, it is recommended to maintain class sizes effectively. Ensure that data registration is complete to refine these automated insights further."
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
