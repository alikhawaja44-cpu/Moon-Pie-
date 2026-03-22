import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Heart, ShoppingBag, Utensils, Zap, Car, Home, Film, Gift,
  Plus, Calendar, Trash2, Edit2, MessageCircle, DollarSign, X, Check,
  Lock, LogIn, Upload, Wallet, Settings, LogOut, TrendingUp, Copy,
  ListChecks, CheckSquare, User, BarChart2, Search, AlertTriangle,
  CheckCircle, Bell, Eye, EyeOff, Sparkles, TrendingDown
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend } from 'recharts';
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, writeBatch, setDoc
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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
  { id: 'groceries', label: 'Groceries',  icon: ShoppingBag, color: '#FF6B6B' },
  { id: 'dining',    label: 'Dining Out', icon: Utensils,    color: '#4ECDC4' },
  { id: 'utilities', label: 'Bills',      icon: Zap,         color: '#F7B731' },
  { id: 'transport', label: 'Transport',  icon: Car,         color: '#1A535C' },
  { id: 'home',      label: 'Home',       icon: Home,        color: '#FF9F1C' },
  { id: 'dates',     label: 'Date Night', icon: Film,        color: '#FF006E' },
  { id: 'gifts',     label: 'Gifts',      icon: Gift,        color: '#8338EC' },
  { id: 'other',     label: 'Other',      icon: DollarSign,  color: '#3A86FF' }
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// --- HOOKS ---
function useFirebaseSync(collectionName, orderByField = "createdAt") {
  const [data, setData] = useState([]);
  useEffect(() => {
    const q = orderByField
      ? query(collection(db, collectionName), orderBy(orderByField, "desc"))
      : collection(db, collectionName);
    const unsub = onSnapshot(q, snap => setData(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return unsub;
  }, [collectionName, orderByField]);
  return data;
}

function useFirebaseDoc(collectionName, docId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, collectionName, docId), d => {
      if (d.exists()) setData(d.data());
    });
    return unsub;
  }, [collectionName, docId]);
  return data;
}

