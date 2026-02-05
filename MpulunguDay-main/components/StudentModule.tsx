
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { supabase } from '../services/supabaseClient';

interface StudentModuleProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  isSyncing?: boolean;
}

export const StudentModule: React.FC<StudentModuleProps> = ({ students, setStudents, isSyncing }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  // History Management for Undo/Redo
  const [history, setHistory] = useState<Student[][]>([students]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isInternalChange = useRef(false);

  // Sync internal history with external students prop when changed externally (e.g. Cloud Sync)
  useEffect(() => {
    if (!isInternalChange.current) {
      setHistory([students]);
      setHistoryIndex(0);
    }
    isInternalChange.current = false;
  }, [students]);

  const updateStudentsWithHistory = (newStudents: Student[]) => {
    isInternalChange.current = true;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStudents);
    // Limit history to 20 steps for memory efficiency
    if (newHistory.length > 20) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setStudents(newStudents);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isInternalChange.current = true;
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setStudents(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isInternalChange.current = true;
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setStudents(history[nextIndex]);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    dateOfAdmission: '',
    club: '',
    guardianName: '',
    residentialAddress: '',
    contact: '',
    status: 'Active' as Student['status']
  });

  const nextId = useMemo(() => {
    if (editingStudentId) return editingStudentId;
    if (students.length === 0) return 'MDS000001';
    const numericIds = students
      .map(s => {
        const match = s.id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(n => !isNaN(n));
    const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return `MDS${String(max + 1).padStart(6, '0')}`;
  }, [students, editingStudentId]);

  const filtered = useMemo(() => {
    return students
      .filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return numB - numA; // Show newest first
      });
  }, [students, searchTerm]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isCameraActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: facingMode },
          width: { ideal: 640 }, 
          height: { ideal: 480 }
        } 
      })
      .then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(err => {
        console.error("Camera Access Denied:", err);
        alert("Could not access camera.");
        setIsCameraActive(false);
      });
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraActive, facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      // REDUCED DIMENSIONS: Optimized for 5MB LocalStorage limits
      const targetWidth = 240; 
      const targetHeight = 180;
      canvasRef.current.width = targetWidth;
      canvasRef.current.height = targetHeight;
      if (context) {
        if (facingMode === 'user') {
          context.translate(canvasRef.current.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, targetWidth, targetHeight);
        context.setTransform(1, 0, 0, 1, 0, 0);
        // HIGH COMPRESSION (0.3): Maximize capacity for student registry
        setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.3));
        setIsCameraActive(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let newStudents: Student[];
    if (editingStudentId) {
      newStudents = students.map(s => s.id === editingStudentId ? { ...formData, id: editingStudentId, photo: capturedPhoto || s.photo } as Student : s);
    } else {
      newStudents = [...students, { ...formData, id: nextId, photo: capturedPhoto || undefined }];
    }
    updateStudentsWithHistory(newStudents);
    closeForm();
  };

  const handleEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({ ...student });
    setCapturedPhoto(student.photo || null);
    setShowRegForm(true);
    setViewingStudent(null);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this record from local and cloud storage?")) return;
    
    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;

      const newStudents = students.filter(s => s.id !== id);
      updateStudentsWithHistory(newStudents);
    } catch (err: any) {
      console.error("Failed to delete from cloud:", err);
      alert("Error: Record could not be removed from cloud. Please check connection.");
    }
  };

  const handleClearAll = async () => {
    if (students.length === 0) return;
    
    try {
      const { error } = await supabase.from('students').delete().neq('id', '_CLEAR_ALL_FORCE_');
      if (error) throw error;
      
      updateStudentsWithHistory([]);
    } catch (err: any) {
      console.error("Failed to clear cloud database:", err);
      alert("Error: Registry could not be cleared from cloud.");
    }
  };

  const closeForm = () => {
    setShowRegForm(false);
    setEditingStudentId(null);
    setFormData({ name: '', class: '', gender: 'Male', dob: '', dateOfAdmission: '', club: '', guardianName: '', residentialAddress: '', contact: '', status: 'Active' });
    setCapturedPhoto(null);
    setIsCameraActive(false);
  };

  const handleDownloadTemplate = () => {
    const headers = "Full Name,Class,Gender (Male/Female/Other),DOB (YYYY-MM-DD),Admission Date (YYYY-MM-DD),Club,Guardian Name,Address,Contact\n";
    const sample = "John Doe,Grade 10A,Male,2008-05-15,2024-01-10,Chess Club,Mary Doe,123 School Rd,0977000000";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_import_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim() !== '');
      if (rows.length < 2) return alert("The CSV file is empty or missing data rows.");

      const dataRows = rows.slice(1);
      
      let currentMaxNumeric = 0;
      if (students.length > 0) {
        currentMaxNumeric = Math.max(...students.map(s => {
          const m = s.id.match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        }));
      }

      const importedStudents: Student[] = [];
      dataRows.forEach((row) => {
        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

        if (clean(columns[0]) === '') return; 

        currentMaxNumeric++;
        const newId = `MDS${String(currentMaxNumeric).padStart(6, '0')}`;

        importedStudents.push({
          id: newId,
          name: clean(columns[0]),
          class: clean(columns[1]),
          gender: (clean(columns[2]) || 'Male') as any,
          dob: clean(columns[3]),
          dateOfAdmission: clean(columns[4]) || new Date().toISOString().split('T')[0],
          club: clean(columns[5]),
          guardianName: clean(columns[6]),
          residentialAddress: clean(columns[7]),
          contact: clean(columns[8]),
          status: 'Active'
        });
      });

      if (importedStudents.length > 0) {
        updateStudentsWithHistory([...students, ...importedStudents]);
        alert(`Successfully imported ${importedStudents.length} students into the registry.`);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return alert("No records to export.");
    const headers = "ID,Name,Class,Gender,DOB,DateOfAdmission,Club,GuardianName,Address,Contact,Status\n";
    const rows = filtered.map(s => `${s.id},"${s.name}","${s.class}",${s.gender},${s.dob},${s.dateOfAdmission},"${s.club}","${s.guardianName}","${s.residentialAddress.replace(/"/g, '""')}",${s.contact},${s.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_registry_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-24">
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
        accept=".csv" 
        className="hidden" 
      />
      
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-blue-950/40 p-4 rounded-2xl border border-sky-900/30 shadow-lg no-print">
        <div className="flex items-center gap-3 self-start lg:self-center">
           <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-id-card text-white text-lg"></i></div>
           <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Student Registry</h2>
              <p className="text-[8px] font-bold text-sky-500 uppercase tracking-widest mt-1">High-Capacity Mode (Up to 2,500 students)</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px]">
            <input type="text" placeholder="Search records..." className="w-full bg-black border border-sky-900/30 rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-sky-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <i className="fas fa-search absolute right-4 top-3.5 text-slate-500 text-xs"></i>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex bg-slate-900/50 rounded-xl border border-sky-900/30 overflow-hidden">
               <button onClick={handleUndo} disabled={historyIndex === 0} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-all border-r border-sky-900/30" title="Undo"><i className="fas fa-undo-alt text-xs"></i></button>
               <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-20 transition-all" title="Redo"><i className="fas fa-redo-alt text-xs"></i></button>
            </div>
            <button onClick={() => { closeForm(); setShowRegForm(true); }} className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-plus"></i> New Student
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
              <i className="fas fa-file-import"></i> Import
            </button>
            <button onClick={handleDownloadTemplate} className="bg-blue-900/30 hover:bg-blue-900/50 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border border-sky-900/30 flex items-center justify-center gap-2">
              <i className="fas fa-file-csv"></i> Template
            </button>
            <button onClick={handleExportCSV} className="bg-blue-900/30 hover:bg-blue-900/50 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border border-sky-900/30 flex items-center justify-center gap-2">
              <i className="fas fa-download"></i> Export
            </button>
            <button onClick={handleClearAll} className="bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border border-rose-500/30 flex items-center justify-center gap-2 transition-all">
              <i className="fas fa-trash-sweep"></i> Instant Clear
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-950/20 rounded-3xl border border-sky-900/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-black/50 border-b border-sky-900/30">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Information</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">MDS Identity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Account Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-900/20">
              {filtered.map(student => (
                <tr key={student.id} className="hover:bg-sky-500/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-black border border-sky-900/30 overflow-hidden flex items-center justify-center shadow-md">
                        {student.photo ? <img src={student.photo} className="w-full h-full object-cover" alt="" /> : <i className="fas fa-user text-sky-800"></i>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white uppercase group-hover:text-sky-400 transition-colors">{student.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{student.class}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-sky-400">{student.id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                      student.status === 'Active' ? 'bg-sky-950 text-sky-400 border-sky-500/20' : 'bg-blue-900/40 text-slate-400 border-slate-500/20'
                    }`}>{student.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setViewingStudent(student)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-sky-400 hover:text-white border border-sky-900/30 transition-all"><i className="fas fa-eye text-xs"></i></button>
                      <button onClick={() => handleEdit(student)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-sky-400 hover:text-white border border-sky-900/30 transition-all"><i className="fas fa-pen text-xs"></i></button>
                      <button onClick={() => handleDelete(student.id)} className="w-9 h-9 rounded-lg bg-blue-900/20 text-rose-400 hover:text-white border border-rose-900/30 transition-all"><i className="fas fa-trash text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No student records found</p>
            </div>
          )}
        </div>
      </div>

      {showRegForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-blue-950 border border-sky-900/30 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8 border-b border-sky-900/30 flex justify-between items-center sticky top-0 bg-blue-950 z-10">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{editingStudentId ? 'Update Record' : 'Enroll Student'}</h3>
                <p className="text-[10px] text-sky-500 font-bold uppercase tracking-widest mt-1">Next Sequential ID: {nextId}</p>
              </div>
              <button onClick={closeForm} className="w-12 h-12 rounded-2xl bg-black border border-sky-900/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Legal Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" placeholder="Enter name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Class Group</label>
                    <input required value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none uppercase focus:border-sky-600 transition-all" placeholder="e.g. 12A" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Address</label>
                  <input required value={formData.residentialAddress} onChange={e => setFormData({...formData, residentialAddress: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden relative group border-2 border-sky-900/30">
                  {capturedPhoto ? (
                    <div className="relative h-full w-full">
                      <img src={capturedPhoto} className="w-full h-full object-cover" alt="Captured" />
                      <button type="button" onClick={() => setCapturedPhoto(null)} className="absolute top-4 right-4 bg-rose-600 text-white w-10 h-10 rounded-xl shadow-lg flex items-center justify-center transition-transform active:scale-90"><i className="fas fa-trash-alt"></i></button>
                    </div>
                  ) : (isCameraActive ? <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} /> : <div className="flex flex-col items-center justify-center h-full text-sky-900 space-y-4"><i className="fas fa-camera text-5xl"></i><p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-800">Registration Portrait</p></div>)}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-opacity duration-300">
                    {!isCameraActive && !capturedPhoto ? (
                      <button type="button" onClick={() => setIsCameraActive(true)} className="bg-sky-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-transform">Initialize Capture</button>
                    ) : isCameraActive && (
                      <div className="flex gap-4">
                        <button type="button" onClick={handleCapture} className="bg-emerald-600 text-white w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"><i className="fas fa-camera text-xl"></i></button>
                        <button type="button" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')} className="bg-blue-900 text-white w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"><i className="fas fa-sync-alt text-xl"></i></button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Guardian</label>
                    <input required value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Contact</label>
                    <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full bg-black border-2 border-sky-900/30 rounded-2xl px-5 py-3.5 text-sm text-white font-bold outline-none focus:border-sky-600 transition-all" />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-4 pt-8 border-t border-sky-900/30">
                <button type="button" onClick={closeForm} className="px-8 py-4 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-12 py-4 rounded-2xl text-[10px] font-black uppercase shadow-2xl transition-all active:scale-95">Commit Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-blue-950 border border-sky-900/50 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-8 py-10">
                 <div className="flex items-center gap-8 mb-8">
                    <div className="w-32 h-32 rounded-[32px] border-4 border-sky-500 bg-black overflow-hidden shadow-2xl">
                       {viewingStudent.photo ? <img src={viewingStudent.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sky-900"><i className="fas fa-user-graduate text-4xl"></i></div>}
                    </div>
                    <div>
                       <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{viewingStudent.name}</h3>
                       <p className="text-sky-500 font-black uppercase text-xs tracking-widest">{viewingStudent.id} • {viewingStudent.class}</p>
                    </div>
                 </div>
                 <button onClick={() => setViewingStudent(null)} className="w-full bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Close Profile</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
