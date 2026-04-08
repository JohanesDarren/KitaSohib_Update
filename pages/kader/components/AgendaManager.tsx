
import React, { useState, useEffect } from 'react';
import { Agenda, UserProfile } from '../../../types';
import { api } from '../../../services/mockSupabase';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, X, Calendar, MapPin, Globe, Trash2, Clock, AlignLeft, AlertCircle } from 'lucide-react';

interface AgendaManagerProps {
  user: UserProfile | null;
}

export const AgendaManager: React.FC<AgendaManagerProps> = ({ user }) => {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    type: 'Online' as 'Online' | 'Offline'
  });

  const todayDate = new Date().toISOString().split('T')[0];

  const isTimeInPast = () => {
    if (!formData.date || !formData.time) return false;
    if (formData.date === todayDate) {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return formData.time < currentHM;
    }
    return false;
  };

  useEffect(() => {
    loadAgendas();
  }, []);

  const loadAgendas = async () => {
    const data = await api.getAgendas();
    setAgendas(data);
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.date || !formData.time || !user) {
      toast.error("Mohon lengkapi judul, tanggal, dan waktu.");
      return;
    }

    if (isTimeInPast()) {
      toast.error("Waktu kegiatan tidak boleh di masa lalu.");
      return;
    }

    try {
      await api.createAgenda({
        ...formData,
        author_kader_id: user.id
      });
      loadAgendas();
      setIsCreating(false);
      setFormData({ title: '', date: '', time: '', location: '', description: '', type: 'Online' });
      toast.success("Agenda baru berhasil diterbitkan!");
    } catch (e) {
      toast.error("Gagal membuat agenda.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteAgenda(deleteId);
      loadAgendas();
      setDeleteId(null);
      toast.success("Agenda telah dihapus.");
    } catch (e) {
      toast.error("Gagal menghapus agenda.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative bg-gray-50 no-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Agenda Komunitas</h2>
          <p className="text-sm text-gray-500 font-medium">Kelola kegiatan bersama remaja Sukasari.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm" className="shadow-lg shadow-primary-500/20 !rounded-xl">
          <Plus size={18} className="mr-1" /> Tambah Agenda
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agendas.map(agenda => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            key={agenda.id} 
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col group relative overflow-hidden"
          >
            <div className={`w-12 h-12 mb-4 rounded-2xl flex items-center justify-center ${agenda.type === 'Online' ? 'bg-primary-50 text-primary-500' : 'bg-amber-50 text-amber-500'}`}>
              {agenda.type === 'Online' ? <Globe size={24}/> : <MapPin size={24}/>}
            </div>
            <h3 className="font-black text-slate-800 mb-2 truncate">{agenda.title}</h3>
            <div className="space-y-2 mb-6 flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12}/> {agenda.date}
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={12}/> {agenda.time}
              </p>
              <p className="text-xs font-medium text-slate-500 line-clamp-2 mt-2">{agenda.description}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${agenda.type === 'Online' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
                {agenda.type}
              </span>
              <button 
                onClick={() => setDeleteId(agenda.id)}
                className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl text-slate-800">Buat Agenda Baru</h3>
                <button onClick={() => setIsCreating(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all"><X size={20}/></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Kegiatan</label>
                  <input 
                    className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary-500/20" 
                    placeholder="Nama kegiatan..." 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                    <input 
                      type="date"
                      min={todayDate}
                      className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary-500/20" 
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Waktu</label>
                    <input 
                      type="time"
                      className={`w-full bg-slate-50 border-none px-5 py-4 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 ${isTimeInPast() ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-primary-500/20'}`} 
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                    {isTimeInPast() && (
                      <p className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Waktu tidak boleh di masa lalu
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe Kegiatan</label>
                  <div className="flex gap-2">
                    {['Online', 'Offline'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setFormData({...formData, type: t as any})}
                        className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${formData.type === t ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {formData.type === 'Online' ? 'Link Meeting (Zoom/Meet)' : 'Lokasi Kegiatan'}
                  </label>
                  <input 
                    className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl text-gray-900 font-bold outline-none focus:ring-2 focus:ring-primary-500/20" 
                    placeholder={formData.type === 'Online' ? 'Masukkan tautan https://...' : 'Nama gedung atau alamat...'} 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                  <textarea 
                    className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl text-gray-900 font-medium outline-none resize-none h-24 focus:ring-2 focus:ring-primary-500/20" 
                    placeholder="Apa yang akan dilakukan..." 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button 
                  onClick={handleCreate} 
                  disabled={isTimeInPast()}
                  className={`w-full !rounded-2xl !py-5 mt-4 ${isTimeInPast() ? 'opacity-50 grayscale' : ''}`}
                >
                  Terbitkan Agenda 🚀
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-sm shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="font-black text-xl text-slate-800 mb-2">Hapus Agenda?</h3>
              <p className="text-sm text-slate-500 mb-8 font-medium">Kegiatan ini akan dihapus dari beranda remaja. Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-xl">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20">Ya, Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
