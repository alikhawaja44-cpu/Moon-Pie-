import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Heart, ShoppingBag, Utensils, Zap, Car, Home, Film, Gift, 
  Plus, Calendar, Trash2, Edit, MessageCircle, DollarSign, X, Check, Lock, LogIn, Upload, Wallet, Settings, LogOut, TrendingDown, TrendingUp, Copy, ListChecks, CheckSquare, User
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, writeBatch, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAOFOgjdbdoUYBTldXOEEG636q1EM8EBfc",
    authDomain: "leanaxis-accounts.firebaseapp.com",
    projectId: "leanaxis-accounts",
    storageBucket: "leanaxis-accounts.firebasestorage.app",
    messagingSenderId: "855221056961",
    appId: "1:855221056961:web:b4129012fa0f56f58a6b40"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CATEGORIES ---
const CATEGORIES = [
    { id: 'groceries', label: 'Groceries', icon: ShoppingBag, color: '#FF6B6B' },
    { id: 'dining', label: 'Dining Out', icon: Utensils, color: '#4ECDC4' },
    { id: 'utilities', label: 'Bills', icon: Zap, color: '#FFE66D' },
    { id: 'transport', label: 'Transport', icon: Car, color: '#1A535C' },
    { id: 'home', label: 'Home', icon: Home, color: '#FF9F1C' },
    { id: 'dates', label: 'Date Night', icon: Film, color: '#FF006E' },
    { id: 'gifts', label: 'Gifts', icon: Gift, color: '#8338EC' },
    { id: 'other', label: 'Other', icon: DollarSign, color: '#3A86FF' }
];

