
import React, { useState, useMemo } from 'react';
import { Teacher } from '../types';

interface TeacherModuleProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

export const TeacherModule: React.FC<TeacherModuleProps> = ({ teachers, setTeachers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    contact: '',
    status: 'Active' as Teacher['status']
  });

  const nextId = useMemo(() => {
    if (editingTeacherId) return editingTeacherId;
    if (teachers.length === 0) return 'T0001';
    const numericIds = teachers
      .map(t => {
        const match = t.id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(n => !isNaN(n));
    const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return `T${String(max + 1).padStart(4, '0')}`;
  }, [teachers, editingTeacherId]);

  const filtered = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacherId) {
      setTeachers(prev => prev.map(t => t.id === editingTeacherId ? { ...formData, id: editingTeacherId } : t));
    } else {
      setTeachers([{ ...formData, id: nextId }, ...teachers]);
    }
    closeForm();
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setFormData({
      name: teacher.name,
      subject: teacher.subject || '',
      email: teacher.email,
      contact: teacher.contact,
      status: teacher.status
    });
    setShowRegForm(true);
  };

  const handleDelete = (id: string) => {
    if(!confirm("Remove staff record permanently?")) return;
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const closeForm = () => {
    setShowRegForm(false);
    setEditingTeacherId(null);
    setFormData({ name: '', subject: '', email: '', contact: '', status: 'Active' });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chalkboard-teacher text-white text-sm"></i>
           </div>
           <h2 className="text-xl font-black text-white uppercase tracking-tighter">Staff Registry</h2>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input type="text" placeholder="Search Staff..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { closeForm(); setShowRegForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-black uppercase shadow-lg transition-all active:scale-95">
            + New Staff
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff Member</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(teacher => (
                <tr key={teacher.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-white uppercase">{teacher.name}</p>
                    <p className="text-[10px] text-blue-400 font-bold uppercase">{teacher.subject}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{teacher.id}</td>
                  <td className="px-6 py-4 text-xs text-slate-300 font-mono">{teacher.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleEdit(teacher)} className="text-slate-500 hover:text-blue-400"><i className="fas fa-edit text-xs"></i></button>
                      <button onClick={() => handleDelete(teacher.id)} className="text-slate-500 hover:text-rose-500"><i className="fas fa-trash-alt text-xs"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-white uppercase">{editingTeacherId ? 'Modify Staff' : 'Add Staff'}</h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Specialization</label>
                <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="text-slate-500 uppercase font-black text-xs">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2 rounded-lg font-black uppercase text-xs">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
