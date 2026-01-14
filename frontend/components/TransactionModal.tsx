
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Banknote, FileText, TrendingUp, TrendingDown, Calendar as CalendarIcon, Landmark, Hotel, Bed, ConciergeBell, Utensils, Building2, Coffee, Key } from 'lucide-react';
import { format } from 'date-fns';

interface TransactionModalProps {
  type: TransactionType;
  date: string;
  isGeneral?: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id' | 'project'>) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ type, date, isGeneral, onClose, onSubmit }) => {
  const [currentType, setCurrentType] = useState<TransactionType>(type);
  const [selectedDate, setSelectedDate] = useState<string>(date);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0) {
      onSubmit({
        type: currentType,
        amount: parseFloat(amount),
        note,
        date: selectedDate,
      });
    }
  };

  const getAccentColor = () => {
    if (currentType === 'income') return 'text-emerald-600';
    if (currentType === 'expense') return 'text-rose-600';
    return 'text-violet-600';
  };

  const getBorderColor = () => {
    if (currentType === 'income') return 'focus:border-emerald-500';
    if (currentType === 'expense') return 'focus:border-rose-500';
    return 'focus:border-violet-500';
  };

  const isCategorizable = currentType === 'income' || currentType === 'expense';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 border border-slate-100 relative overflow-hidden">
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${getAccentColor()}`}>
                Add {isGeneral ? 'General ' : ''}{currentType.charAt(0).toUpperCase() + currentType.slice(1)}
              </h3>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Record Entry</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>

          {/* Type Toggle for income/expense entries */}
          {isCategorizable && (
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setCurrentType('income')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  currentType === 'income' 
                    ? 'bg-white text-emerald-600 shadow-sm scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingUp size={14} className="mb-0.5" />
                Income
              </button>
              <button
                type="button"
                onClick={() => setCurrentType('expense')}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  currentType === 'expense' 
                    ? 'bg-white text-rose-600 shadow-sm scale-[1.02]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <TrendingDown size={14} className="mb-0.5" />
                Expense
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Transaction Date</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <CalendarIcon size={20} />
                </span>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 bg-slate-50/50 outline-none transition-all font-bold text-slate-700 focus:border-indigo-500 focus:bg-white border-transparent"
                />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount (PKR)</label>
              <div className="relative">
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${
                  currentType === 'income' ? 'text-emerald-400' : 
                  currentType === 'expense' ? 'text-rose-400' : 'text-violet-400'
                }`}>
                  {currentType === 'investment' ? <Landmark size={24} /> : <Banknote size={24} />}
                </span>
                <input
                  autoFocus
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl border-2 bg-slate-50/50 outline-none transition-all text-3xl font-black text-slate-800 placeholder:text-slate-200 ${getBorderColor()} focus:bg-white border-transparent`}
                />
              </div>
            </div>

            <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference Note</label>
              <div className="relative">
                <span className="absolute left-5 top-5 text-slate-300">
                  <FileText size={20} />
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Entry context..."
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl border-2 bg-slate-50/50 outline-none transition-all h-28 resize-none text-slate-700 font-medium ${getBorderColor()} focus:bg-white border-transparent`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white shadow-2xl transition-all active:scale-[0.98] relative z-30"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Commit Entry
            </button>
          </form>
        </div>

        {/* Watermark for Modal */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-20">
          <div className="grid grid-cols-2 gap-x-12 gap-y-12 -rotate-12 scale-150">
            <Hotel size={100} />
            <Bed size={100} />
            <ConciergeBell size={100} />
            <Utensils size={100} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