function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const v = window.localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : defaultValue;
    } catch { return defaultValue; }
  });
  useEffect(() => { window.localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

// --- TOAST SYSTEM ---
function ToastContainer({ toasts }) {
  return (
    <div style={{ position:'fixed', top:20, right:16, zIndex:99999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:10, padding:'12px 16px',
          borderRadius:16, boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          fontSize:13, fontWeight:700, maxWidth:300,
          background: t.type==='success' ? '#10b981' : t.type==='error' ? '#ef4444' : '#1e293b',
          color:'white', animation:'toastIn 0.3s ease'
        }}>
          {t.type==='success' ? <CheckCircle size={15}/> : t.type==='error' ? <AlertTriangle size={15}/> : <Bell size={15}/>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// --- CONFIRM DIALOG ---
function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:24, padding:24, width:'100%', maxWidth:320, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <AlertTriangle size={20} color="#ef4444"/>
          </div>
          <h3 style={{ fontWeight:700, color:'#1e293b', fontSize:16, margin:0 }}>{dialog.title || 'Are you sure?'}</h3>
        </div>
        <p style={{ color:'#64748b', fontSize:14, marginBottom:20 }}>{dialog.message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel}  style={{ flex:1, background:'#f1f5f9', color:'#475569', padding:'10px 0', borderRadius:12, fontWeight:700, border:'none', cursor:'pointer', fontSize:14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, background:'#ef4444', color:'white',   padding:'10px 0', borderRadius:12, fontWeight:700, border:'none', cursor:'pointer', fontSize:14 }}>{dialog.confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// --- LOGIN SCREEN ---
const Login = ({ onLogin, storedPin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === storedPin) {
      onLogin();
    } else {
      setError('Wrong PIN, Honey! Try again 💜');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 100%)', padding:24 }}>
      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .handwriting { font-style: italic; font-family: 'Georgia', serif; letter-spacing: 0.01em; }
        .expense-row { transition: all 0.2s ease; }
        .expense-row:active { transform: scale(0.98); }
      `}</style>
      <div style={{
        background:'rgba(255,255,255,0.85)', backdropFilter:'blur(16px)',
        padding:36, borderRadius:32, boxShadow:'0 20px 60px rgba(168,85,247,0.15)',
        width:'100%', maxWidth:360, textAlign:'center',
        border:'1px solid rgba(255,255,255,0.6)',
        animation:'bounceIn 0.5s ease'
      }}>
        <div style={{ width:80, height:80, background:'#f3e8ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', animation:'pulse-heart 2s ease infinite' }}>
          <Heart size={40} color="#a855f7" fill="#a855f7"/>
        </div>
        <h1 style={{ fontSize:30, fontWeight:800, color:'#7c3aed', marginBottom:6 }}>Moon Pie 💜</h1>
        <p style={{ color:'#a78bfa', marginBottom:24, fontSize:14 }}>Enter our secret PIN to enter</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            maxLength="4"
            style={{
              width:'100%', textAlign:'center', fontSize:36, letterSpacing:'0.8em',
              fontWeight:800, color:'#7c3aed', borderBottom:'2px solid #ddd8fe',
              outline:'none', background:'transparent', marginBottom:20, padding:'8px 0',
              boxSizing:'border-box',
              animation: shake ? 'shake 0.5s ease' : 'none'
            }}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            placeholder="····"
          />
          {error && <p style={{ color:'#ef4444', fontSize:13, marginBottom:16 }}>{error}</p>}
          <button type="submit" style={{
            width:'100%', background:'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color:'white', fontWeight:800, padding:'14px 0', borderRadius:16,
            border:'none', cursor:'pointer', fontSize:16, display:'flex',
            alignItems:'center', justifyContent:'center', gap:8,
            boxShadow:'0 8px 20px rgba(124,58,237,0.3)', transition:'transform 0.1s'
          }}>
            <LogIn size={20}/> Open Our World
          </button>
        </form>
      </div>
    </div>
  );
};

// --- MAIN APP ---
function App() {
  // Auth & Settings
  const [isAuthenticated, setIsAuthenticated] = useStickyState(false, 'moonpie_auth');
  const firebaseSettings = useFirebaseDoc('moonpie_settings', 'config');
  const userNames = firebaseSettings?.names || { user1: 'Ali', user2: 'Fajar' };
  const appPin = firebaseSettings?.pin || '1430';

  const [newNameInputs, setNewNameInputs] = useState({ user1: '', user2: '' });
  const [showPin, setShowPin] = useState(false);

  // Views & Modals
  const [view, setView] = useState('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [budgetCycleStart, setBudgetCycleStart] = useStickyState(20, 'moonpie_cycle');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Data
  const expenses = useFirebaseSync('moonpie_expenses');
  const notes     = useFirebaseSync('moonpie_notes');
  const budgets   = useFirebaseSync('moonpie_budgets', null);

  // Form State
  const [newExpense, setNewExpense] = useState({
    amount: '', category: 'groceries', note: '',
    date: new Date().toISOString().split('T')[0], who: 'user1', type: 'debit'
  });
  const [newNote, setNewNote] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [budgetInputs, setBudgetInputs] = useState({ user1: '', user2: '' });

  // Toast System
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState(null);
  const pendingConfirm = useRef(null);
  const showConfirm = (title, message, confirmLabel = 'Delete') => new Promise(resolve => {
    pendingConfirm.current = resolve;
    setConfirmDialog({ title, message, confirmLabel });
  });
  const handleConfirmOk = () => {
    setConfirmDialog(null);
    pendingConfirm.current?.(true);
  };
  const handleConfirmCancel = () => {
    setConfirmDialog(null);
    pendingConfirm.current?.(false);
  };

  // --- DATE PARSER ---
  const parseDate = (str) => {
    if (!str) return new Date().toISOString().split('T')[0];
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const m = parseInt(parts[0], 10);
        const d = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        return `${y}-${m.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
      }
    }
    try { return new Date(str).toISOString().split('T')[0]; }
    catch { return new Date().toISOString().split('T')[0]; }
  };

  const resolveUser = (who) => {
    if (who === 'Ali'  || who === 'user1') return 'user1';
    if (who === 'Fajar'|| who === 'user2') return 'user2';
    return 'user1';
  };

  // --- HANDLERS ---
  const handleAddOrEditExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      showToast('Please enter a valid amount!', 'error'); return;
    }
    const expenseData = {
      ...newExpense,
      amount: Number(newExpense.amount),
      who: resolveUser(newExpense.who)
    };

    if (isEditing && newExpense.id) {
      const { id, ...dataWithoutId } = expenseData;
      await updateDoc(doc(db, 'moonpie_expenses', newExpense.id), dataWithoutId);
      showToast('Entry updated! ✨', 'success');
    } else {
      await addDoc(collection(db, 'moonpie_expenses'), { ...expenseData, createdAt: new Date().toISOString() });
      confetti({
        particleCount: 60, spread: 70, origin: { y: 0.7 },
        colors: newExpense.type === 'credit' ? ['#4ade80','#22c55e'] : ['#a855f7','#d8b4fe']
      });
      showToast(newExpense.type === 'credit' ? 'Income added! 💚' : 'Expense added! 💜', 'success');
    }

    setShowAddModal(false);
    setIsEditing(false);
    setNewExpense({ amount:'', category:'groceries', note:'', date: new Date().toISOString().split('T')[0], who:'user1', type:'debit' });
  };

  const handleEditClick = (item) => {
    setNewExpense({ ...item });
    setIsEditing(true);
    setShowAddModal(true);
  };

  const handleDuplicate = (item) => {
    const { id, createdAt, ...dataToCopy } = item;
    setNewExpense({ ...dataToCopy, date: new Date().toISOString().split('T')[0] });
    setIsEditing(false);
    setShowAddModal(true);
  };

  const handleDeleteExpense = async (id) => {
    const ok = await showConfirm('Remove Entry', 'This entry will be permanently deleted.', 'Delete');
    if (ok) { await deleteDoc(doc(db, 'moonpie_expenses', id)); showToast('Entry removed!', 'info'); }
  };

  const toggleSelectionMode = () => { setIsSelectionMode(v => !v); setSelectedIds(new Set()); };
  const toggleId = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === filteredExpenses.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
  };

  const handleBulkDelete = async () => {
    const ok = await showConfirm('Delete Selected', `Permanently delete ${selectedIds.size} item(s)?`, 'Delete All');
    if (!ok) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.delete(doc(db, 'moonpie_expenses', id)));
    try {
      await batch.commit();
      showToast(`${selectedIds.size} items deleted!`, 'info');
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      showToast('Error deleting items.', 'error');
    }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (selectedMonth === 'All') { showToast('Select a specific month first!', 'error'); return; }
    const budgetKey = `${selectedYear}-${selectedMonth}`;
    await setDoc(doc(db, 'moonpie_budgets', budgetKey), {
      user1: Number(budgetInputs.user1) || 0,
      user2: Number(budgetInputs.user2) || 0,
      year: selectedYear, month: selectedMonth
    });
    setShowBudgetModal(false);
    showToast('Budget updated! 💰', 'success');
  };

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) { showToast('No data to export!', 'error'); return; }
    const csvData = filteredExpenses.map(e => ({
      Date: e.date,
      Description: e.note || '',
      Category: CATEGORIES.find(c => c.id === e.category)?.label || e.category,
      Person: resolveUser(e.who) === 'user1' ? userNames.user1 : userNames.user2,
      Type: e.type === 'credit' ? 'Income' : 'Expense',
      Amount: e.amount
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `moonpie_${selectedYear}_${selectedMonth === 'All' ? 'all' : MONTH_NAMES[selectedMonth]}.csv`;
    link.click();
    showToast('CSV exported! 📊', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (rows.length === 0) { showToast('File looks empty!', 'error'); return; }
        const ok = await showConfirm('Import Data', `Import ${rows.length} rows from "${file.name}"?`, 'Import');
        if (!ok) return;

        const batch = writeBatch(db);
        let count = 0;
        rows.forEach(row => {
          const cleanRow = {};
          Object.keys(row).forEach(k => cleanRow[k.trim().toLowerCase()] = row[k]);
          const debit  = Number((cleanRow['debit']  || '0').toString().replace(/,/g,''));
          const credit = Number((cleanRow['credit'] || '0').toString().replace(/,/g,''));
          const comment    = cleanRow['comment'] || 'Imported';
          const formattedDate = parseDate(cleanRow['date & time'] || cleanRow['date'] || '');
          let amount = 0, type = 'debit';
          if (debit > 0)       { amount = debit;  type = 'debit';  }
          else if (credit > 0) { amount = credit; type = 'credit'; }
          if (amount > 0) {
            let cat = 'other';
            const lc = comment.toLowerCase();
            if (lc.includes('lunch')||lc.includes('dinner')||lc.includes('coffee')||lc.includes('bakery')) cat = 'dining';
            else if (lc.includes('indrive')||lc.includes('careem')||lc.includes('uber')) cat = 'transport';
            else if (lc.includes('load')||lc.includes('bill')) cat = 'utilities';
            else if (lc.includes('gym')||lc.includes('doctor')) cat = 'home';
            else if (lc.includes('pocket money')) cat = 'gifts';
            batch.set(doc(collection(db,'moonpie_expenses')), {
              amount, note: comment, date: formattedDate, category: cat,
              who: 'user2', type, createdAt: new Date().toISOString(), imported: true
            });
            count++;
          }
        });
        try {
          await batch.commit();
          showToast(`Imported ${count} entries! 🎉`, 'success');
          confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
        } catch (err) {
          console.error(err);
          showToast('Import failed. Check console.', 'error');
        }
        e.target.value = '';
      }
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await addDoc(collection(db,'moonpie_notes'), { text: newNote, createdAt: new Date().toISOString() });
    setNewNote('');
    showToast('Note pinned! 📌', 'success');
  };

  const handleDeleteNote = async (id) => {
    const ok = await showConfirm('Remove Note', 'This note will be deleted.', 'Remove');
    if (ok) { await deleteDoc(doc(db,'moonpie_notes', id)); showToast('Note removed!', 'info'); }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (newPinCode.length !== 4 || !/^\d{4}$/.test(newPinCode)) {
      showToast('PIN must be exactly 4 digits!', 'error'); return;
    }
    await setDoc(doc(db,'moonpie_settings','config'), { names: userNames, pin: newPinCode }, { merge: true });
    setIsAuthenticated(false);
    showToast('PIN updated! Please log in again.', 'info');
  };

  const handleUpdateNames = async (e) => {
    e.preventDefault();
    const updatedNames = {
      user1: newNameInputs.user1.trim() || userNames.user1,
      user2: newNameInputs.user2.trim() || userNames.user2
    };
    await setDoc(doc(db,'moonpie_settings','config'), { names: updatedNames, pin: appPin }, { merge: true });
    showToast('Names updated! 💜', 'success');
    setNewNameInputs({ user1:'', user2:'' });
  };

  // --- CALCULATIONS ---
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T12:00:00'); // noon to avoid TZ issues

      if (selectedMonth === 'All') return d.getFullYear() === selectedYear;

      // Salary-cycle filter: from cycleStart of (month-1) to cycleStart of (month)
      // selectedMonth is 0-based; new Date uses 0-based months too
      const targetStart = new Date(selectedYear, selectedMonth - 1, budgetCycleStart);
      const targetEnd   = new Date(selectedYear, selectedMonth,     budgetCycleStart);

      return d >= targetStart && d < targetEnd;
    }).filter(e => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = resolveUser(e.who) === 'user1' ? userNames.user1.toLowerCase() : userNames.user2.toLowerCase();
      const cat  = CATEGORIES.find(c => c.id === e.category)?.label.toLowerCase() || '';
      return (e.note || '').toLowerCase().includes(q) || cat.includes(q) || name.includes(q);
    });
  }, [expenses, selectedMonth, selectedYear, budgetCycleStart, searchQuery, userNames]);

  const stats = useMemo(() => {
    const user1Spent  = filteredExpenses.filter(e => resolveUser(e.who)==='user1' && e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const user2Spent  = filteredExpenses.filter(e => resolveUser(e.who)==='user2' && e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const user1Income = filteredExpenses.filter(e => resolveUser(e.who)==='user1' && e.type==='credit').reduce((a,c)=>a+c.amount,0);
    const user2Income = filteredExpenses.filter(e => resolveUser(e.who)==='user2' && e.type==='credit').reduce((a,c)=>a+c.amount,0);
    return { user1Spent, user2Spent, user1Income, user2Income, totalSpent: user1Spent+user2Spent };
  }, [filteredExpenses]);

  const budgetsData = useMemo(() => {
    if (selectedMonth === 'All') {
      const yearly = budgets.filter(b => b.year === selectedYear);
      return { user1: yearly.reduce((a,b)=>a+(b.user1||0),0), user2: yearly.reduce((a,b)=>a+(b.user2||0),0) };
    }
    const found = budgets.find(b => b.id === `${selectedYear}-${selectedMonth}`) || {};
    return { user1: found.user1||0, user2: found.user2||0 };
  }, [budgets, selectedMonth, selectedYear]);

  const remaining = {
    user1: (budgetsData.user1 + stats.user1Income) - stats.user1Spent,
    user2: (budgetsData.user2 + stats.user2Income) - stats.user2Spent
  };

  const cycleText = useMemo(() => {
    if (selectedMonth === 'All') return `Year ${selectedYear}`;
    const start = new Date(selectedYear, selectedMonth - 1, budgetCycleStart);
    const end   = new Date(selectedYear, selectedMonth,     budgetCycleStart - 1);
    return `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;
  }, [selectedMonth, selectedYear, budgetCycleStart]);

  // BUG FIX: PieChart was used as an icon — replaced with BarChart2 (lucide)
  const chartData = useMemo(() => {
    const map = {};
    filteredExpenses.filter(e => e.type !== 'credit').forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.keys(map)
      .map(k => ({ name: CATEGORIES.find(c=>c.id===k)?.label || k, value: map[k], color: CATEGORIES.find(c=>c.id===k)?.color || '#ccc' }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} storedPin={appPin} />;

  const totalNet = (stats.user1Income + stats.user2Income) - stats.totalSpent;

  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:'linear-gradient(160deg, #faf5ff 0%, #fdf2f8 50%, #fff1f5 100%)', paddingBottom:96, position:'relative' }}>
      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-heart { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes blob { 0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} }
        .handwriting { font-style:italic; font-family:'Georgia',serif; }
        .expense-row:active { transform:scale(0.98); }
        .modal-enter { animation: fadeUp 0.25s ease; }
        .nav-btn { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:4px; font-size:10px; font-weight:700; transition:color 0.2s; font-family:inherit; }
        select, input, button { font-family:inherit; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#e9d5ff; border-radius:4px; }
      `}</style>

      <ToastContainer toasts={toasts}/>
      <ConfirmDialog dialog={confirmDialog} onConfirm={handleConfirmOk} onCancel={handleConfirmCancel}/>

      {/* BG blobs */}
      <div style={{ position:'absolute', top:-40, left:-40, width:220, height:220, background:'#e9d5ff', borderRadius:'60% 40% 30% 70%/60% 30% 70% 40%', opacity:0.3, filter:'blur(40px)', animation:'blob 8s ease infinite' }}/>
      <div style={{ position:'absolute', top:-20, right:-40, width:200, height:200, background:'#fbcfe8', borderRadius:'30% 60% 70% 40%/50% 60% 30% 60%', opacity:0.3, filter:'blur(40px)', animation:'blob 10s ease infinite 2s' }}/>

      {/* HEADER */}
      <header style={{ padding:'24px 20px 12px', position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:8, margin:0 }}>
              Moon Pie
              <Heart size={22} color="#a855f7" fill="#a855f7" style={{ animation:'pulse-heart 2s ease infinite' }}/>
            </h1>
            <p style={{ color:'#94a3b8', fontSize:13, margin:'2px 0 0' }}>Our little world 🌍</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {view === 'expenses' && (
              <button onClick={toggleSelectionMode} style={{
                width:36, height:36, borderRadius:'50%', border:'none', cursor:'pointer',
                background: isSelectionMode ? '#1e293b' : 'white',
                color: isSelectionMode ? 'white' : '#94a3b8',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)'
              }}><ListChecks size={18}/></button>
            )}
            <label style={{ width:36, height:36, borderRadius:'50%', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', color:'#94a3b8' }}>
              <Upload size={18}/>
              <input type="file" accept=".csv" onChange={handleImport} style={{ display:'none' }}/>
            </label>
            <button onClick={handleExportCSV} style={{ width:36, height:36, borderRadius:'50%', border:'none', cursor:'pointer', background:'white', color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
              <TrendingUp size={18}/>
            </button>
          </div>
        </div>

        {/* BULK ACTION BAR */}
        {isSelectionMode && (
          <div style={{ background:'#1e293b', color:'white', borderRadius:16, padding:'12px 16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={selectAll} style={{ background:'none', border:'none', color:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13, fontFamily:'inherit' }}>
                <CheckSquare size={16}/> {selectedIds.size === filteredExpenses.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize:13, fontWeight:700, color:'#94a3b8' }}>{selectedIds.size} selected</span>
            </div>
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} style={{ background:'#ef4444', color:'white', border:'none', borderRadius:10, padding:'6px 12px', fontWeight:700, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontFamily:'inherit' }}>
                <Trash2 size={13}/> Delete
              </button>
            )}
          </div>
        )}

        {/* BUDGET CARDS */}
        {!isSelectionMode && view === 'expenses' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { key:'user1', name: userNames.user1, color:'#3b82f6', bg:'#eff6ff', spent: stats.user1Spent, income: stats.user1Income },
              { key:'user2', name: userNames.user2, color:'#a855f7', bg:'#faf5ff', spent: stats.user2Spent, income: stats.user2Income }
            ].map(u => {
              const rem = (budgetsData[u.key] + u.income) - u.spent;
              const total = budgetsData[u.key] + u.income || 1;
              const pct = Math.min((u.spent / total) * 100, 100);
              return (
                <div key={u.key}
                  onClick={() => { if (selectedMonth !== 'All') { setBudgetInputs({user1: budgetsData.user1, user2: budgetsData.user2}); setShowBudgetModal(true); }}}
                  style={{ background:'rgba(255,255,255,0.7)', backdropFilter:'blur(8px)', borderRadius:20, padding:12, border:'1px solid rgba(255,255,255,0.8)', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', cursor:'pointer' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:u.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <User size={12} color={u.color}/>
                    </div>
                    <span style={{ fontWeight:700, color:'#334155', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</span>
                  </div>
                  <p style={{ fontSize:9, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Remaining</p>
                  <p style={{ fontSize:20, fontWeight:800, color: rem < 0 ? '#ef4444' : '#1e293b', margin:0 }}>
                    {rem < 0 ? '−' : ''}Rs {Math.abs(rem).toLocaleString()}
                  </p>
                  <div style={{ width:'100%', background:'#e2e8f0', borderRadius:99, height:5, marginTop:8, overflow:'hidden' }}>
                    <div style={{ height:5, borderRadius:99, background: rem < 0 ? '#ef4444' : u.color, width:`${pct}%`, transition:'width 0.6s ease' }}/>
                  </div>
                  {u.income > 0 && <p style={{ fontSize:9, color:'#22c55e', fontWeight:700, marginTop:4 }}>+Rs {u.income.toLocaleString()} income</p>}
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main style={{ padding:'0 16px', position:'relative', zIndex:10 }}>
        {/* EXPENSES VIEW */}
        {view === 'expenses' && (
          <>
            {/* Month/Year Filter + Search */}
            {!isSelectionMode && (
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                    style={{ flex:1, background:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:14, padding:'8px 12px', fontSize:13, fontWeight:700, color:'#334155', outline:'none' }}
                  >
                    <option value="All">All Months</option>
                    {MONTH_NAMES.map((m,i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    style={{ background:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:14, padding:'8px 12px', fontSize:13, fontWeight:700, color:'#334155', outline:'none' }}
                  >
                    {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ position:'relative' }}>
                  <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
                  <input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.8)', borderRadius:14, padding:'8px 12px 8px 34px', fontSize:13, color:'#334155', outline:'none' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }}><X size={14}/></button>
                  )}
                </div>
              </div>
            )}

            {/* CHART */}
            {!isSelectionMode && (
              <div style={{ background:'rgba(255,255,255,0.75)', backdropFilter:'blur(12px)', borderRadius:24, padding:20, boxShadow:'0 4px 20px rgba(0,0,0,0.06)', border:'1px solid rgba(255,255,255,0.8)', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  {/* BUG FIX: was using PieChart (recharts component) as a lucide icon. Now uses BarChart2 from lucide */}
                  <h2 style={{ fontWeight:700, color:'#334155', fontSize:15, display:'flex', alignItems:'center', gap:8, margin:0 }}>
                    <BarChart2 size={17} color="#a855f7"/> Spending Breakdown
                  </h2>
                  <span style={{ fontSize:10, color:'#94a3b8', background:'#f1f5f9', padding:'4px 10px', borderRadius:99 }}>{cycleText}</span>
                </div>

                {chartData.length > 0 ? (
                  <>
                    <div style={{ height:180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={4} dataKey="value">
                            {chartData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                          </Pie>
                          <ChartTooltip formatter={(val) => [`Rs ${Number(val).toLocaleString()}`, '']} contentStyle={{ borderRadius:12, border:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', fontSize:12 }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Category legend rows */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                      {chartData.slice(0,4).map((item,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
                            <span style={{ fontSize:12, color:'#475569', fontWeight:600 }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700, color:'#334155' }}>Rs {item.value.toLocaleString()}</span>
                        </div>
                      ))}
                      {chartData.length > 4 && <p style={{ fontSize:11, color:'#94a3b8', textAlign:'center', margin:'2px 0 0' }}>+{chartData.length-4} more categories</p>}
                    </div>

                    {/* Net summary */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
                      <div style={{ textAlign:'center', flex:1 }}>
                        <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Total Spent</p>
                        <p style={{ fontSize:15, fontWeight:800, color:'#ef4444', margin:0 }}>Rs {stats.totalSpent.toLocaleString()}</p>
                      </div>
                      <div style={{ width:1, height:32, background:'#f1f5f9' }}/>
                      <div style={{ textAlign:'center', flex:1 }}>
                        <p style={{ fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', margin:'0 0 2px' }}>Net Balance</p>
                        <p style={{ fontSize:15, fontWeight:800, color: totalNet >= 0 ? '#22c55e' : '#ef4444', margin:0 }}>
                          {totalNet >= 0 ? '+' : '−'}Rs {Math.abs(totalNet).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ height:120, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Sparkles size={28} color="#d8b4fe"/>
                    <p style={{ color:'#94a3b8', fontSize:13, margin:0 }}>No expenses yet — start tracking! 👇</p>
                  </div>
                )}
              </div>
            )}

            {/* EXPENSE LIST */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, paddingBottom:20 }}>
              {filteredExpenses.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8', fontSize:14 }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No entries for this period 🗓️'}
                </div>
              )}
              {filteredExpenses.map(expense => {
                const isCredit = expense.type === 'credit';
                const Cat = isCredit ? { icon: DollarSign, color:'#22c55e', label:'Income' } : (CATEGORIES.find(c=>c.id===expense.category) || CATEGORIES[7]);
                const Icon = Cat.icon;
                const isSelected = selectedIds.has(expense.id);
                let personName = resolveUser(expense.who) === 'user1' ? userNames.user1 : userNames.user2;

                return (
                  <div key={expense.id}
                    onClick={() => isSelectionMode && toggleId(expense.id)}
                    className="expense-row"
                    style={{
                      background:'white', padding:'12px 14px', borderRadius:18,
                      boxShadow:'0 2px 10px rgba(0,0,0,0.05)',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      cursor: isSelectionMode ? 'pointer' : 'default',
                      outline: isSelected ? '2px solid #a855f7' : 'none',
                      background: isSelected ? '#faf5ff' : 'white',
                      animation:'fadeUp 0.2s ease'
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {isSelectionMode ? (
                        <div style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${isSelected ? '#a855f7' : '#e2e8f0'}`, background: isSelected ? '#a855f7' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isSelected && <Check size={12} color="white"/>}
                        </div>
                      ) : (
                        <div style={{ width:44, height:44, borderRadius:14, background:Cat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 12px ${Cat.color}40` }}>
                          <Icon size={20} color="white"/>
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight:700, color:'#1e293b', fontSize:14, margin:'0 0 3px' }}>{expense.note || Cat.label}</p>
                        <p style={{ fontSize:11, color:'#94a3b8', margin:0, display:'flex', alignItems:'center', gap:4 }}>
                          <Calendar size={10}/> {expense.date} · {personName}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontWeight:800, fontSize:15, color: isCredit ? '#22c55e' : '#1e293b' }}>
                          {isCredit ? '+' : ''}Rs {expense.amount.toLocaleString()}
                        </span>
                      </div>
                      {!isSelectionMode && (
                        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                          <button onClick={e=>{e.stopPropagation();handleEditClick(expense)}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#cbd5e1' }} title="Edit"><Edit2 size={13}/></button>
                          <button onClick={e=>{e.stopPropagation();handleDuplicate(expense)}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#cbd5e1' }} title="Duplicate"><Copy size={13}/></button>
                          <button onClick={e=>{e.stopPropagation();handleDeleteExpense(expense.id)}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#fca5a5' }} title="Delete"><Trash2 size={13}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* NOTES VIEW */}
        {view === 'notes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#fef9c3', padding:16, borderRadius:20, border:'1px solid #fde68a', transform:'rotate(0.5deg)' }}>
              <h3 style={{ fontWeight:700, color:'#92400e', marginBottom:10, display:'flex', alignItems:'center', gap:8, fontSize:15 }}>
                <MessageCircle size={17}/> Fridge Notes
              </h3>
              <form onSubmit={handleAddNote} style={{ display:'flex', gap:8 }}>
                <input
                  style={{ flex:1, background:'rgba(255,255,255,0.6)', border:'none', borderRadius:12, padding:'8px 12px', fontSize:13, outline:'none' }}
                  placeholder="Leave a sweet note... 💌"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
                <button type="submit" style={{ background:'#fbbf24', border:'none', borderRadius:12, padding:'8px 12px', cursor:'pointer', color:'#78350f', display:'flex', alignItems:'center' }}>
                  <Plus size={18}/>
                </button>
              </form>
            </div>

            {notes.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'#94a3b8', fontSize:14 }}>
                No notes yet — leave a sweet message! 💜
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingBottom:20 }}>
              {notes.map((note, idx) => {
                const palettes = [
                  { bg:'#f3e8ff', color:'#6b21a8' },
                  { bg:'#dbeafe', color:'#1e40af' },
                  { bg:'#dcfce7', color:'#166534' },
                  { bg:'#fce7f3', color:'#9d174d' },
                  { bg:'#fff7ed', color:'#9a3412' },
                ];
                const p = palettes[idx % palettes.length];
                return (
                  <div key={note.id} style={{ background:p.bg, padding:16, borderRadius:20, position:'relative' }}
                    className="group">
                    {/* BUG FIX: was using font-handwriting CSS class which was undefined. Now uses inline style */}
                    <p className="handwriting" style={{ color:p.color, fontSize:15, lineHeight:1.5, marginBottom:24 }}>{note.text}</p>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ position:'absolute', bottom:10, right:10, background:'none', border:'none', cursor:'pointer', color:`${p.color}60`, padding:4 }}
                    ><Trash2 size={13}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {view === 'settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp 0.3s ease' }}>

            {/* Names */}
            <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)', borderRadius:24, padding:20, border:'1px solid rgba(255,255,255,0.8)' }}>
              <h2 style={{ fontWeight:700, color:'#1e293b', fontSize:16, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <User size={17} color="#a855f7"/> Custom Names
              </h2>
              <form onSubmit={handleUpdateNames} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#3b82f6', textTransform:'uppercase', marginBottom:6 }}>User 1 Name (Blue)</label>
                  <input
                    style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'10px 14px', outline:'none', fontSize:14 }}
                    placeholder={userNames.user1}
                    value={newNameInputs.user1}
                    onChange={e => setNewNameInputs({...newNameInputs, user1: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#a855f7', textTransform:'uppercase', marginBottom:6 }}>User 2 Name (Purple)</label>
                  <input
                    style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'10px 14px', outline:'none', fontSize:14 }}
                    placeholder={userNames.user2}
                    value={newNameInputs.user2}
                    onChange={e => setNewNameInputs({...newNameInputs, user2: e.target.value})}
                  />
                </div>
                <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>Leave blank to keep current names.</p>
                <button type="submit" style={{ background:'#1e293b', color:'white', border:'none', borderRadius:14, padding:'11px 0', fontWeight:700, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>
                  Update Names
                </button>
              </form>
            </div>

            {/* Cycle Settings */}
            <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)', borderRadius:24, padding:20, border:'1px solid rgba(255,255,255,0.8)' }}>
              <h2 style={{ fontWeight:700, color:'#1e293b', fontSize:16, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={17} color="#a855f7"/> Cycle Settings
              </h2>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <label style={{ fontSize:13, fontWeight:700, color:'#475569' }}>Salary Date:</label>
                <select
                  value={budgetCycleStart}
                  onChange={e => setBudgetCycleStart(Number(e.target.value))}
                  style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'8px 12px', outline:'none', fontWeight:700, fontSize:13, fontFamily:'inherit' }}
                >
                  {[1,5,10,15,20,25,28].map(d => <option key={d} value={d}>{d}th</option>)}
                </select>
              </div>
              <p style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>Current Cycle: {cycleText}</p>
            </div>

            {/* Security */}
            <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)', borderRadius:24, padding:20, border:'1px solid rgba(255,255,255,0.8)' }}>
              <h2 style={{ fontWeight:700, color:'#1e293b', fontSize:16, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <Lock size={17} color="#a855f7"/> Security
              </h2>
              <form onSubmit={handleChangePin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', marginBottom:6 }}>Change PIN</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      type="password"
                      maxLength="4"
                      style={{ flex:1, background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:14, padding:'10px 14px', textAlign:'center', fontSize:18, fontWeight:800, letterSpacing:'0.5em', outline:'none' }}
                      placeholder="••••"
                      value={newPinCode}
                      onChange={e => setNewPinCode(e.target.value.replace(/\D/g,''))}
                    />
                    <button type="submit" style={{ background:'#a855f7', color:'white', border:'none', borderRadius:14, padding:'0 16px', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Update
                    </button>
                  </div>
                </div>
                {/* BUG FIX: PIN no longer shown in plaintext — use masked display with toggle */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>
                    Current PIN: <span style={{ fontFamily:'monospace', background:'#f1f5f9', padding:'2px 8px', borderRadius:6, fontWeight:700 }}>
                      {showPin ? appPin : '••••'}
                    </span>
                  </p>
                  <button type="button" onClick={() => setShowPin(v=>!v)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}>
                    {showPin ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </form>
            </div>

            {/* Logout */}
            <button
              onClick={() => setIsAuthenticated(false)}
              style={{ width:'100%', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:18, padding:'14px 0', fontWeight:700, cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}
            >
              <LogOut size={18}/> Logout
            </button>
          </div>
        )}
      </main>

      {/* FLOATING ADD BUTTON */}
      {view === 'expenses' && !isSelectionMode && (
        <button
          onClick={() => {
            setIsEditing(false);
            setNewExpense({ amount:'', category:'groceries', note:'', date: new Date().toISOString().split('T')[0], who:'user1', type:'debit' });
            setShowAddModal(true);
          }}
          style={{
            position:'fixed', bottom:80, right:20, width:56, height:56, borderRadius:'50%',
            background:'linear-gradient(135deg, #1e293b, #334155)',
            color:'white', border:'3px solid white', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 24px rgba(0,0,0,0.2)', zIndex:40, transition:'transform 0.15s'
          }}
        >
          <Plus size={26}/>
        </button>
      )}

      {/* BOTTOM NAV */}
      <nav style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430, background:'rgba(255,255,255,0.88)',
        backdropFilter:'blur(16px)', borderTop:'1px solid #f1f5f9',
        padding:'12px 0 20px', display:'flex', justifyContent:'space-around',
        alignItems:'center', zIndex:40
      }}>
        {[
          { key:'expenses', icon: Wallet,      label:'Wallet' },
          { key:'notes',    icon: MessageCircle,label:'Notes'  },
          { key:'settings', icon: Settings,     label:'Settings'}
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setView(key)} className="nav-btn"
            style={{ color: view === key ? '#a855f7' : '#94a3b8', position:'relative' }}>
            <Icon size={22}/>
            <span style={{ fontSize:10, fontWeight:700 }}>{label}</span>
            {view === key && <div style={{ position:'absolute', bottom:-8, width:20, height:3, background:'#a855f7', borderRadius:99 }}/>}
          </button>
        ))}
      </nav>

      {/* ADD / EDIT EXPENSE MODAL */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 0 0' }}>
          <div className="modal-enter" style={{ background:'white', width:'100%', maxWidth:430, borderRadius:'28px 28px 0 0', padding:24, boxShadow:'0 -8px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontWeight:800, color:'#1e293b', fontSize:18, margin:0 }}>{isEditing ? 'Edit Entry' : 'Add New Entry'}</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background:'#f1f5f9', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={18}/></button>
            </div>
            <form onSubmit={handleAddOrEditExpense} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Debit/Credit toggle */}
              <div style={{ display:'flex', background:'#f1f5f9', borderRadius:14, padding:4 }}>
                {[{v:'debit',label:'Expense',color:'#ef4444'},{v:'credit',label:'Income',color:'#22c55e'}].map(t => (
                  <button key={t.v} type="button"
                    onClick={() => setNewExpense({...newExpense, type: t.v})}
                    style={{ flex:1, padding:'9px 0', borderRadius:10, fontWeight:700, fontSize:13, border:'none', cursor:'pointer', fontFamily:'inherit',
                      background: newExpense.type === t.v ? t.color : 'transparent',
                      color: newExpense.type === t.v ? 'white' : '#94a3b8',
                      boxShadow: newExpense.type === t.v ? `0 2px 8px ${t.color}40` : 'none',
                      transition:'all 0.2s'
                    }}>{t.label}</button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Amount</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontWeight:700, fontSize:14 }}>Rs</span>
                  <input
                    type="number"
                    autoFocus
                    style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'2px solid #e2e8f0', borderRadius:14, padding:'12px 14px 12px 42px', fontWeight:800, fontSize:18, outline:'none' }}
                    placeholder="0"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  />
                </div>
              </div>

              {/* Category */}
              {newExpense.type === 'debit' && (
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:8 }}>Category</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setNewExpense({...newExpense, category: cat.id})}
                        style={{
                          padding:'8px 4px', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                          border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                          background: newExpense.category === cat.id ? '#1e293b' : '#f8fafc',
                          color: newExpense.category === cat.id ? 'white' : '#64748b',
                          transform: newExpense.category === cat.id ? 'scale(1.05)' : 'scale(1)',
                          boxShadow: newExpense.category === cat.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                        }}
                      >
                        <cat.icon size={16}/>
                        <span style={{ fontSize:9, fontWeight:700, textAlign:'center' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Who */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Date</label>
                  <input type="date"
                    style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'2px solid #e2e8f0', borderRadius:14, padding:'10px 12px', fontSize:13, fontWeight:600, outline:'none', fontFamily:'inherit' }}
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Who?</label>
                  <select
                    style={{ width:'100%', background:'#f8fafc', border:'2px solid #e2e8f0', borderRadius:14, padding:'10px 12px', fontSize:13, fontWeight:600, outline:'none', fontFamily:'inherit' }}
                    value={newExpense.who}
                    onChange={e => setNewExpense({...newExpense, who: e.target.value})}
                  >
                    <option value="user1">{userNames.user1}</option>
                    <option value="user2">{userNames.user2}</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', marginBottom:6 }}>Note (Optional)</label>
                <input
                  style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'2px solid #e2e8f0', borderRadius:14, padding:'10px 14px', fontSize:13, fontWeight:600, outline:'none', fontFamily:'inherit' }}
                  placeholder={newExpense.type==='debit' ? 'e.g. Dinner at Monal' : 'e.g. Salary, Refund'}
                  value={newExpense.note}
                  onChange={e => setNewExpense({...newExpense, note: e.target.value})}
                />
              </div>

              <button type="submit" style={{
                width:'100%', color:'white', padding:'14px 0', borderRadius:18, fontWeight:800, fontSize:16,
                border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background: newExpense.type==='credit' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
                boxShadow: newExpense.type==='credit' ? '0 6px 20px rgba(34,197,94,0.3)' : '0 6px 20px rgba(168,85,247,0.3)'
              }}>
                <Plus size={20}/> {isEditing ? 'Update Entry' : newExpense.type==='credit' ? 'Add Income' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BUDGET MODAL */}
      {showBudgetModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="modal-enter" style={{ background:'white', width:'100%', maxWidth:360, borderRadius:28, padding:24, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontWeight:800, color:'#1e293b', fontSize:18, marginBottom:20 }}>
              Set Budgets for {MONTH_NAMES[selectedMonth]}
            </h3>
            <form onSubmit={handleUpdateBudget} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[{key:'user1',name:userNames.user1,color:'#3b82f6'},{key:'user2',name:userNames.user2,color:'#a855f7'}].map(u => (
                <div key={u.key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:u.color, textTransform:'uppercase', marginBottom:6 }}>
                    {u.name}'s Budget
                  </label>
                  <input type="number"
                    style={{ width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'2px solid #e2e8f0', borderRadius:14, padding:'12px 14px', fontWeight:800, fontSize:18, outline:'none', fontFamily:'inherit' }}
                    placeholder="0"
                    value={budgetInputs[u.key]}
                    onChange={e => setBudgetInputs({...budgetInputs, [u.key]: e.target.value})}
                  />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="button" onClick={() => setShowBudgetModal(false)}
                  style={{ flex:1, background:'#f1f5f9', color:'#475569', border:'none', borderRadius:14, padding:'12px 0', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                <button type="submit"
                  style={{ flex:1, background:'#22c55e', color:'white', border:'none', borderRadius:14, padding:'12px 0', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App/>);
