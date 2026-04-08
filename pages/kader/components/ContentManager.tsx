
import React, { useState, useEffect } from 'react';
import { Article, UserProfile } from '../../../types';
import { api } from '../../../services/mockSupabase';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, X, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ContentManagerProps {
  user: UserProfile | null;
}

export const ContentManager: React.FC<ContentManagerProps> = ({ user }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Edukasi');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const data = await api.getArticles();
    setArticles(data);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteArticle(deleteId);
      setArticles(prev => prev.filter(a => a.id !== deleteId));
      toast.success("Artikel berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus artikel.");
    } finally {
      setDeleteId(null);
    }
  };

  const handleCreate = async () => {
    if (!title || !content || !user) {
      toast.error("Judul dan isi artikel wajib diisi");
      return;
    }
    try {
      const newArticle = await api.createArticle({
        title,
        content,
        category,
        image_url: image || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
        author_id: user.id,
        author_name: user.full_name
      });
      setArticles([newArticle, ...articles]);
      setIsCreating(false);
      setTitle('');
      setContent('');
      setImage('');
      toast.success("Artikel berhasil diterbitkan!");
    } catch (e) {
      toast.error("Gagal membuat artikel");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative bg-gray-50">
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                  <Trash2 size={24} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Hapus Artikel?</h3>
                <p className="text-sm text-gray-500 mb-6">Tindakan ini tidak dapat dibatalkan. Artikel akan dihapus permanen.</p>
                <div className="flex gap-3 w-full">
                  <Button variant="ghost" onClick={() => setDeleteId(null)} className="flex-1 !rounded-xl">Batal</Button>
                  <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors">Ya, Hapus</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pojok Wawasan</h2>
        <Button onClick={() => setIsCreating(true)} size="sm" className="shadow-lg shadow-primary-500/20 !rounded-xl">
          <Plus size={18} className="mr-1" /> Buat Baru
        </Button>
      </div>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsCreating(false)}
             />
             <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 w-full max-w-lg relative z-10 shadow-2xl h-[80vh] md:h-auto overflow-y-auto"
             >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800">Artikel Baru</h3>
                    <button onClick={() => setIsCreating(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} className="text-gray-600" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-200 outline-none font-bold text-gray-900" placeholder="Judul menarik..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategori</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none font-bold text-gray-900">
                            <option>Edukasi</option>
                            <option>Terapi</option>
                            <option>Lifestyle</option>
                            <option>Nutrisi</option>
                            <option>Psikologi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL Gambar</label>
                        <div className="flex gap-2">
                            <span className="p-3 bg-gray-100 rounded-xl text-gray-500"><ImageIcon size={18} /></span>
                            <input value={image} onChange={e => setImage(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none font-bold text-gray-900" placeholder="https://..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Konten</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-200 outline-none resize-none font-bold text-gray-900" placeholder="Isi artikel..." />
                    </div>
                    <Button onClick={handleCreate} className="w-full !rounded-xl !py-3.5 mt-2">Terbitkan</Button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {articles.map(article => (
          <div key={article.id} className="bg-white p-3 rounded-[1.5rem] shadow-sm border border-gray-100 flex gap-4 items-center group relative overflow-hidden">
            <img src={article.image_url} className="w-20 h-20 rounded-2xl object-cover bg-gray-200 flex-shrink-0" alt="Cover" />
            <div className="flex-1 min-w-0 pr-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md mb-1 inline-block">{article.category}</span>
              <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{article.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.content}</p>
            </div>
            <button onClick={(e) => initiateDelete(e, article.id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
