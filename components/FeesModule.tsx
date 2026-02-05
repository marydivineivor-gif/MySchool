
import React, { useState, useMemo } from 'react';
import { FeeStructure, FeePayment, Student, UserRole, ClassInfo } from '../types';

interface FeesModuleProps {
  students: Student[];
  classes: ClassInfo[];
  fees: FeeStructure[];
  setFees: React.Dispatch<React.SetStateAction<FeeStructure[]>>;
  payments: FeePayment[];
  setPayments: React.Dispatch<React.SetStateAction<FeePayment[]>>;
  userRole: UserRole;
  userId: string;
}

type Tab = 'PAYMENTS' | 'STRUCTURE' | 'REPORTS' | 'STUDENT_PORTAL';

export const FeesModule: React.FC<FeesModuleProps> = ({
  students, classes, fees, setFees, payments, setPayments, userRole, userId
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(userRole === 'STUDENT' ? 'STUDENT_PORTAL' : 'PAYMENTS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [paymentForm, setPaymentForm] = useState<Partial<FeePayment>>({
    amount: 0,
    paymentMethod: 'Cash',
    term: 'Term 1',
    year: '2024',
    note: ''
  });

  const [structureForm, setStructureForm] = useState<Partial<FeeStructure>>({
    className: '',
    tuitionFee: 0,
    developmentFee: 0,
    examFee: 0,
    otherFees: 0,
    term: 'Term 1',
    year: '2024'
  });

  const filteredStudents = useMemo(() => 
    students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    ), [students, searchTerm]);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || (paymentForm.amount || 0) <= 0) return;

    const newPayment: FeePayment = {
      id: `PAY-${Date.now()}`,
      studentId: selectedStudentId,
      amount: paymentForm.amount || 0,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentForm.paymentMethod as any,
      receiptNumber: `REC-${Math.floor(Math.random() * 1000000)}`,
      term: paymentForm.term || 'Term 1',
      year: paymentForm.year || '2024',
      recordedBy: userId,
      note: paymentForm.note
    };

    setPayments(prev => [newPayment, ...prev]);
    setShowPaymentModal(false);
    setPaymentForm({ amount: 0, paymentMethod: 'Cash', term: 'Term 1', year: '2024', note: '' });
  };

  const handleAddStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureForm.className) return;

    const newStruct: FeeStructure = {
      id: `FS-${Date.now()}`,
      className: structureForm.className,
      tuitionFee: structureForm.tuitionFee || 0,
      developmentFee: structureForm.developmentFee || 0,
      examFee: structureForm.examFee || 0,
      otherFees: structureForm.otherFees || 0,
      term: structureForm.term || 'Term 1',
      year: structureForm.year || '2024'
    };

    setFees(prev => [newStruct, ...prev]);
    setStructureForm({ className: '', tuitionFee: 0, developmentFee: 0, examFee: 0, otherFees: 0, term: 'Term 1', year: '2024' });
  };

  const getStudentFinancials = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    const classStruct = fees.find(f => f.className === student?.class);
    const studentPayments = payments.filter(p => p.studentId === studentId);
    
    const totalExpected = classStruct ? (classStruct.tuitionFee + classStruct.developmentFee + classStruct.examFee + classStruct.otherFees) : 0;
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalExpected - totalPaid;
    const progress = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

    return { totalExpected, totalPaid, balance, progress, payments: studentPayments };
  };

  const renderPayments = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Collection Register</h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Institutional Cashflow Tracking</p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
             <input 
               type="text" 
               placeholder="Search student..." 
               className="w-full bg-black border border-slate-800 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:ring-1 focus:ring-blue-600"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
             <i className="fas fa-search absolute right-4 top-3.5 text-slate-600"></i>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(s => {
          const stats = getStudentFinancials(s.id);
          return (
            <div key={s.id} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] shadow-xl hover:border-blue-600/30 transition-all group relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-white font-black uppercase text-sm">{s.name}</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{s.id} • {s.class}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${stats.balance <= 0 ? 'bg-emerald-600/10 text-emerald-400' : 'bg-amber-600/10 text-amber-400'}`}>
                    {stats.balance <= 0 ? 'Fully Paid' : 'Balance Due'}
                  </span>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-600 uppercase">Settled Amount</span>
                    <span className="text-xl font-black text-white">K {stats.totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${stats.progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, stats.progress)}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-500">Balance</span>
                    <span className={stats.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}>K {stats.balance.toLocaleString()}</span>
                  </div>
               </div>

               <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-end">
                  <button 
                    onClick={() => { setSelectedStudentId(s.id); setShowPaymentModal(true); }}
                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400"
                  >
                    View History <i className="fas fa-chevron-right ml-1"></i>
                  </button>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStructure = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-1">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4">Define Fee Policy</h3>
          <form onSubmit={handleAddStructure} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Target Class Stream</label>
              <select 
                required 
                value={structureForm.className} 
                onChange={e => setStructureForm({...structureForm, className: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-600 font-bold"
              >
                <option value="">Select Stream...</option>
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Tuition (K)</label>
                <input type="number" value={structureForm.tuitionFee} onChange={e => setStructureForm({...structureForm, tuitionFee: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Development (K)</label>
                <input type="number" value={structureForm.developmentFee} onChange={e => setStructureForm({...structureForm, developmentFee: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Exam (K)</label>
                <input type="number" value={structureForm.examFee} onChange={e => setStructureForm({...structureForm, examFee: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">Others (K)</label>
                <input type="number" value={structureForm.otherFees} onChange={e => setStructureForm({...structureForm, otherFees: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all">
              Save Billing Structure
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden">
           <table className="w-full text-left">
              <thead className="bg-slate-950 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Class Stream</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Tuition</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Total Bill</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {fees.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/20">
                    <td className="px-6 py-4 text-xs font-black text-white uppercase">{f.className}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">K {f.tuitionFee}</td>
                    <td className="px-6 py-4 text-xs text-blue-400 font-black">K {f.tuitionFee + f.developmentFee + f.examFee + f.otherFees}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setFees(fees.filter(fi => fi.id !== f.id))} className="text-slate-700 hover:text-rose-500"><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                ))}
                {fees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-600 text-xs font-black uppercase tracking-widest">No structures defined</td>
                  </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );

  const renderStudentPortal = () => {
    const stats = getStudentFinancials(userId);
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
         <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 blur-[100px]"></div>
            
            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
               <svg className="w-full h-full -rotate-90">
                  <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-slate-950" />
                  <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray={540} strokeDashoffset={540 - (Math.min(100, stats.progress) / 100) * 540} className="text-blue-500 transition-all duration-1000" strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-4xl font-black text-white">{stats.progress.toFixed(0)}%</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Paid</p>
               </div>
            </div>

            <div className="flex-1 space-y-6 relative z-10">
               <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Financial Statement</h3>
                  <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Official Student Ledger Overview</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                     <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Bill</p>
                     <p className="text-lg font-black text-white">K {stats.totalExpected.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                     <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Outstanding</p>
                     <p className={`text-lg font-black ${stats.balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>K {stats.balance.toLocaleString()}</p>
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
               <h4 className="text-sm font-black text-white uppercase tracking-widest">Transaction History</h4>
               <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-all">
                  Print Statement
               </button>
            </div>
            <div className="p-2">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-600 uppercase border-b border-slate-800">
                      <th className="p-6">Date</th>
                      <th className="p-6">Receipt #</th>
                      <th className="p-6">Method</th>
                      <th className="p-6 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {stats.payments.map(p => (
                      <tr key={p.id} className="text-xs font-bold text-slate-400 hover:bg-slate-800/20">
                        <td className="p-6">{p.date}</td>
                        <td className="p-6 text-white font-mono">{p.receiptNumber}</td>
                        <td className="p-6 font-black uppercase text-[10px]">{p.paymentMethod}</td>
                        <td className="p-6 text-right text-emerald-500">+ K {p.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    {stats.payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-700 text-[10px] font-black uppercase">No transactions detected in your account</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4 no-print">
        {[
          { id: 'PAYMENTS', label: 'Student Ledger', icon: 'fa-file-invoice-dollar', roles: ['ADMIN'] },
          { id: 'STRUCTURE', label: 'Fee Settings', icon: 'fa-cog', roles: ['ADMIN'] },
          { id: 'STUDENT_PORTAL', label: 'My Statement', icon: 'fa-wallet', roles: ['STUDENT'] }
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
        {activeTab === 'PAYMENTS' && renderPayments()}
        {activeTab === 'STRUCTURE' && renderStructure()}
        {activeTab === 'STUDENT_PORTAL' && renderStudentPortal()}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Record Transaction</h3>
                    <p className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-1">Institutional Revenue Receipt</p>
                 </div>
                 <button onClick={() => setShowPaymentModal(false)} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                 </button>
              </div>

              <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Select Recipient Student</label>
                    <select 
                      required 
                      value={selectedStudentId} 
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none"
                    >
                      <option value="">Choose Student...</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Amount (ZMW)</label>
                       <input type="number" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Payment Method</label>
                       <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white font-bold outline-none">
                          <option>Cash</option>
                          <option>Bank Transfer</option>
                          <option>Mobile Money</option>
                       </select>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Note / Ref (Optional)</label>
                    <textarea value={paymentForm.note} onChange={e => setPaymentForm({...paymentForm, note: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white h-24 resize-none" placeholder="e.g. Uniform balance..." />
                 </div>
                 <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl transition-all">
                    Finalize & Generate Receipt
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
