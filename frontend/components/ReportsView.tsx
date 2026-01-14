
import React, { useState, useMemo } from 'react';
import { Transaction, Project, TransactionType } from '../types';
import { Printer, FileText, TrendingUp, TrendingDown, Hotel, Search, Filter, X, Calendar as CalendarIcon, Landmark, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ReportsViewProps {
  transactions: Transaction[];
  projects: Project[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ transactions, projects }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all' | 'income_expense'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    if (selectedProjectId !== 'all') {
      const targetId = selectedProjectId === 'general_project' ? null : selectedProjectId;
      list = list.filter(t => t.project === targetId);
    }

    if (selectedType !== 'all') {
      if (selectedType === 'income_expense') {
        list = list.filter(t => t.type === 'income' || t.type === 'expense');
      } else {
        list = list.filter(t => t.type === selectedType);
      }
    }

    if (startDate) {
      list = list.filter(t => t.date >= startDate);
    }

    if (endDate) {
      list = list.filter(t => t.date <= endDate);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.note.toLowerCase().includes(q) || 
        format(new Date(t.date), 'MMM dd, yyyy').toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, selectedProjectId, selectedType, startDate, endDate, searchQuery]);

  const ledgerData = useMemo(() => {
    // 1. Create a stable chronological sort (Oldest to Newest)
    const indexed = filteredTransactions.map((t, i) => ({ ...t, originalIndex: i }));
    
    const sortedChronologically = [...indexed].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.originalIndex - b.originalIndex;
    });
    
    // 2. Calculate running balance (Income - Expense ONLY, regardless of project/general)
    let runningOpBalance = 0;
    const dataWithBalance = sortedChronologically.map(t => {
      if (t.type === 'income') {
        runningOpBalance += t.amount;
      } else if (t.type === 'expense') {
        runningOpBalance -= t.amount;
      }
      return {
        ...t,
        runningBalance: runningOpBalance
      };
    });

    // 3. Return reverse chronological for display (Newest to Oldest)
    return dataWithBalance.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.originalIndex - a.originalIndex;
    });
  }, [filteredTransactions]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income' && t.project !== null)
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter(t => t.type === 'expense' && t.project !== null)
      .reduce((sum, t) => sum + t.amount, 0);

    const investment = filteredTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    // General Entries are now all transactions with project: null
    const generalIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.project === null)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const generalExpense = filteredTransactions
      .filter(t => t.type === 'expense' && t.project === null)
      .reduce((sum, t) => sum + t.amount, 0);

    const generalNet = generalIncome - generalExpense;

    return { 
      income, 
      expense, 
      investment, 
      general: generalNet, 
      net: (income + generalIncome) - (expense + generalExpense) 
    };
  }, [filteredTransactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20 print:pb-0 print:pt-0 print:m-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Financial Audit Reports</h2>
          <p className="text-slate-400 font-medium">A complete ledger of all individual project transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 no-print"
          >
            <Printer size={18} />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Audit Filters */}
      <div className="flex flex-col xl:flex-row gap-4 mb-8 print:flex-col print:gap-4">
        <div className="flex-1 relative print:hidden">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search notes or dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[58px] pl-12 pr-10 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all font-medium text-slate-700"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-48 relative group">
            <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-[58px] pl-11 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all font-bold text-slate-700 cursor-pointer text-xs"
            />
            <div className="absolute -top-2.5 left-4 px-1 bg-white text-[8px] font-black text-slate-400 uppercase tracking-widest">From</div>
          </div>

          <div className="sm:w-48 relative group">
            <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-[58px] pl-11 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all font-bold text-slate-700 cursor-pointer text-xs"
            />
            <div className="absolute -top-2.5 left-4 px-1 bg-white text-[8px] font-black text-slate-400 uppercase tracking-widest">To</div>
          </div>

          <div className="sm:w-48 relative group">
            <Filter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full h-[58px] pl-12 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="income_expense">Income & Expense</option>
              <option value="investment">Investments</option>
            </select>
            <div className="absolute -top-2.5 left-4 px-1 bg-white text-[8px] font-black text-slate-400 uppercase tracking-widest print:hidden">Type</div>
          </div>

          <div className="sm:w-48 relative group">
            <Hotel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select 
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-[58px] pl-12 pr-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="general_project">General Entries Only</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="absolute -top-2.5 left-4 px-1 bg-white text-[8px] font-black text-slate-400 uppercase tracking-widest">Project</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:flex-col print:flex print:gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-1">
          <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-2">
            <Landmark size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital Investment</p>
          <p className="text-2xl font-black text-violet-700">PKR {stats.investment.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-1">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-2">
            <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Revenue</p>
          <p className="text-2xl font-black text-emerald-600">PKR {stats.income.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-1">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-2">
            <TrendingDown size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Costs</p>
          <p className="text-2xl font-black text-rose-600">PKR {stats.expense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-1">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2">
            <Sparkles size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">General Net</p>
          <p className={`text-2xl font-black ${stats.general >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            PKR {stats.general.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden print:border-slate-800 print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-slate-800">
                <th className="px-6 py-4 print:px-2 print:py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Date</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Context</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Investment</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Description</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Income</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Expense</th>
                <th className="px-6 py-4 print:px-2 print:py-1 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-slate-800">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
              {ledgerData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching records</p>
                  </td>
                </tr>
              ) : (
                ledgerData.map((row, idx) => {
                  const project = projects.find(p => String(p.id) === String(row.project));
                  const projectName = row.project === null ? 'General Entry' : (project?.name || 'Non-Project');
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 print:px-2 print:py-1 whitespace-nowrap text-sm print:text-[8px] font-bold text-slate-700">
                        {format(new Date(row.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 print:px-2 print:py-1 whitespace-nowrap text-sm print:text-[8px] font-bold text-slate-800">
                        {projectName}
                      </td>
                      <td className="px-6 py-4 print:px-2 print:py-1 text-right whitespace-nowrap text-sm print:text-[8px] font-black text-violet-600">
                        {row.type === 'investment' ? row.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 print:px-2 print:py-1 text-sm print:text-[8px] font-medium text-slate-500 italic block min-w-[150px]">
                        {row.note || '-'}
                      </td>
                      <td className="px-6 py-4 print:px-2 print:py-1 text-right whitespace-nowrap text-sm print:text-[8px] font-black text-emerald-600">
                        {row.type === 'income' ? row.amount.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 print:px-2 print:py-1 text-right whitespace-nowrap text-sm print:text-[8px] font-black text-rose-600">
                        {row.type === 'expense' ? row.amount.toLocaleString() : '-'}
                      </td>
                      <td className={`px-6 py-4 print:px-2 print:py-1 text-right whitespace-nowrap text-sm print:text-[8px] font-black ${
                        row.runningBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'
                      }`}>
                         {row.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {ledgerData.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-100 print:bg-white print:border-slate-800">
                <tr>
                  <td colSpan={6} className="px-6 py-4 print:px-2 print:py-1 text-right">
                    <span className="text-xs print:text-[8px] font-black text-slate-400 uppercase tracking-widest">Operational Balance:</span>
                  </td>
                  <td className={`px-6 py-4 print:px-2 print:py-1 text-right text-lg print:text-sm font-black ${
                    stats.net >= 0 ? 'text-indigo-600' : 'text-rose-600'
                  }`}>
                    PKR {stats.net.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
