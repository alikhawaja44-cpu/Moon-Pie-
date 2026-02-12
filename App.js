import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Heart, ShoppingBag, Utensils, Zap, Car, Home, Film, Gift, 
  Plus, Calendar, Trash2, Edit, MessageCircle, DollarSign, X, Check, Lock, LogIn, Upload, Wallet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// --- FIREBASE CONFIG (SAME AS LEANAXIS FOR NOW, CHANGE IF NEEDED) ---
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
        const q = query(collection(db, collectionName), orderBy(orderByField, "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [collectionName]);
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
const Login = ({ onLogin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin === '1430') { // Example PIN: "I Love You" -> 143
            onLogin();
        } else {
            setError('Wrong PIN, Honey! Try again ❤️');
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
    const [view, setView] = useState('expenses'); // expenses, chat, goals
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Data
    const expenses = useFirebaseSync('moonpie_expenses');
    const notes = useFirebaseSync('moonpie_notes');

    // Form State
    const [newExpense, setNewExpense] = useState({ amount: '', category: 'groceries', note: '', date: new Date().toISOString().split('T')[0], who: 'Me' });
    const [newNote, setNewNote] = useState('');

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
        setNewExpense({ amount: '', category: 'groceries', note: '', date: new Date().toISOString().split('T')[0], who: 'Me' });
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#ff6b6b', '#ff006e'] });
    };

    const handleDeleteExpense = async (id) => {
        if (confirm("Remove this entry?")) {
            await deleteDoc(doc(db, 'moonpie_expenses', id));
        }
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
                if (!confirm(`Import ${rows.length} expenses from file?`)) return;

                const batch = writeBatch(db);
                let count = 0;

                rows.forEach(row => {
                    // Try to map common column names
                    const amount = row['Amount'] || row['amount'] || row['Cost'] || row['cost'] || 0;
                    const desc = row['Description'] || row['description'] || row['Note'] || row['note'] || 'Imported Expense';
                    const date = row['Date'] || row['date'] || new Date().toISOString().split('T')[0];
                    const cat = 'other'; // Default category for imports

                    if (amount > 0) {
                        const newRef = doc(collection(db, 'moonpie_expenses'));
                        batch.set(newRef, {
                            amount: Number(amount),
                            note: desc,
                            date: date,
                            category: cat,
                            who: 'Partner', // Assume imported data is from partner/shared
                            createdAt: new Date().toISOString(),
                            imported: true
                        });
                        count++;
                    }
                });

                try {
                    await batch.commit();
                    alert(`Successfully imported ${count} expenses! 🎉`);
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

    // --- CALCULATIONS ---
    const totalSpent = useMemo(() => expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0), [expenses]);
    
    const chartData = useMemo(() => {
        const map = {};
        expenses.forEach(e => {
            map[e.category] = (map[e.category] || 0) + e.amount;
        });
        return Object.keys(map).map(k => ({ name: CATEGORIES.find(c => c.id === k)?.label || k, value: map[k] }));
    }, [expenses]);

    if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 pb-20 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            {/* HEADER */}
            <header className="p-6 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                        Moon Pie <Heart className="text-pink-500 fill-pink-500 animate-pulse" size={24} />
                    </h1>
                    <p className="text-slate-500 text-sm">Our little world 🌍</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="bg-white/50 backdrop-blur px-4 py-2 rounded-full border border-white shadow-sm">
                        <span className="text-xs text-slate-500 font-bold uppercase block">Total Spent</span>
                        <span className="text-lg font-bold text-slate-800">Rs {totalSpent.toLocaleString()}</span>
                    </div>
                    {/* IMPORT BUTTON */}
                    <label className="cursor-pointer bg-white p-2 rounded-full shadow-sm text-slate-400 hover:text-pink-500 transition-colors" title="Import Excel/CSV">
                        <Upload size={18} />
                        <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="px-4 space-y-6 relative z-10">
                
                {view === 'expenses' && (
                    <>
                        {/* CHART CARD */}
                        <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white">
                            <h2 className="text-slate-700 font-bold mb-4 flex items-center gap-2"><PieChart size={18}/> Spending Breakdown</h2>
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
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No expenses yet! add one below 👇</div>
                                )}
                            </div>
                        </div>

                        {/* EXPENSE LIST */}
                        <div className="space-y-3">
                            {expenses.map(expense => {
                                const Cat = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES[7];
                                const Icon = Cat.icon;
                                return (
                                    <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: Cat.color }}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{expense.note || Cat.label}</h3>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={10} /> {expense.date} • {expense.who}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-slate-800">Rs {expense.amount.toLocaleString()}</span>
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {view === 'notes' && (
                    <div className="space-y-4">
                        <div className="bg-yellow-100 p-4 rounded-2xl shadow-sm border border-yellow-200 rotate-1 transform transition hover:rotate-0">
                            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><MessageCircle size={18}/> Fridge Notes</h3>
                            <form onSubmit={handleAddNote} className="flex gap-2">
                                <input 
                                    className="flex-1 bg-white/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                                    placeholder="Leave a sweet note..."
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                                <button type="submit" className="bg-yellow-400 text-yellow-900 p-2 rounded-lg font-bold shadow-sm hover:bg-yellow-500"><Plus size={18}/></button>
                            </form>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {notes.map((note, idx) => (
                                <div key={note.id} className={`p-4 rounded-2xl shadow-sm relative group ${idx % 2 === 0 ? 'bg-pink-100 text-pink-900' : 'bg-blue-100 text-blue-900'}`}>
                                    <p className="font-handwriting text-lg leading-tight mb-4">{note.text}</p>
                                    <button 
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* FLOATING ADD BUTTON */}
            <button 
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-24 right-6 bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 border-4 border-white"
            >
                <Plus size={28} />
            </button>

            {/* BOTTOM NAV */}
            <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-slate-200 p-4 pb-6 flex justify-around items-center z-40">
                <button onClick={() => setView('expenses')} className={`flex flex-col items-center gap-1 ${view === 'expenses' ? 'text-pink-500' : 'text-slate-400'}`}>
                    <Wallet size={24} />
                    <span className="text-[10px] font-bold">Wallet</span>
                </button>
                <button onClick={() => setView('notes')} className={`flex flex-col items-center gap-1 ${view === 'notes' ? 'text-pink-500' : 'text-slate-400'}`}>
                    <MessageCircle size={24} />
                    <span className="text-[10px] font-bold">Love Notes</span>
                </button>
            </nav>

            {/* ADD EXPENSE MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-10">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Add New Expense</h3>
                            <button onClick={() => setShowAddModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">How much?</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400 font-bold">Rs</span>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl py-3 pl-10 pr-4 font-bold text-lg outline-none focus:border-pink-500 transition-colors"
                                        placeholder="0"
                                        autoFocus
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button 
                                            key={cat.id} 
                                            type="button"
                                            onClick={() => setNewExpense({...newExpense, category: cat.id})}
                                            className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${newExpense.category === cat.id ? 'bg-slate-800 text-white scale-105 shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            <cat.icon size={18} />
                                            <span className="text-[9px] font-bold truncate w-full text-center">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Who Paid?</label>
                                    <select 
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500"
                                        value={newExpense.who}
                                        onChange={e => setNewExpense({...newExpense, who: e.target.value})}
                                    >
                                        <option value="Me">Me</option>
                                        <option value="Partner">Partner</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Note (Optional)</label>
                                <input 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500"
                                    placeholder="e.g. Dinner at Monal"
                                    value={newExpense.note}
                                    onChange={e => setNewExpense({...newExpense, note: e.target.value})}
                                />
                            </div>

                            <button type="submit" className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95 flex justify-center items-center gap-2">
                                <Plus size={20} /> Add Expense
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);