import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Heart, ShoppingBag, Utensils, Zap, Car, Home, Film, Gift,
  Plus, Calendar, Trash2, Edit2, MessageCircle, DollarSign, X, Check,
  Lock, LogIn, Upload, Wallet, Settings, LogOut, TrendingUp, Copy,
  ListChecks, CheckSquare, User, BarChart2, Search, AlertTriangle,
  Bell, Eye, EyeOff, Sparkles, Star
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';
import confetti from "canvas-confetti";
import Papa from "papaparse";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, updateDoc,
  onSnapshot, query, orderBy, writeBatch, setDoc
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// ─── FIREBASE ────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAOFOgjdbdoUYBTldXOEEG636q1EM8EBfc",
  authDomain: "leanaxis-accounts.firebaseapp.com",
  projectId: "leanaxis-accounts",
  storageBucket: "leanaxis-accounts.firebasestorage.app",
  messagingSenderId: "855221056961",
  appId: "1:855221056961:web:b4129012fa0f56f58a6b40"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id:'groceries', label:'Groceries',  icon:ShoppingBag, color:'#7c3aed' },
  { id:'dining',    label:'Dining',     icon:Utensils,    color:'#a78bfa' },
  { id:'utilities', label:'Bills',      icon:Zap,         color:'#f59e0b' },
  { id:'transport', label:'Transport',  icon:Car,         color:'#0891b2' },
  { id:'home',      label:'Home',       icon:Home,        color:'#059669' },
  { id:'dates',     label:'Date Night', icon:Film,        color:'#db2777' },
  { id:'gifts',     label:'Gifts',      icon:Gift,        color:'#9333ea' },
  { id:'other',     label:'Other',      icon:DollarSign,  color:'#64748b' },
];

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const getGreeting = name => {
  const h = new Date().getHours();
  if (h < 5)  return `Sweet dreams, ${name} 🌙`;
  if (h < 12) return `Good morning, ${name} ☀️`;
  if (h < 17) return `Good afternoon, ${name} 🌸`;
  if (h < 21) return `Good evening, ${name} 🌷`;
  return `Good night, ${name} 💜`;
};

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700;800&display=swap');

  @keyframes heartbeat {
    0%,100%{transform:scale(1)} 15%{transform:scale(1.32)}
    30%{transform:scale(1)}    45%{transform:scale(1.18)}
  }
  @keyframes shimmer {
    0%{background-position:200% center} 100%{background-position:-200% center}
  }
  @keyframes shake {
    0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-7px)} 40%,80%{transform:translateX(7px)}
  }
  @keyframes toastDrop {
    from{opacity:0;transform:translateY(-18px) scale(0.88)} to{opacity:1;transform:translateY(0) scale(1)}
  }
  @keyframes fadeUp {
    from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}
  }
  @keyframes popIn {
    from{opacity:0;transform:scale(0.84)} to{opacity:1;transform:scale(1)}
  }
  @keyframes petals {
    0%  { transform:translateY(-10px) rotate(0deg)   scale(1);   opacity:0.7; }
    100%{ transform:translateY(110vh) rotate(540deg) scale(0.4); opacity:0;   }
  }
  @keyframes pulse-ring {
    0%  { box-shadow:0 0 0 0   rgba(124,58,237,0.45); }
    70% { box-shadow:0 0 0 14px rgba(124,58,237,0);   }
    100%{ box-shadow:0 0 0 0   rgba(124,58,237,0);    }
  }

  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
  body {
    font-family:'Quicksand',sans-serif;
    background:#faf5ff;
    -webkit-tap-highlight-color:transparent;
    overflow-x:hidden;
  }
  select,input,button,textarea { font-family:'Quicksand',sans-serif; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type=number] { -moz-appearance:textfield; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:#ddd6fe; border-radius:4px; }

  .row-enter   { animation:fadeUp 0.22s ease both; }
  .modal-slide { animation:fadeUp 0.3s cubic-bezier(.34,1.2,.64,1) both; }
  .nav-btn {
    background:none; border:none; cursor:pointer;
    display:flex; flex-direction:column; align-items:center; gap:3px;
    font-weight:800; transition:color 0.2s; font-family:inherit;
    padding:0; min-width:72px;
  }
  .nav-btn:active  { transform:scale(0.9); }
  .card-tap        { transition:transform 0.15s; }
  .card-tap:active { transform:scale(0.97); }
  .fab:active      { transform:scale(0.9) !important; }

  .shimmer-text {
    background:linear-gradient(90deg,#7c3aed,#c4b5fd,#7c3aed,#a78bfa,#7c3aed);
    background-size:200% auto;
    -webkit-background-clip:text;
    -webkit-text-fill-color:transparent;
    background-clip:text;
    animation:shimmer 3s linear infinite;
  }
  .petal {
    position:fixed; pointer-events:none; z-index:0;
    animation:petals 9s linear infinite;
  }
`;

// ─── FLOATING PETALS ─────────────────────────────────────────────────────────
function Petals() {
  const items = ['🌸','💜','✨','🌷','💫','🪷','⭐','💐'];
  return (
    <>
      {items.map((p, i) => (
        <span key={i} className="petal" style={{
          left:`${8 + i * 11}%`, top:'-20px',
          fontSize:12 + (i % 4) * 4,
          animationDelay:`${i * 1.2}s`,
          animationDuration:`${8 + (i % 3) * 1.5}s`,
          opacity:0.55,
        }}>{p}</span>
      ))}
    </>
  );
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useFirebaseSync(col, orderByField = "createdAt") {
  const [data, setData] = useState([]);
  useEffect(() => {
    const q = orderByField
      ? query(collection(db, col), orderBy(orderByField, "desc"))
      : collection(db, col);
    return onSnapshot(q, snap =>
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [col, orderByField]);
  return data;
}

function useFirebaseDoc(col, docId) {
  const [data, setData] = useState(null);
  useEffect(() => {
    return onSnapshot(doc(db, col, docId), d => {
      if (d.exists()) setData(d.data());
    });
  }, [col, docId]);
  return data;
}

function useStickyState(def, key) {
  const [val, setVal] = useState(() => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(val)); }, [key, val]);
  return [val, setVal];
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{
      position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
      zIndex:99999, display:'flex', flexDirection:'column', alignItems:'center',
      gap:8, pointerEvents:'none', width:'100%', maxWidth:380, padding:'0 16px'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:10, padding:'12px 20px',
          borderRadius:99, boxShadow:'0 8px 32px rgba(124,58,237,0.28)',
          fontSize:13, fontWeight:700, whiteSpace:'nowrap',
          background: t.type==='success'
            ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
            : t.type==='error' ? '#ef4444' : '#475569',
          color:'white',
          animation:'toastDrop 0.35s cubic-bezier(.34,1.56,.64,1)',
        }}>
          {t.type==='success' ? <Heart size={13} fill="white" color="white"/> :
           t.type==='error'   ? <AlertTriangle size={13}/> : <Bell size={13}/>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function ConfirmDialog({ dialog, onOk, onCancel }) {
  if (!dialog) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(20,0,40,0.5)',
      backdropFilter:'blur(8px)', zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center', padding:24
    }}>
      <div style={{
        background:'white', borderRadius:28, padding:28, width:'100%', maxWidth:320,
        boxShadow:'0 24px 64px rgba(124,58,237,0.22)',
        animation:'popIn 0.25s cubic-bezier(.34,1.56,.64,1)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#f3e8ff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle size={20} color="#7c3aed"/>
          </div>
          <h3 style={{ fontWeight:800, color:'#1e293b', fontSize:16 }}>{dialog.title}</h3>
        </div>
        <p style={{ color:'#64748b', fontSize:13, marginBottom:22, paddingLeft:56 }}>{dialog.message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{
            flex:1, background:'#f1f5f9', color:'#475569', border:'none',
            borderRadius:14, padding:'12px 0', fontWeight:800, cursor:'pointer', fontSize:14
          }}>Cancel</button>
          <button onClick={onOk} style={{
            flex:1, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white',
            border:'none', borderRadius:14, padding:'12px 0', fontWeight:800, cursor:'pointer', fontSize:14,
            boxShadow:'0 4px 14px rgba(124,58,237,0.35)'
          }}>{dialog.confirmLabel || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, storedPin, names }) {
  const [pin,   setPin]   = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const wifeName = names?.user2 || 'Fajar';
  const hubName  = names?.user1 || 'Ali';

  const tryPin = p => {
    if (p.length < 4) return;
    if (p === storedPin) {
      confetti({ particleCount:90, spread:90, origin:{y:0.65},
        colors:['#7c3aed','#c4b5fd','#ddd6fe','#a78bfa','#ede9fe'] });
      setTimeout(() => onLogin(), 350);
    } else {
      setShake(true);
      setTimeout(() => { setPin(''); setError('Wrong PIN 💜 Try again'); setShake(false); }, 700);
    }
  };

  const pressKey = k => {
    if (shake) return;
    if (k === '⌫') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) tryPin(next);
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(160deg,#faf5ff 0%,#ede9fe 55%,#f5f3ff 100%)',
      padding:24, position:'relative', overflow:'hidden'
    }}>
      <style>{CSS}</style>
      <Petals/>
      <div style={{
        background:'rgba(255,255,255,0.9)', backdropFilter:'blur(24px)',
        padding:'40px 32px', borderRadius:40,
        boxShadow:'0 32px 80px rgba(124,58,237,0.2)',
        width:'100%', maxWidth:320, textAlign:'center',
        border:'1px solid rgba(167,139,250,0.35)',
        animation:'popIn 0.45s cubic-bezier(.34,1.56,.64,1)',
        position:'relative', zIndex:10
      }}>
        {/* Pulsing heart */}
        <div style={{
          width:88, height:88, borderRadius:'50%',
          background:'linear-gradient(135deg,#ede9fe,#ddd6fe)',
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 20px', animation:'pulse-ring 2.5s ease infinite'
        }}>
          <Heart size={40} color="#7c3aed" fill="#7c3aed"
            style={{ animation:'heartbeat 2s ease infinite' }}/>
        </div>

        {/* Wife FIRST */}
        <div style={{ marginBottom:6 }}>
          <span className="shimmer-text" style={{ fontSize:26, fontWeight:800 }}>{wifeName}</span>
          <span style={{ fontSize:22, margin:'0 6px' }}>💜</span>
          <span style={{ fontSize:20, fontWeight:700, color:'#6d28d9' }}>{hubName}</span>
        </div>
        <p style={{ fontSize:11, fontWeight:700, color:'#a78bfa', letterSpacing:3,
          textTransform:'uppercase', marginBottom:30 }}>Our Secret Space</p>

        {/* PIN dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:26 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width:15, height:15, borderRadius:'50%',
              background: pin.length > i ? '#7c3aed' : '#ede9fe',
              border:`2px solid ${pin.length > i ? '#7c3aed' : '#c4b5fd'}`,
              transition:'all 0.2s cubic-bezier(.34,1.56,.64,1)',
              transform: pin.length > i ? 'scale(1.25)' : 'scale(1)',
              animation: shake ? 'shake 0.6s ease' : 'none',
            }}/>
          ))}
        </div>

        {/* Keypad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button key={i} type="button"
              onClick={() => k !== '' && pressKey(String(k))}
              style={{
                padding:'15px 0', borderRadius:18, border:'none',
                cursor: k==='' ? 'default' : 'pointer',
                fontWeight:800, fontSize:20,
                background: k==='' ? 'transparent' : k==='⌫' ? '#f3e8ff' : 'rgba(124,58,237,0.07)',
                color: k==='⌫' ? '#7c3aed' : '#1e293b',
                visibility: k==='' ? 'hidden' : 'visible',
                transition:'transform 0.1s, background 0.15s',
                boxShadow: k==='' ? 'none' : '0 2px 8px rgba(124,58,237,0.08)',
              }}
              onMouseDown={e => { if (k!=='') e.currentTarget.style.transform='scale(0.88)'; }}
              onMouseUp={e   => { e.currentTarget.style.transform='scale(1)'; }}
            >{k}</button>
          ))}
        </div>

        {error
          ? <p style={{ color:'#7c3aed', fontSize:13, fontWeight:700 }}>{error}</p>
          : <div style={{ height:20 }}/>
        }
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useStickyState(false, 'moonpie_auth');
  const firebaseSettings = useFirebaseDoc('moonpie_settings', 'config');
  const userNames = firebaseSettings?.names || { user1:'Ali', user2:'Fajar' };
  const appPin    = firebaseSettings?.pin   || '1430';

  // Wife = user2, ALWAYS shown first
  const wifeName = userNames.user2;
  const hubName  = userNames.user1;

  const [view, setView]               = useState('expenses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [showPin, setShowPin]         = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());
  const [searchQuery,   setSearchQuery]   = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]         = useState(new Set());

  const expenses = useFirebaseSync('moonpie_expenses');
  const notes    = useFirebaseSync('moonpie_notes');

  const emptyExpense = () => ({
    amount:'', category:'groceries', note:'',
    date: new Date().toISOString().split('T')[0],
    who:'user2',   // wife is default
    type:'debit'
  });
  const [newExpense, setNewExpense] = useState(emptyExpense());
  const [newNote,    setNewNote]    = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [nameInputs, setNameInputs] = useState({ user2:'', user1:'' });

  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const pendingResolve      = useRef(null);

  const toast = (message, type='success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  const showConfirm = (title, message, confirmLabel='Delete') =>
    new Promise(res => { pendingResolve.current = res; setDialog({ title, message, confirmLabel }); });
  const onConfirmOk     = () => { setDialog(null); pendingResolve.current?.(true);  };
  const onConfirmCancel = () => { setDialog(null); pendingResolve.current?.(false); };

  const resolveUser = w => (w==='Ali' || w==='user1') ? 'user1' : 'user2';

  const parseDate = str => {
    if (!str) return new Date().toISOString().split('T')[0];
    if (str.includes('/')) {
      const pts = str.split('/');
      if (pts.length === 3) {
        const [m,d,y] = pts.map(Number);
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
    }
    try { return new Date(str).toISOString().split('T')[0]; }
    catch { return new Date().toISOString().split('T')[0]; }
  };

  // ─── CALCULATIONS ─────────────────────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    let list = expenses.filter(e => {
      if (!e.date) return false;
      const d = new Date(e.date + 'T12:00:00');
      if (selectedMonth === 'All') return d.getFullYear() === selectedYear;
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e => {
        const cat  = CATEGORIES.find(c => c.id === e.category)?.label.toLowerCase() || '';
        const name = resolveUser(e.who)==='user2' ? wifeName.toLowerCase() : hubName.toLowerCase();
        return (e.note||'').toLowerCase().includes(q) || cat.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [expenses, selectedMonth, selectedYear, searchQuery, wifeName, hubName]);

  // ─────────────────────────────────────────────────────────────────────────
  //  BUDGET LOGIC — FIXED & SIMPLE
  //
  //  Balance   = Total "Add Money" entries (credit) for that person this period
  //  Remaining = Balance − Total expenses (debit) for that person this period
  //
  //  There is NO separate budget collection involved.
  //  This eliminates ALL double-counting bugs completely.
  // ─────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const wifeDebits  = filteredExpenses.filter(e => resolveUser(e.who)==='user2' && e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const hubDebits   = filteredExpenses.filter(e => resolveUser(e.who)==='user1' && e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const wifeCredits = filteredExpenses.filter(e => resolveUser(e.who)==='user2' && e.type==='credit').reduce((a,c)=>a+c.amount,0);
    const hubCredits  = filteredExpenses.filter(e => resolveUser(e.who)==='user1' && e.type==='credit').reduce((a,c)=>a+c.amount,0);
    return {
      wifeDebits, hubDebits, wifeCredits, hubCredits,
      wifeBalance:  wifeCredits  - wifeDebits,   // remaining balance for wife
      hubBalance:   hubCredits   - hubDebits,    // remaining balance for hub
      totalSpent:   wifeDebits   + hubDebits,
      totalAdded:   wifeCredits  + hubCredits,
    };
  }, [filteredExpenses]);

  const chartData = useMemo(() => {
    const map = {};
    filteredExpenses.filter(e => e.type !== 'credit').forEach(e => {
      map[e.category] = (map[e.category]||0) + e.amount;
    });
    return Object.keys(map)
      .map(k => ({
        name:  CATEGORIES.find(c=>c.id===k)?.label || k,
        value: map[k],
        color: CATEGORIES.find(c=>c.id===k)?.color || '#ccc'
      }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // ─── HANDLERS ─────────────────────────────────────────────────────────────
  const handleAddOrEditExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      toast('Enter a valid amount!', 'error'); return;
    }
    const data = {
      ...newExpense,
      amount: Number(newExpense.amount),
      who:    resolveUser(newExpense.who),
    };
    if (isEditing && newExpense.id) {
      const { id, ...rest } = data;
      await updateDoc(doc(db,'moonpie_expenses',newExpense.id), rest);
      toast('Updated ✨');
    } else {
      await addDoc(collection(db,'moonpie_expenses'), { ...data, createdAt:new Date().toISOString() });
      confetti({
        particleCount:60, spread:70, origin:{y:0.7},
        colors:['#7c3aed','#c4b5fd','#ddd6fe','#ede9fe'],
      });
      if (data.type === 'credit') {
        const pName = resolveUser(data.who)==='user2' ? wifeName : hubName;
        toast(`Rs ${data.amount.toLocaleString()} added to ${pName}'s balance 💜`);
      } else {
        toast('Expense added 💜');
      }
    }
    setShowAddModal(false);
    setIsEditing(false);
    setNewExpense(emptyExpense());
  };

  const handleEditClick = item => {
    setNewExpense({ ...item });
    setIsEditing(true);
    setShowAddModal(true);
  };
  const handleDuplicate = item => {
    const { id, createdAt, ...copy } = item;
    setNewExpense({ ...copy, date: new Date().toISOString().split('T')[0] });
    setIsEditing(false);
    setShowAddModal(true);
  };
  const handleDelete = async id => {
    const ok = await showConfirm('Remove Entry', 'This entry will be permanently deleted.');
    if (ok) { await deleteDoc(doc(db,'moonpie_expenses',id)); toast('Removed','info'); }
  };

  const toggleSelectionMode = () => { setIsSelectionMode(v=>!v); setSelectedIds(new Set()); };
  const toggleId = id => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const selectAll = () =>
    selectedIds.size === filteredExpenses.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(filteredExpenses.map(e=>e.id)));

  const handleBulkDelete = async () => {
    const ok = await showConfirm('Delete Selected',`Delete ${selectedIds.size} item(s) forever?`,'Delete All');
    if (!ok) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.delete(doc(db,'moonpie_expenses',id)));
    try {
      await batch.commit();
      toast(`${selectedIds.size} items deleted`,'info');
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    } catch { toast('Delete failed','error'); }
  };

  const handleExportCSV = () => {
    if (!filteredExpenses.length) { toast('No data to export!','error'); return; }
    const csv = Papa.unparse(filteredExpenses.map(e => ({
      Date:        e.date,
      Description: e.note || '',
      Category:    CATEGORIES.find(c=>c.id===e.category)?.label || e.category,
      Person:      resolveUser(e.who)==='user2' ? wifeName : hubName,
      Type:        e.type==='credit' ? 'Money Added' : 'Expense',
      Amount:      e.amount,
    })));
    Object.assign(document.createElement('a'), {
      href:     URL.createObjectURL(new Blob([csv],{ type:'text/csv;charset=utf-8;' })),
      download: `moonpie_${selectedYear}_${selectedMonth==='All'?'all':MONTH_NAMES[selectedMonth]}.csv`,
    }).click();
    toast('Exported 📊');
  };

  const handleImport = e => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async ({ data:rows }) => {
        if (!rows.length) { toast('File is empty!','error'); return; }
        const ok = await showConfirm('Import Data',`Import ${rows.length} rows from "${file.name}"?`,'Import');
        if (!ok) return;
        const batch = writeBatch(db); let count = 0;
        rows.forEach(row => {
          const r = {};
          Object.keys(row).forEach(k => r[k.trim().toLowerCase()] = row[k]);
          const debit  = Number((r.debit  ||'0').toString().replace(/,/g,''));
          const credit = Number((r.credit ||'0').toString().replace(/,/g,''));
          const comment = r.comment || 'Imported';
          const date    = parseDate(r['date & time'] || r.date || '');
          let amount=0, type='debit';
          if (debit>0)        { amount=debit;  type='debit';  }
          else if (credit>0)  { amount=credit; type='credit'; }
          if (amount > 0) {
            let cat = 'other';
            const lc = comment.toLowerCase();
            if (lc.includes('lunch')||lc.includes('dinner')||lc.includes('coffee')||lc.includes('bakery')) cat='dining';
            else if (lc.includes('indrive')||lc.includes('careem')||lc.includes('uber')) cat='transport';
            else if (lc.includes('load')||lc.includes('bill')) cat='utilities';
            else if (lc.includes('gym')||lc.includes('doctor')) cat='home';
            else if (lc.includes('pocket money')) cat='gifts';
            batch.set(doc(collection(db,'moonpie_expenses')), {
              amount, note:comment, date, category:cat, who:'user2', type,
              createdAt:new Date().toISOString(), imported:true,
            });
            count++;
          }
        });
        try {
          await batch.commit();
          confetti({ particleCount:100, spread:100, origin:{y:0.6}, colors:['#7c3aed','#c4b5fd','#ddd6fe'] });
          toast(`Imported ${count} entries! 🎉`);
        } catch { toast('Import failed','error'); }
        e.target.value = '';
      }
    });
  };

  const handleAddNote = async e => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await addDoc(collection(db,'moonpie_notes'), { text:newNote, createdAt:new Date().toISOString() });
    setNewNote('');
    toast('Note pinned 📌');
  };

  const handleDeleteNote = async id => {
    const ok = await showConfirm('Remove Note','This note will be gone forever.');
    if (ok) { await deleteDoc(doc(db,'moonpie_notes',id)); toast('Removed','info'); }
  };

  const handleChangePin = async e => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPinCode)) { toast('PIN must be 4 digits!','error'); return; }
    await setDoc(doc(db,'moonpie_settings','config'), { names:userNames, pin:newPinCode }, { merge:true });
    toast('PIN updated! Logging out...','info');
    setTimeout(() => setIsAuthenticated(false), 1200);
  };

  const handleUpdateNames = async e => {
    e.preventDefault();
    const updated = {
      user2: nameInputs.user2.trim() || wifeName,
      user1: nameInputs.user1.trim() || hubName,
    };
    await setDoc(doc(db,'moonpie_settings','config'), { names:updated, pin:appPin }, { merge:true });
    toast('Names updated 💜');
    setNameInputs({ user2:'', user1:'' });
  };

  if (!isAuthenticated)
    return <Login onLogin={() => setIsAuthenticated(true)} storedPin={appPin} names={userNames}/>;

  const monthLabel = selectedMonth==='All'
    ? `All of ${selectedYear}`
    : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth:430, margin:'0 auto', minHeight:'100vh',
      background:'linear-gradient(160deg,#faf5ff 0%,#f3e8ff 55%,#faf5ff 100%)',
      paddingBottom:100, position:'relative', fontFamily:"'Quicksand',sans-serif"
    }}>
      <style>{CSS}</style>
      <Petals/>
      <ToastContainer toasts={toasts}/>
      <ConfirmDialog dialog={dialog} onOk={onConfirmOk} onCancel={onConfirmCancel}/>

      {/* Blobs */}
      <div style={{ position:'fixed',top:-80,left:-80,width:300,height:300,
        background:'#ede9fe',borderRadius:'60% 40% 30% 70%/60% 30% 70% 40%',
        opacity:0.55,filter:'blur(60px)',pointerEvents:'none',zIndex:0 }}/>
      <div style={{ position:'fixed',bottom:80,right:-60,width:240,height:240,
        background:'#ddd6fe',borderRadius:'40% 60% 70% 30%/50% 40% 60% 50%',
        opacity:0.4,filter:'blur(55px)',pointerEvents:'none',zIndex:0 }}/>

      {/* ══ HEADER ══ */}
      <header style={{ padding:'20px 20px 0', position:'relative', zIndex:10 }}>

        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
              <span className="shimmer-text" style={{ fontSize:21, fontWeight:800 }}>{wifeName}</span>
              <Heart size={18} color="#7c3aed" fill="#7c3aed"
                style={{ animation:'heartbeat 2.2s ease infinite', flexShrink:0 }}/>
              <span style={{ fontSize:18, fontWeight:700, color:'#6d28d9' }}>{hubName}</span>
            </div>
            <p style={{ color:'#a78bfa', fontSize:12, fontWeight:700 }}>{getGreeting(wifeName)}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {view==='expenses' && (
              <button onClick={toggleSelectionMode} style={{
                width:36, height:36, borderRadius:'50%', border:'none', cursor:'pointer',
                background: isSelectionMode ? '#7c3aed' : 'rgba(255,255,255,0.9)',
                color: isSelectionMode ? 'white' : '#a78bfa',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 2px 10px rgba(124,58,237,0.12)',
              }}><ListChecks size={17}/></button>
            )}
            <label style={{
              width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.9)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', boxShadow:'0 2px 10px rgba(124,58,237,0.12)', color:'#a78bfa',
            }}>
              <Upload size={17}/>
              <input type="file" accept=".csv" onChange={handleImport} style={{ display:'none' }}/>
            </label>
            <button onClick={handleExportCSV} style={{
              width:36, height:36, borderRadius:'50%', border:'none', cursor:'pointer',
              background:'rgba(255,255,255,0.9)', color:'#a78bfa',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 2px 10px rgba(124,58,237,0.12)',
            }}><TrendingUp size={17}/></button>
          </div>
        </div>

        {/* Bulk bar */}
        {isSelectionMode && (
          <div style={{ background:'#1e293b', color:'white', borderRadius:18,
            padding:'12px 16px', marginBottom:14,
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={selectAll} style={{
                background:'none', border:'none', color:'white', cursor:'pointer',
                display:'flex', alignItems:'center', gap:6, fontWeight:800, fontSize:13
              }}>
                <CheckSquare size={16}/>
                {selectedIds.size===filteredExpenses.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize:12, color:'#94a3b8', fontWeight:700 }}>{selectedIds.size} selected</span>
            </div>
            {selectedIds.size>0 && (
              <button onClick={handleBulkDelete} style={{
                background:'#ef4444', color:'white', border:'none',
                borderRadius:10, padding:'6px 14px', fontWeight:800, fontSize:12,
                cursor:'pointer', display:'flex', alignItems:'center', gap:6,
              }}>
                <Trash2 size={13}/> Delete
              </button>
            )}
          </div>
        )}

        {/* ══ BALANCE CARDS — wife first, ONLY remaining shown ══ */}
        {!isSelectionMode && view==='expenses' && (
          <>
            {/* Together strip */}
            <div style={{
              background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
              borderRadius:24, padding:'16px 20px', marginBottom:12,
              display:'flex', alignItems:'center', justifyContent:'space-between',
              boxShadow:'0 10px 32px rgba(124,58,237,0.32)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:8,  right:56, fontSize:22, opacity:0.18 }}>✨</div>
              <div style={{ position:'absolute', bottom:6, right:18, fontSize:16, opacity:0.18 }}>💫</div>
              <div>
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:10, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>Together This Month</p>
                <p style={{ color:'white', fontWeight:800, fontSize:22 }}>
                  Rs {stats.totalSpent.toLocaleString()}
                  <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginLeft:6 }}>spent</span>
                </p>
              </div>
              {stats.totalAdded > 0 && (
                <div style={{ textAlign:'right' }}>
                  <p style={{ color:'#a5f3c8', fontSize:12, fontWeight:800 }}>
                    +Rs {stats.totalAdded.toLocaleString()}
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.55)', fontSize:10, fontWeight:600 }}>added this month</p>
                </div>
              )}
            </div>

            {/* Per-person — wife FIRST */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { key:'user2', name:wifeName, accent:'#7c3aed', light:'#ede9fe', balance:stats.wifeBalance, added:stats.wifeCredits, spent:stats.wifeDebits, crown:true  },
                { key:'user1', name:hubName,  accent:'#6d28d9', light:'#f3e8ff', balance:stats.hubBalance,  added:stats.hubCredits,  spent:stats.hubDebits,  crown:false },
              ].map(u => {
                const hasData  = u.added > 0 || u.spent > 0;
                const isNeg    = u.balance < 0;
                // progress: how much of the added money has been spent
                const pct = u.added > 0 ? Math.min((u.spent / u.added) * 100, 100) : 0;

                return (
                  <div key={u.key} style={{
                    background:'rgba(255,255,255,0.93)', backdropFilter:'blur(12px)',
                    borderRadius:24, padding:16,
                    border:`1px solid rgba(196,181,253,${isNeg ? '0.7' : '0.35'})`,
                    boxShadow: isNeg
                      ? '0 4px 20px rgba(239,68,68,0.1)'
                      : '0 4px 20px rgba(124,58,237,0.08)',
                    position:'relative', overflow:'hidden',
                  }}>
                    {/* Top accent line */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
                      background:`linear-gradient(90deg,${u.accent},${u.accent}55)`,
                      borderRadius:'24px 24px 0 0' }}/>

                    {/* Name */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12, paddingTop:4 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:u.light,
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <User size={13} color={u.accent}/>
                      </div>
                      <span style={{ fontWeight:800, color:'#1e293b', fontSize:13,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {u.name}
                      </span>
                      {u.crown && <span style={{ fontSize:12 }}>👑</span>}
                    </div>

                    {/* Balance — the ONLY number shown */}
                    <p style={{ fontSize:10, fontWeight:800, color:u.accent,
                      textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>
                      Balance
                    </p>
                    {hasData ? (
                      <p style={{ fontSize:24, fontWeight:800, color: isNeg ? '#ef4444' : '#1e293b',
                        letterSpacing:'-0.5px', lineHeight:1 }}>
                        Rs {Math.abs(u.balance).toLocaleString()}
                        {isNeg && <span style={{ fontSize:11, color:'#ef4444', display:'block', fontWeight:700, marginTop:2 }}>short</span>}
                      </p>
                    ) : (
                      <p style={{ fontSize:13, color:'#c4b5fd', fontWeight:700, lineHeight:1.3 }}>
                        Add money{'\n'}to start 💜
                      </p>
                    )}

                    {/* Thin progress bar (spent / added) */}
                    {u.added > 0 && (
                      <div style={{ width:'100%', background:'#ede9fe', borderRadius:99,
                        height:4, marginTop:10, overflow:'hidden' }}>
                        <div style={{
                          height:4, borderRadius:99,
                          background: isNeg
                            ? '#ef4444'
                            : `linear-gradient(90deg,${u.accent},${u.accent}88)`,
                          width:`${pct}%`,
                          transition:'width 0.7s ease',
                        }}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ padding:'0 16px', position:'relative', zIndex:10 }}>

        {/* ══ EXPENSES VIEW ══ */}
        {view==='expenses' && (
          <>
            {!isSelectionMode && (
              <div style={{ marginBottom:14 }}>
                {/* Filters */}
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <select value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value==='All' ? 'All' : Number(e.target.value))}
                    style={{ flex:1, background:'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(196,181,253,0.4)', borderRadius:14,
                      padding:'9px 12px', fontSize:13, fontWeight:700, color:'#334155', outline:'none' }}>
                    <option value="All">All Months</option>
                    {MONTH_NAMES.map((m,i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    style={{ background:'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(196,181,253,0.4)', borderRadius:14,
                      padding:'9px 12px', fontSize:13, fontWeight:700, color:'#334155', outline:'none' }}>
                    {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {/* Search */}
                <div style={{ position:'relative' }}>
                  <Search size={14} style={{ position:'absolute', left:12, top:'50%',
                    transform:'translateY(-50%)', color:'#c4b5fd' }}/>
                  <input placeholder="Search expenses..." value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(196,181,253,0.4)', borderRadius:14,
                      padding:'9px 32px 9px 32px', fontSize:13, color:'#334155',
                      outline:'none', fontWeight:600 }}/>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                        background:'none', border:'none', cursor:'pointer', color:'#c4b5fd', padding:0 }}>
                      <X size={14}/>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chart */}
            {!isSelectionMode && (
              <div style={{ background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)',
                borderRadius:26, padding:20,
                boxShadow:'0 4px 24px rgba(124,58,237,0.09)',
                border:'1px solid rgba(196,181,253,0.3)', marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontWeight:800, color:'#4c1d95', fontSize:14,
                    display:'flex', alignItems:'center', gap:7, margin:0 }}>
                    <BarChart2 size={16} color="#7c3aed"/> Where did it go?
                  </h2>
                  <span style={{ fontSize:10, color:'#a78bfa', background:'#f5f3ff',
                    padding:'4px 10px', borderRadius:99, fontWeight:800 }}>
                    {monthLabel}
                  </span>
                </div>
                {chartData.length > 0 ? (
                  <>
                    {/* BUG FIX: outerRadius used = not : */}
                    <div style={{ height:156 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%"
                            innerRadius={36} outerRadius={62}
                            paddingAngle={4} dataKey="value">
                            {chartData.map((entry, i) => (
                              <Cell key={i} fill={entry.color}/>
                            ))}
                          </Pie>
                          <ChartTooltip
                            formatter={v => [`Rs ${Number(v).toLocaleString()}`, '']}
                            contentStyle={{ borderRadius:14, border:'none',
                              boxShadow:'0 4px 20px rgba(124,58,237,0.15)', fontSize:12 }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
                      {chartData.slice(0,5).map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ width:9, height:9, borderRadius:'50%',
                              background:item.color, flexShrink:0 }}/>
                            <span style={{ fontSize:12, color:'#4c1d95', fontWeight:700 }}>{item.name}</span>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <span style={{ fontSize:11, color:'#a78bfa', fontWeight:700 }}>
                              {stats.totalSpent > 0 ? Math.round(item.value/stats.totalSpent*100) : 0}%
                            </span>
                            <span style={{ fontSize:12, fontWeight:800, color:'#1e293b',
                              minWidth:72, textAlign:'right' }}>
                              Rs {item.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {chartData.length > 5 && (
                        <p style={{ fontSize:11, color:'#a78bfa', textAlign:'center',
                          margin:'2px 0 0', fontWeight:700 }}>
                          +{chartData.length-5} more
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ height:90, display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Sparkles size={24} color="#c4b5fd"/>
                    <p style={{ color:'#a78bfa', fontSize:13, margin:0, fontWeight:700 }}>
                      No expenses yet this period 💜
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expense list */}
            <div style={{ display:'flex', flexDirection:'column', gap:9, paddingBottom:20 }}>
              {filteredExpenses.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 20px',
                  color:'#a78bfa', fontSize:14, fontWeight:700 }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'Nothing here yet 🗓️'}
                </div>
              )}
              {filteredExpenses.map(exp => {
                const isCredit = exp.type === 'credit';
                const Cat = isCredit
                  ? { icon:Star, color:'#7c3aed', label:'Money Added' }
                  : (CATEGORIES.find(c => c.id===exp.category) || CATEGORIES[7]);
                const Icon   = Cat.icon;
                const isSel  = selectedIds.has(exp.id);
                const isWife = resolveUser(exp.who) === 'user2';
                const pName  = isWife ? wifeName : hubName;
                const pColor = isWife ? '#7c3aed' : '#6d28d9';

                return (
                  <div key={exp.id}
                    onClick={() => isSelectionMode && toggleId(exp.id)}
                    className="row-enter"
                    style={{
                      background: isSel ? '#f5f3ff' : 'rgba(255,255,255,0.93)',
                      padding:'13px 14px', borderRadius:20,
                      boxShadow: isSel
                        ? '0 0 0 2px #7c3aed, 0 4px 16px rgba(124,58,237,0.12)'
                        : '0 2px 12px rgba(124,58,237,0.06)',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      cursor: isSelectionMode ? 'pointer' : 'default',
                      border:'1px solid rgba(196,181,253,0.25)',
                    }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      {isSelectionMode ? (
                        <div style={{ width:22, height:22, borderRadius:'50%',
                          border:`2px solid ${isSel ? '#7c3aed' : '#ddd6fe'}`,
                          background: isSel ? '#7c3aed' : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isSel && <Check size={12} color="white"/>}
                        </div>
                      ) : (
                        <div style={{ width:44, height:44, borderRadius:14, background:Cat.color,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                          boxShadow:`0 4px 14px ${Cat.color}55` }}>
                          <Icon size={19} color="white"/>
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight:800, color:'#1e293b', fontSize:14, margin:'0 0 3px' }}>
                          {exp.note || Cat.label}
                        </p>
                        <p style={{ fontSize:11, color:'#a78bfa', margin:0, fontWeight:700,
                          display:'flex', alignItems:'center', gap:4 }}>
                          <Calendar size={9}/>{exp.date}
                          <span style={{ color:'#ddd6fe' }}>·</span>
                          <span style={{ color:pColor, fontWeight:800 }}>{pName}</span>
                        </p>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:800, fontSize:15,
                        color: isCredit ? '#7c3aed' : '#1e293b' }}>
                        {isCredit ? '+' : '−'} Rs {exp.amount.toLocaleString()}
                      </span>
                      {!isSelectionMode && (
                        <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                          <button onClick={e => { e.stopPropagation(); handleEditClick(exp); }}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#ddd6fe' }}>
                            <Edit2 size={12}/>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDuplicate(exp); }}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#ddd6fe' }}>
                            <Copy size={12}/>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(exp.id); }}
                            style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:'#fca5a5' }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══ NOTES VIEW ══ */}
        {view==='notes' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', padding:18,
              borderRadius:24, border:'1px dashed #c4b5fd',
              boxShadow:'0 4px 20px rgba(124,58,237,0.1)', transform:'rotate(-0.4deg)' }}>
              <h3 style={{ fontWeight:800, color:'#6d28d9', marginBottom:12, fontSize:15,
                display:'flex', alignItems:'center', gap:8 }}>
                <MessageCircle size={16}/> Leave a note for {wifeName} 💜
              </h3>
              <form onSubmit={handleAddNote} style={{ display:'flex', gap:8 }}>
                <input
                  style={{ flex:1, background:'rgba(255,255,255,0.8)', border:'1px solid #ddd6fe',
                    borderRadius:14, padding:'10px 14px', fontSize:13, outline:'none',
                    fontWeight:600, color:'#334155' }}
                  placeholder="A sweet message... 💌"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}/>
                <button type="submit" style={{
                  background:'linear-gradient(135deg,#7c3aed,#6d28d9)', border:'none',
                  borderRadius:14, padding:'10px 14px', cursor:'pointer', color:'white',
                  display:'flex', alignItems:'center',
                  boxShadow:'0 4px 12px rgba(124,58,237,0.3)',
                }}><Plus size={18}/></button>
              </form>
            </div>

            {notes.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px',
                color:'#a78bfa', fontSize:14, fontWeight:700 }}>
                No notes yet — leave a sweet message! 💜
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, paddingBottom:20 }}>
              {/* BUG FIX: was <Trash2 size:13/> — fixed to size={13} */}
              {notes.map((note, idx) => {
                const palettes = [
                  { bg:'#f5f3ff', color:'#5b21b6', border:'#ddd6fe' },
                  { bg:'#ede9fe', color:'#4c1d95', border:'#c4b5fd' },
                  { bg:'#faf5ff', color:'#6d28d9', border:'#e9d5ff' },
                  { bg:'#f3e8ff', color:'#7c3aed', border:'#ddd6fe' },
                  { bg:'#fff7ed', color:'#92400e', border:'#fde68a' },
                ];
                const p = palettes[idx % palettes.length];
                return (
                  <div key={note.id} style={{ background:p.bg, padding:16, borderRadius:22,
                    position:'relative', border:`1px solid ${p.border}`,
                    transform:`rotate(${idx%2===0?'0.6':'-0.5'}deg)`,
                    boxShadow:'0 4px 16px rgba(124,58,237,0.07)',
                    transition:'transform 0.2s' }}>
                    <p style={{ color:p.color, fontSize:14, lineHeight:1.6, marginBottom:24,
                      fontStyle:'italic', fontFamily:'Georgia,serif' }}>{note.text}</p>
                    <button onClick={() => handleDeleteNote(note.id)} style={{
                      position:'absolute', bottom:8, right:8, background:'none',
                      border:'none', cursor:'pointer', color:`${p.color}55`, padding:4 }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ SETTINGS VIEW ══ */}
        {view==='settings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14, animation:'fadeUp 0.3s ease' }}>

            {/* Names — wife first */}
            <div style={{ background:'rgba(255,255,255,0.93)', backdropFilter:'blur(8px)',
              borderRadius:26, padding:22,
              border:'1px solid rgba(196,181,253,0.3)',
              boxShadow:'0 4px 20px rgba(124,58,237,0.07)' }}>
              <h2 style={{ fontWeight:800, color:'#4c1d95', fontSize:16, margin:'0 0 18px',
                display:'flex', alignItems:'center', gap:8 }}>
                <Heart size={16} color="#7c3aed" fill="#7c3aed"/> Our Names
              </h2>
              <form onSubmit={handleUpdateNames} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  { key:'user2', label:"Wife's Name", hint:wifeName, color:'#7c3aed', crown:true  },
                  { key:'user1', label:"Husband's Name", hint:hubName, color:'#6d28d9', crown:false },
                ].map(u => (
                  <div key={u.key}>
                    <label style={{ display:'block', fontSize:11, fontWeight:800, color:u.color,
                      textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>
                      {u.label} {u.crown && '👑'}
                    </label>
                    <input
                      style={{ width:'100%', boxSizing:'border-box', background:'#f5f3ff',
                        border:`1.5px solid ${u.color}25`, borderRadius:14,
                        padding:'11px 14px', outline:'none', fontSize:14,
                        fontWeight:700, color:'#334155' }}
                      placeholder={u.hint}
                      value={nameInputs[u.key]}
                      onChange={e => setNameInputs({...nameInputs, [u.key]:e.target.value})}/>
                  </div>
                ))}
                <p style={{ fontSize:11, color:'#a78bfa', margin:0, fontWeight:700 }}>
                  Leave blank to keep current names.
                </p>
                <button type="submit" style={{
                  background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white',
                  border:'none', borderRadius:16, padding:'13px 0', fontWeight:800,
                  cursor:'pointer', fontSize:14,
                  boxShadow:'0 6px 18px rgba(124,58,237,0.32)',
                }}>Save Names</button>
              </form>
            </div>

            {/* Security */}
            <div style={{ background:'rgba(255,255,255,0.93)', backdropFilter:'blur(8px)',
              borderRadius:26, padding:22,
              border:'1px solid rgba(196,181,253,0.3)',
              boxShadow:'0 4px 20px rgba(124,58,237,0.07)' }}>
              <h2 style={{ fontWeight:800, color:'#4c1d95', fontSize:16, margin:'0 0 18px',
                display:'flex', alignItems:'center', gap:8 }}>
                <Lock size={16} color="#7c3aed"/> Security
              </h2>
              <form onSubmit={handleChangePin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#6d28d9',
                    textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>New PIN</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="password" maxLength="4"
                      style={{ flex:1, background:'#f5f3ff', border:'1.5px solid #ddd6fe',
                        borderRadius:14, padding:'10px 14px', textAlign:'center',
                        fontSize:22, fontWeight:800, letterSpacing:'0.6em', outline:'none' }}
                      placeholder="••••"
                      value={newPinCode}
                      onChange={e => setNewPinCode(e.target.value.replace(/\D/g,''))}/>
                    <button type="submit" style={{
                      background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white',
                      border:'none', borderRadius:14, padding:'0 18px',
                      fontWeight:800, cursor:'pointer', fontSize:13,
                    }}>Save</button>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <p style={{ fontSize:12, color:'#a78bfa', margin:0, fontWeight:700 }}>
                    Current PIN:{' '}
                    <span style={{ fontFamily:'monospace', background:'#f5f3ff',
                      padding:'2px 10px', borderRadius:8, fontWeight:800, color:'#6d28d9' }}>
                      {showPin ? appPin : '••••'}
                    </span>
                  </p>
                  <button type="button" onClick={() => setShowPin(v=>!v)} style={{
                    background:'none', border:'none', cursor:'pointer', color:'#a78bfa',
                    padding:0, display:'flex', alignItems:'center',
                  }}>
                    {showPin ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                </div>
              </form>
            </div>

            <button onClick={() => setIsAuthenticated(false)} style={{
              width:'100%', background:'rgba(255,255,255,0.9)', color:'#7c3aed',
              border:'1.5px solid #ddd6fe', borderRadius:20, padding:'14px 0',
              fontWeight:800, cursor:'pointer', fontSize:14,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 2px 12px rgba(124,58,237,0.08)',
            }}>
              <LogOut size={17}/> Logout
            </button>
          </div>
        )}
      </main>

      {/* ══ FAB ══ */}
      {view==='expenses' && !isSelectionMode && (
        <button className="fab"
          onClick={() => { setIsEditing(false); setNewExpense(emptyExpense()); setShowAddModal(true); }}
          style={{
            position:'fixed', bottom:84, right:20, width:60, height:60, borderRadius:'50%',
            background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white',
            border:'3px solid white', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 30px rgba(124,58,237,0.45)', zIndex:40,
            animation:'pulse-ring 3s ease infinite',
          }}>
          <Plus size={28}/>
        </button>
      )}

      {/* ══ BOTTOM NAV ══ */}
      <nav style={{
        position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
        width:'100%', maxWidth:430,
        background:'rgba(255,255,255,0.94)', backdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(196,181,253,0.4)',
        padding:'10px 0 22px', display:'flex', justifyContent:'space-around',
        alignItems:'center', zIndex:40,
      }}>
        {[
          { key:'expenses', Icon:Wallet,       label:'Wallet'   },
          { key:'notes',    Icon:MessageCircle, label:'Notes'    },
          { key:'settings', Icon:Settings,      label:'Settings' },
        ].map(({ key, Icon, label }) => (
          <button key={key} onClick={() => setView(key)} className="nav-btn"
            style={{ color: view===key ? '#7c3aed' : '#c4b5fd', position:'relative' }}>
            <Icon size={22}/>
            <span style={{ fontSize:10 }}>{label}</span>
            {view===key && (
              <div style={{ position:'absolute', bottom:-2, width:22, height:3,
                background:'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius:99 }}/>
            )}
          </button>
        ))}
      </nav>

      {/* ══ ADD / EDIT MODAL ══ */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(20,0,40,0.45)',
          backdropFilter:'blur(8px)', zIndex:50,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div className="modal-slide" style={{
            background:'white', width:'100%', maxWidth:430,
            borderRadius:'30px 30px 0 0', padding:24,
            boxShadow:'0 -16px 60px rgba(124,58,237,0.2)',
            maxHeight:'92vh', overflowY:'auto',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ fontWeight:800, color:'#1e293b', fontSize:18 }}>
                {isEditing ? 'Edit Entry' : 'New Entry'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{
                background:'#f3e8ff', border:'none', borderRadius:'50%',
                width:36, height:36, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed',
              }}><X size={18}/></button>
            </div>

            <form onSubmit={handleAddOrEditExpense} style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Type toggle */}
              <div style={{ display:'flex', background:'#f5f3ff', borderRadius:16, padding:4 }}>
                {[
                  { v:'debit',  label:'💸 Expense',   c:'#7c3aed' },
                  { v:'credit', label:'💜 Add Money',  c:'#059669' },
                ].map(t => (
                  <button key={t.v} type="button"
                    onClick={() => setNewExpense({...newExpense, type:t.v})}
                    style={{ flex:1, padding:'10px 0', borderRadius:12, fontWeight:800,
                      fontSize:13, border:'none', cursor:'pointer', transition:'all 0.2s',
                      background: newExpense.type===t.v ? t.c : 'transparent',
                      color: newExpense.type===t.v ? 'white' : '#a78bfa',
                      boxShadow: newExpense.type===t.v ? `0 4px 14px ${t.c}40` : 'none',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Hint for Add Money */}
              {newExpense.type==='credit' && (
                <div style={{ background:'#f5f3ff', borderRadius:14, padding:'10px 14px',
                  display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:16 }}>💡</span>
                  <p style={{ fontSize:12, color:'#6d28d9', margin:0, fontWeight:700 }}>
                    This adds directly to the selected person's balance.
                  </p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#a78bfa',
                  textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Amount</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
                    color:'#a78bfa', fontWeight:800, fontSize:15 }}>Rs</span>
                  <input type="number" autoFocus value={newExpense.amount}
                    onChange={e => setNewExpense({...newExpense, amount:e.target.value})}
                    style={{ width:'100%', boxSizing:'border-box', background:'#f5f3ff',
                      border:`2px solid ${newExpense.type==='credit' ? '#6ee7b7' : '#ddd6fe'}`,
                      borderRadius:16, padding:'14px 14px 14px 46px',
                      fontWeight:800, fontSize:22, outline:'none',
                      transition:'border-color 0.2s', color:'#1e293b' }}
                    placeholder="0"/>
                </div>
              </div>

              {/* Category (expenses only) */}
              {newExpense.type==='debit' && (
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#a78bfa',
                    textTransform:'uppercase', letterSpacing:1.5, marginBottom:8 }}>Category</label>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setNewExpense({...newExpense, category:cat.id})}
                        style={{ padding:'10px 4px', borderRadius:16,
                          display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                          border:'none', cursor:'pointer', transition:'all 0.15s',
                          background: newExpense.category===cat.id ? cat.color : '#f5f3ff',
                          color: newExpense.category===cat.id ? 'white' : '#7c3aed',
                          transform: newExpense.category===cat.id ? 'scale(1.06)' : 'scale(1)',
                          boxShadow: newExpense.category===cat.id ? `0 4px 14px ${cat.color}50` : 'none',
                        }}>
                        <cat.icon size={17}/>
                        <span style={{ fontSize:9, fontWeight:800, textAlign:'center' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Who — wife FIRST in dropdown */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#a78bfa',
                    textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Date</label>
                  <input type="date" value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date:e.target.value})}
                    style={{ width:'100%', boxSizing:'border-box', background:'#f5f3ff',
                      border:'1.5px solid #ddd6fe', borderRadius:14,
                      padding:'11px 12px', fontSize:13, fontWeight:700, outline:'none' }}/>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#a78bfa',
                    textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Who?</label>
                  <select value={newExpense.who}
                    onChange={e => setNewExpense({...newExpense, who:e.target.value})}
                    style={{ width:'100%', background:'#f5f3ff', border:'1.5px solid #ddd6fe',
                      borderRadius:14, padding:'11px 12px', fontSize:13,
                      fontWeight:700, outline:'none' }}>
                    <option value="user2">👑 {wifeName}</option>
                    <option value="user1">{hubName}</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#a78bfa',
                  textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Note (optional)</label>
                <input value={newExpense.note}
                  onChange={e => setNewExpense({...newExpense, note:e.target.value})}
                  style={{ width:'100%', boxSizing:'border-box', background:'#f5f3ff',
                    border:'1.5px solid #ddd6fe', borderRadius:14, padding:'11px 14px',
                    fontSize:13, fontWeight:700, outline:'none', color:'#334155' }}
                  placeholder={newExpense.type==='debit' ? 'e.g. Dinner at Monal' : 'e.g. Salary, Pocket money'}/>
              </div>

              <button type="submit" style={{
                width:'100%', color:'white', padding:'16px 0', borderRadius:20,
                fontWeight:800, fontSize:16, border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                background: newExpense.type==='credit'
                  ? 'linear-gradient(135deg,#059669,#047857)'
                  : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                boxShadow: newExpense.type==='credit'
                  ? '0 8px 24px rgba(5,150,105,0.3)'
                  : '0 8px 24px rgba(124,58,237,0.38)',
              }}>
                {isEditing
                  ? <><Check size={18}/> Update Entry</>
                  : newExpense.type==='credit'
                    ? <><Plus size={18}/> Add to Balance</>
                    : <><Plus size={18}/> Add Expense</>
                }
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App/>);
