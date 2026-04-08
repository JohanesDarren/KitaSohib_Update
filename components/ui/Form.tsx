
import React, { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ElementType;
}

export const Input: React.FC<InputProps> = ({ label, icon: Icon, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-primary-600/80 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-300 group-focus-within:text-primary-500 transition-colors">
          <Icon size={18} />
        </div>
      )}
      <input 
        className={`w-full bg-white/60 border border-primary-100 rounded-2xl ${Icon ? 'pl-11' : 'pl-5'} pr-5 py-4 text-sm font-bold text-slate-800 placeholder:text-primary-300/80 outline-none focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-100 transition-all shadow-sm ${className}`}
        {...props}
      />
    </div>
  </div>
);

export const SearchInput: React.FC<InputProps> = (props) => (
  <Input icon={Search} {...props} className={`rounded-[1.5rem] bg-primary-50/50 hover:bg-white/80 focus:bg-white ${props.className}`} />
);

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-primary-600/80 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full bg-white/60 border border-primary-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-100 transition-all appearance-none cursor-pointer shadow-sm ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1L5 5L9 1" />
        </svg>
      </div>
    </div>
  </div>
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-[10px] font-black text-primary-600/80 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
    <textarea 
      className={`w-full bg-white/60 border border-primary-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-800 placeholder:text-primary-300/80 outline-none focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-100 transition-all resize-none shadow-sm ${className}`}
      {...props}
    />
  </div>
);