// --- HOOKS ---
function useFirebaseSync(collectionName, orderByField = "createdAt") {
    const [data, setData] = useState([]);
    useEffect(() => {
        const q = orderByField ? query(collection(db, collectionName), orderBy(orderByField, "desc")) : collection(db, collectionName);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [collectionName, orderByField]);
    return data;
}

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

// --- LOGIN SCREEN ---
const Login = ({ onLogin, storedPin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin === storedPin) { 
            onLogin();
        } else {
            setError('Wrong PIN, Honey! Try again ❤️');
            setPin('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-pink-50 p-6">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-white">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <Heart size={40} className="text-pink-500 fill-pink-500" />
                </div>
                <h1 className="text-3xl font-bold text-pink-600 mb-2 font-serif">Moon Pie ❤️</h1>
                <p className="text-pink-400 mb-6">Enter our secret PIN to enter</p>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="password" 
                        maxLength="4"
                        className="w-full text-center text-4xl tracking-[1em] font-bold text-pink-600 border-b-2 border-pink-200 outline-none focus:border-pink-500 bg-transparent mb-6 py-2"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••"
                    />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" className="w-full bg-pink-500 text-white font-bold py-3 rounded-xl hover:bg-pink-600 transition-colors shadow-lg shadow-pink-200 flex items-center justify-center gap-2">
                        <LogIn size={20} /> Open Our World
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- APP COMPONENT ---
function App() {
    const [isAuthenticated, setIsAuthenticated] = useStickyState(false, 'moonpie_auth');
    const [appPin, setAppPin] = useStickyState('1430', 'moonpie_pin'); 
    const [view, setView] = useState('expenses'); 
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    
    // Filter State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [budgetCycleStart, setBudgetCycleStart] = useState(20); 

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Data
    const expenses = useFirebaseSync('moonpie_expenses');
    const notes = useFirebaseSync('moonpie_notes');
    const budgets = useFirebaseSync('moonpie_budgets', null); 

    // Form State
    const [newExpense, setNewExpense] = useState({ 
        amount: '', 
        category: 'groceries', 
        note: '', 
        date: new Date().toISOString().split('T')[0], 
        who: 'Ali',
        type: 'debit' 
    });
    const [newNote, setNewNote] = useState('');
    const [newPinCode, setNewPinCode] = useState('');
    const [budgetInputs, setBudgetInputs] = useState({ ali: '', fajar: '' });

    // --- HANDLERS ---
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.amount) return;
        
        await addDoc(collection(db, 'moonpie_expenses'), {
            ...newExpense,
            createdAt: new Date().toISOString(),
            amount: Number(newExpense.amount)
        });
        
        setShowAddModal(false);
        setNewExpense({ amount: '', category: 'groceries', note: '', date: new Date().toISOString().split('T')[0], who: 'Ali', type: 'debit' });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: newExpense.type === 'credit' ? ['#4ade80', '#22c55e'] : ['#ff6b6b', '#ff006e'] });
    };

    const handleDuplicate = (item) => {
        const { id, createdAt, ...dataToCopy } = item;
        setNewExpense({
            ...dataToCopy,
            date: new Date().toISOString().split('T')[0] 
        });
        setShowAddModal(true);
    };

    const handleDeleteExpense = async (id) => {
        if (confirm("Remove this entry?")) {
            await deleteDoc(doc(db, 'moonpie_expenses', id));
        }
    };

    // Bulk Actions
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const toggleId = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredExpenses.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(filteredExpenses.map(e => e.id));
            setSelectedIds(allIds);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} items forever?`)) return;
        
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
            const ref = doc(db, 'moonpie_expenses', id);
            batch.delete(ref);
        });

        try {
            await batch.commit();
            alert("Deleted successfully!");
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            alert("Error deleting items.");
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        if (selectedMonth === 'All') return alert("Select a specific month!");

        const budgetKey = `${selectedYear}-${selectedMonth}`;
        await setDoc(doc(db, 'moonpie_budgets', budgetKey), { 
            ali: Number(budgetInputs.ali) || 0,
            fajar: Number(budgetInputs.fajar) || 0,
            year: selectedYear,
            month: selectedMonth
        });
        
        setShowBudgetModal(false);
        alert(`Budget Updated! 💰`);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data;
                if (rows.length === 0) return alert("File looks empty!");
                if (!confirm(`Import ${rows.length} rows?`)) return;

                const batch = writeBatch(db);
                let count = 0;

                rows.forEach(row => {
                    const cleanRow = {};
                    Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);

                    const debitStr = cleanRow['debit'] || '0';
                    const creditStr = cleanRow['credit'] || '0';
                    const comment = cleanRow['comment'] || 'Imported';
                    const dateStr = cleanRow['date & time'] || new Date().toISOString().split('T')[0];
                    const debit = Number(debitStr.toString().replace(/,/g, ''));
                    const credit = Number(creditStr.toString().replace(/,/g, ''));
                    
                    let amount = 0;
                    let type = 'debit';

                    if (debit > 0) {
                        amount = debit;
                        type = 'debit';
                    } else if (credit > 0) {
                        amount = credit;
                        type = 'credit';
                    }

                    if (amount > 0) {
                        let cat = 'other';
                        const lowerComment = comment.toLowerCase();
                        if (lowerComment.includes('lunch') || lowerComment.includes('dinner') || lowerComment.includes('coffee') || lowerComment.includes('bakery')) cat = 'dining';
                        else if (lowerComment.includes('indrive') || lowerComment.includes('careem') || lowerComment.includes('uber')) cat = 'transport';
                        else if (lowerComment.includes('load') || lowerComment.includes('bill')) cat = 'utilities';
                        else if (lowerComment.includes('laser') || lowerComment.includes('gym') || lowerComment.includes('doctor')) cat = 'home';
                        else if (lowerComment.includes('pocket money')) cat = 'gifts';

                        const newRef = doc(collection(db, 'moonpie_expenses'));
                        batch.set(newRef, {
                            amount: amount,
                            note: comment,
                            date: new Date(dateStr).toISOString().split('T')[0],
                            category: cat,
                            who: 'Fajar',
                            type: type,
                            createdAt: new Date().toISOString(),
                            imported: true
                        });
                        count++;
                    }
                });

                try {
                    await batch.commit();
                    alert(`Successfully imported ${count} entries! 🎉`);
                    confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
                } catch (err) {
                    console.error("Import failed:", err);
                    alert("Oops! Import failed. Check console.");
                }
            }
        });
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        await addDoc(collection(db, 'moonpie_notes'), {
            text: newNote,
            createdAt: new Date().toISOString(),
            author: 'Me' 
        });
        setNewNote('');
    };

    const handleDeleteNote = async (id) => {
        await deleteDoc(doc(db, 'moonpie_notes', id));
    };

    const handleChangePin = (e) => {
        e.preventDefault();
        if (newPinCode.length === 4) {
            setAppPin(newPinCode);
            alert("PIN Updated Successfully! ❤️");
            setNewPinCode('');
        } else {
            alert("PIN must be 4 digits!");
        }
    };

    // --- CALCULATIONS ---
    const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            
            if (selectedMonth === 'All') {
                return d.getFullYear() === selectedYear;
            }

            // Salary Cycle Logic (Shifted: Feb Selection = Jan 20 to Feb 19)
            // This ensures "February" shows the bulk of Feb (1st-19th)
            const targetStart = new Date(selectedYear, selectedMonth - 1, budgetCycleStart);
            const targetEnd = new Date(selectedYear, selectedMonth, budgetCycleStart);
            
            // Handle Year Wrap for January
            if (selectedMonth === 0) {
                targetStart.setFullYear(selectedYear - 1);
                targetStart.setMonth(11); // Dec
            }

            return d >= targetStart && d < targetEnd;
        });
    }, [expenses, selectedMonth, selectedYear, budgetCycleStart]);

    const stats = useMemo(() => {
        const aliExpenses = filteredExpenses.filter(e => e.who === 'Ali' && e.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0);
        const fajarExpenses = filteredExpenses.filter(e => e.who === 'Fajar' && e.type === 'debit').reduce((acc, curr) => acc + curr.amount, 0);
        
        // Income is treated as "Budget Boost" or just separate stat. 
        // For remaining balance, we usually assume Budget is "Initial Amount".
        // If income should add to budget, we can add it here.
        // For now, let's keep income separate display to avoid confusion unless requested.
        
        return { aliSpent: aliExpenses, fajarSpent: fajarExpenses, totalSpent: aliExpenses + fajarExpenses };
    }, [filteredExpenses]);

    const budgetsData = useMemo(() => {
        if (selectedMonth === 'All') {
            const yearly = budgets.filter(b => b.year === selectedYear);
            return {
                ali: yearly.reduce((acc, b) => acc + (b.ali || 0), 0),
                fajar: yearly.reduce((acc, b) => acc + (b.fajar || 0), 0)
            };
        }
        const budgetKey = `${selectedYear}-${selectedMonth}`;
        const found = budgets.find(b => b.id === budgetKey) || {};
        return { ali: found.ali || 0, fajar: found.fajar || 0 };
    }, [budgets, selectedMonth, selectedYear]);

    const remaining = {
        ali: budgetsData.ali - stats.aliSpent,
        fajar: budgetsData.fajar - stats.fajarSpent,
        total: (budgetsData.ali + budgetsData.fajar) - stats.totalSpent
    };

    const cycleText = useMemo(() => {
        if (selectedMonth === 'All') return `Year ${selectedYear}`;
        
        const start = new Date(selectedYear, selectedMonth - 1, budgetCycleStart);
        const end = new Date(selectedYear, selectedMonth, budgetCycleStart - 1);

        if (selectedMonth === 0) {
            start.setFullYear(selectedYear - 1);
            start.setMonth(11);
        }

        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }, [selectedMonth, selectedYear, budgetCycleStart]);

    const chartData = useMemo(() => {
        const map = {};
        filteredExpenses.filter(e => e.type !== 'credit').forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return Object.keys(map).map(k => ({ name: CATEGORIES.find(c => c.id === k)?.label || k, value: map[k] }));
    }, [filteredExpenses]);

    if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} storedPin={appPin} />;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-24 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            {/* HEADER */}
            <header className="p-6 relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                            Moon Pie <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={24} />
                        </h1>
                        <p className="text-slate-500 text-sm">Our little world 🌍</p>
                    </div>
                    <div className="flex gap-2">
                        {view === 'expenses' && (
                            <button onClick={toggleSelectionMode} className={`p-2 rounded-full shadow-sm transition-colors ${isSelectionMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 hover:text-pink-500'}`}>
                                <ListChecks size={20} />
                            </button>
                        )}
                        <label className="cursor-pointer bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-pink-500 transition-colors">
                            <Upload size={20} />
                            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* BULK ACTION BAR */}
                {isSelectionMode && (
                    <div className="bg-slate-800 text-white rounded-xl p-4 mb-4 flex justify-between items-center shadow-lg animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="flex items-center gap-2 text-sm font-bold hover:text-pink-300">
                                <CheckSquare size={18} /> {selectedIds.size === filteredExpenses.length ? 'Deselect' : 'Select All'}
                            </button>
                            <span className="text-sm font-bold">{selectedIds.size} Selected</span>
                        </div>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBulkDelete} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Trash2 size={14} /> Delete
                            </button>
                        )}
                    </div>
                )}

                {/* INDIVIDUAL BUDGET CARDS */}
                {!isSelectionMode && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* ALI CARD */}
                        <div className="bg-white/60 backdrop-blur rounded-2xl p-3 border border-white shadow-sm transition-transform active:scale-95 cursor-pointer" onClick={() => { if (selectedMonth !== 'All') { setBudgetInputs({ali: budgetsData.ali, fajar: budgetsData.fajar}); setShowBudgetModal(true); } }}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={14}/></div>
                                <span className="font-bold text-slate-700 text-sm">Ali</span>
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Remaining</p>
                            <p className={`text-xl font-bold ${remaining.ali < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                {remaining.ali.toLocaleString()}
                            </p>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${remaining.ali < 0 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((stats.aliSpent / (budgetsData.ali || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>

                        {/* FAJAR CARD */}
                        <div className="bg-white/60 backdrop-blur rounded-2xl p-3 border border-white shadow-sm transition-transform active:scale-95 cursor-pointer" onClick={() => { if (selectedMonth !== 'All') { setBudgetInputs({ali: budgetsData.ali, fajar: budgetsData.fajar}); setShowBudgetModal(true); } }}>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600"><User size={14}/></div>
                                <span className="font-bold text-slate-700 text-sm">Fajar</span>
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Remaining</p>
                            <p className={`text-xl font-bold ${remaining.fajar < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                {remaining.fajar.toLocaleString()}
                            </p>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${remaining.fajar < 0 ? 'bg-red-500' : 'bg-pink-500'}`} style={{ width: `${Math.min((stats.fajarSpent / (budgetsData.fajar || 1)) * 100, 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="px-4 space-y-6 relative z-10">
                {view === 'expenses' && (
                    <>
                        {!isSelectionMode && (
                            <div className="flex gap-2 mb-2">
                                <select className="flex-1 bg-white/50 border border-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value === 'All' ? 'All' : Number(e.target.value))}>
                                    <option value="All">All Months</option>
                                    {MONTH_NAMES.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <select className="bg-white/50 border border-white rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        )}

                        {!isSelectionMode && (
                            <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-slate-700 font-bold flex items-center gap-2"><PieChart size={18}/> Total Spending</h2>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{cycleText}</span>
                                </div>
                                <div className="h-48 w-full">
                                    {chartData.length > 0 ? (
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CATEGORIES.find(c => c.label === entry.name)?.color || '#ccc'} />
                                                    ))}
                                                </Pie>
                                                <ChartTooltip formatter={(val) => `Rs ${val}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">No expenses yet! 👇</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pb-20">
                            {filteredExpenses.map(expense => {
                                const isCredit = expense.type === 'credit';
                                const Cat = isCredit ? { icon: DollarSign, color: '#22c55e', label: 'Income' } : (CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[7]);
                                const Icon = Cat.icon;
                                const isSelected = selectedIds.has(expense.id);
                                return (
                                    <div key={expense.id} onClick={() => isSelectionMode && toggleId(expense.id)} className={`bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-500 bg-pink-50' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            {isSelectionMode ? (
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-pink-500 border-pink-500' : 'border-slate-300'}`}>
                                                    {isSelected && <Check size={14} className="text-white" />}
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: Cat.color }}>
                                                    <Icon size={20} />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-slate-800">{expense.note || Cat.label}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={10} /> {expense.date} • {expense.who}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <div><span className={`block font-bold ${isCredit ? 'text-green-600' : 'text-slate-800'}`}>{isCredit ? '+' : ''} Rs {expense.amount.toLocaleString()}</span></div>
                                            {!isSelectionMode && (
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDuplicate(expense); }} className="text-slate-300 hover:text-blue-500 transition-colors p-1"><Copy size={14} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteExpense(expense.id); }} className="text-red-200 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Other views (Notes, Settings) */}
                {view === 'notes' && (
                    <div className="space-y-4">
                        <div className="bg-yellow-100 p-4 rounded-2xl shadow-sm border border-yellow-200 rotate-1 transform transition hover:rotate-0">
                            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><MessageCircle size={18}/> Fridge Notes</h3>
                            <form onSubmit={handleAddNote} className="flex gap-2">
                                <input className="flex-1 bg-white/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Leave a sweet note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
                                <button type="submit" className="bg-yellow-400 text-yellow-900 p-2 rounded-lg font-bold shadow-sm hover:bg-yellow-500"><Plus size={18}/></button>
                            </form>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pb-20">
                            {notes.map((note, idx) => (
                                <div key={note.id} className={`p-4 rounded-2xl shadow-sm relative group ${idx % 2 === 0 ? 'bg-pink-100 text-pink-900' : 'bg-blue-100 text-blue-900'}`}>
                                    <p className="font-handwriting text-lg leading-tight mb-4">{note.text}</p>
                                    <button onClick={() => handleDeleteNote(note.id)} className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'settings' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-white">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Lock size={18}/> Security</h2>
                            <form onSubmit={handleChangePin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Change PIN</label>
                                    <div className="flex gap-2">
                                        <input type="password" maxLength="4" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center text-lg font-bold tracking-widest outline-none focus:border-pink-500" placeholder="••••" value={newPinCode} onChange={e => setNewPinCode(e.target.value)} />
                                        <button type="submit" className="bg-pink-500 text-white px-4 rounded-xl font-bold hover:bg-pink-600 transition-colors">Update</button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Current PIN: <span className="font-mono bg-slate-100 px-1 rounded">{appPin}</span></p>
                                </div>
                            </form>
                        </div>
                        <button onClick={() => setIsAuthenticated(false)} className="w-full bg-red-100 text-red-600 font-bold py-3 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"><LogOut size={18} /> Logout</button>
                    </div>
                )}
            </main>

            {/* FLOATING ADD BUTTON */}
            {view === 'expenses' && !isSelectionMode && (
                <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-6 bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 border-4 border-white"><Plus size={28} /></button>
            )}

            {/* BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-slate-200 p-4 pb-6 flex justify-around items-center z-40">
                <button onClick={() => setView('expenses')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'expenses' ? 'text-pink-500' : 'text-slate-400'}`}><Wallet size={24} /><span className="text-[10px] font-bold">Wallet</span></button>
                <button onClick={() => setView('notes')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'notes' ? 'text-pink-500' : 'text-slate-400'}`}><MessageCircle size={24} /><span className="text-[10px] font-bold">Notes</span></button>
                <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-colors ${view === 'settings' ? 'text-pink-500' : 'text-slate-400'}`}><Settings size={24} /><span className="text-[10px] font-bold">Settings</span></button>
            </nav>

            {/* ADD EXPENSE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-10">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">{newExpense.id ? 'Duplicate Entry' : 'Add New Entry'}</h3>
                            <button onClick={() => setShowAddModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button type="button" onClick={() => setNewExpense({...newExpense, type: 'debit'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newExpense.type === 'debit' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}>Expense (Debit)</button>
                                <button type="button" onClick={() => setNewExpense({...newExpense, type: 'credit'})} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${newExpense.type === 'credit' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500'}`}>Income (Credit)</button>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Rs</span>
                                    <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-10 pr-4 font-bold text-lg outline-none focus:border-pink-500 transition-colors" placeholder="0" autoFocus value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                                </div>
                            </div>
                            {newExpense.type === 'debit' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {CATEGORIES.map(cat => (
                                            <button key={cat.id} type="button" onClick={() => setNewExpense({...newExpense, category: cat.id})} className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${newExpense.category === cat.id ? 'bg-slate-800 text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                                <cat.icon size={18} /><span className="text-[9px] font-bold truncate w-full text-center">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                                    <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Who?</label>
                                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500" value={newExpense.who} onChange={e => setNewExpense({...newExpense, who: e.target.value})}>
                                        <option value="Ali">Ali</option><option value="Fajar">Fajar</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Note (Optional)</label>
                                <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500" placeholder={newExpense.type === 'debit' ? "e.g. Dinner at Monal" : "e.g. Salary, Refund"} value={newExpense.note} onChange={e => setNewExpense({...newExpense, note: e.target.value})} />
                            </div>
                            <button type="submit" className={`w-full text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${newExpense.type === 'credit' ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-200'}`}>
                                <Plus size={20} /> {newExpense.type === 'credit' ? 'Add Income' : 'Add Expense'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* BUDGET SET MODAL */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Set Budgets for {MONTH_NAMES[selectedMonth]}</h3>
                        <form onSubmit={handleUpdateBudget} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-blue-500 uppercase mb-1">Ali's Budget</label>
                                <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-lg outline-none focus:border-blue-500" placeholder="0" value={budgetInputs.ali} onChange={e => setBudgetInputs({...budgetInputs, ali: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-pink-500 uppercase mb-1">Fajar's Budget</label>
                                <input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 px-4 font-bold text-lg outline-none focus:border-pink-500" placeholder="0" value={budgetInputs.fajar} onChange={e => setBudgetInputs({...budgetInputs, fajar: e.target.value})} />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancel</button>
                                <button type="submit" className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);