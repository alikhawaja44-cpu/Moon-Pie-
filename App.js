import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Heart, ShoppingBag, Utensils, Zap, Car, Home, Film, Gift,
  Plus, Calendar, Trash2, Edit2, MessageCircle, DollarSign, X, Check,
  Lock, LogIn, Upload, Wallet, Settings, LogOut, TrendingUp, Copy,
  ListChecks, CheckSquare, User, BarChart2, Search, AlertTriangle,
  CheckCircle, Bell, Eye, EyeOff, Sparkles, ArrowDownCircle, Users
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
  { id:'groceries', label:'Groceries',  icon:ShoppingBag, color:'#8b5cf6' },
  { id:'dining',    label:'Dining',     icon:Utensils,    color:'#a78bfa' },
  { id:'utilities', label:'Bills',      icon:Zap,         color:'#f59e0b' },
  { id:'transport', label:'Transport',  icon:Car,         color:'#14b8a6' },
  { id:'home',      label:'Home',       icon:Home,        color:'#8b5cf6' },
  { id:'dates',     label:'Date Night', icon:Film,        color:'#e11d48' },
  { id:'gifts',     label:'Gifts',      icon:Gift,        color:'#a855f7' },
  { id:'other',     label:'Other',      icon:DollarSign,  color:'#64748b' },
];

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const CSS_KEYFRAMES = `
  @keyframes heartbeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.28)} 30%{transform:scale(1)} 45%{transform:scale(1.15)} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
  @keyframes toastSlide { from{opacity:0;transform:translateY(-14px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
  .row-enter { animation: fadeUp 0.22s ease both; }
  .modal-slide { animation: fadeUp 0.28s cubic-bezier(.34,1.2,.64,1) both; }
  .nav-btn { background:none; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:3px; font-weight:800; transition:color 0.2s; font-family:inherit; padding:0; min-width:70px; }
  select, input, button { font-family:inherit; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; }
  input[type=number] { -moz-appearance:textfield; }
  ::-webkit-scrollbar { width:3px; }
  ::-webkit-scrollbar-thumb { background:#f3e8ff; border-radius:4px; }
  .pin-dot { transition: background 0.2s, transform 0.2s; }
  .pin-dot.filled { transform: scale(1.15); }
`;

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
    <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
      zIndex:99999, display:'flex', flexDirection:'column', alignItems:'center',
      gap:8, pointerEvents:'none', width:'100%', maxWidth:380, padding:'0 16px' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex', alignItems:'center', gap:10, padding:'12px 18px',
          borderRadius:99, boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          fontSize:13, fontWeight:700,
          background: t.type==='success'?'#7c3aed': t.type==='error'?'#ef4444':'#475569',
          color:'white', animation:'toastSlide 0.35s cubic-bezier(.34,1.56,.64,1)'
        }}>
          {t.type==='success'?<Heart size={13} fill="white"/>:t.type==='error'?<AlertTriangle size={13}/>:<Bell size={13}/>}
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
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
      backdropFilter:'blur(6px)', zIndex:9999, display:'flex',
      alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'white', borderRadius:28, padding:28, width:'100%',
        maxWidth:320, boxShadow:'0 24px 64px rgba(0,0,0,0.18)',
        animation:'popIn 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#f3e8ff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <AlertTriangle size={20} color="#7c3aed"/>
          </div>
          <h3 style={{ fontWeight:800, color:'#1e293b', fontSize:16, margin:0 }}>{dialog.title}</h3>
        </div>
        <p style={{ color:'#64748b', fontSize:13, marginBottom:22, paddingLeft:56 }}>{dialog.message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, background:'#f1f5f9', color:'#475569', border:'none', borderRadius:14, padding:'12px 0', fontWeight:800, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>Cancel</button>
          <button onClick={onOk}     style={{ flex:1, background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', border:'none', borderRadius:14, padding:'12px 0', fontWeight:800, cursor:'pointer', fontSize:14, fontFamily:'inherit' }}>{dialog.confirmLabel||'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin, storedPin, names }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const n1 = names?.user1 || 'Ali';
  const n2 = names?.user2 || 'Fajar';

  const tryPin = (newPin) => {
    if (newPin.length === 4) {
      if (newPin === storedPin) { onLogin(); }
      else {
        setError('Wrong PIN, love 💕');
        setShake(true);
        setTimeout(() => { setPin(''); setError(''); setShake(false); }, 800);
      }
    }
  };

  const pressKey = (k) => {
    if (shake) return;
    if (k === '⌫') { setPin(p => p.slice(0,-1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    tryPin(next);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(160deg,#faf5ff 0%,#faf5ff 50%,#faf5ff 100%)',
      padding:24, fontFamily:"'Quicksand',sans-serif" }}>
      <style>{CSS_KEYFRAMES}</style>
      <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)',
        padding:36, borderRadius:36,
        boxShadow:'0 24px 80px rgba(124,58,237,0.14)',
        width:'100%', maxWidth:320, textAlign:'center',
        border:'1px solid rgba(255,255,255,0.9)',
        animation:'popIn 0.4s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* Heart */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontWeight:800, fontSize:20, color:'#1e293b' }}>{n1}</span>
          <Heart size={30} color="#7c3aed" fill="#7c3aed"
            style={{ animation:'heartbeat 2s ease infinite' }}/>
          <span style={{ fontWeight:800, fontSize:20, color:'#1e293b' }}>{n2}</span>
        </div>
        <p style={{ fontSize:12, fontWeight:700, color:'#94a3b8', letterSpacing:3,
          textTransform:'uppercase', marginBottom:28 }}>Our Secret Space</p>

        {/* PIN dots */}
        <div style={{ display:'flex', justifyContent:'center', gap:14, marginBottom:28 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`pin-dot${pin.length>i?' filled':''}`} style={{
              width:16, height:16, borderRadius:'50%',
              background: pin.length > i ? '#7c3aed' : '#f3e8ff',
              border: `2px solid ${pin.length > i ? '#7c3aed' : '#c4b5fd'}`,
              animation: shake ? 'shake 0.6s ease' : 'none'
            }}/>
          ))}
        </div>

        {/* Keypad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i) => (
            <button key={i} type="button"
              onClick={() => k !== '' && pressKey(String(k))}
              style={{
                padding:'16px 0', borderRadius:18, border:'none',
                cursor: k===''?'default':'pointer',
                fontWeight:800, fontSize:20, fontFamily:'inherit',
                background: k===''?'transparent': k==='⌫'?'#faf5ff':'rgba(124,58,237,0.06)',
                color: k==='⌫'?'#7c3aed':'#1e293b',
                visibility: k===''?'hidden':'visible',
                transition:'transform 0.1s, background 0.15s',
                boxShadow: k===''?'none':'0 2px 8px rgba(124,58,237,0.06)'
              }}
              onMouseDown={e => { if(k!=='') e.currentTarget.style.transform='scale(0.9)'; }}
              onMouseUp={e => { e.currentTarget.style.transform='scale(1)'; }}
            >{k}</button>
          ))}
        </div>

        {error
          ? <p style={{ color:'#7c3aed', fontSize:13, fontWeight:700, height:18 }}>{error}</p>
          : <p style={{ height:18 }}/>
        }
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [isAuthenticated, setIsAuthenticated] = useStickyState(false, 'moonpie_auth');
  const firebaseSettings = useFirebaseDoc('moonpie_settings', 'config');
  const userNames = firebaseSettings?.names || { user1:'Ali', user2:'Fajar' };
  const appPin    = firebaseSettings?.pin   || '1430';

  const [view, setView]                     = useState('expenses');
  const [showAddModal, setShowAddModal]     = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [isEditing, setIsEditing]           = useState(false);
  const [showPin, setShowPin]               = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear,  setSelectedYear]  = useState(new Date().getFullYear());
  const [searchQuery,   setSearchQuery]   = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]         = useState(new Set());

  const expenses = useFirebaseSync('moonpie_expenses');
  const notes    = useFirebaseSync('moonpie_notes');
  const budgets  = useFirebaseSync('moonpie_budgets', null);

  const emptyExpense = () => ({
    amount:'', category:'groceries', note:'',
    date: new Date().toISOString().split('T')[0], who:'user1', type:'debit'
  });
  const [newExpense,   setNewExpense]   = useState(emptyExpense());
  const [newNote,      setNewNote]      = useState('');
  const [newPinCode,   setNewPinCode]   = useState('');
  const [budgetInputs, setBudgetInputs] = useState({ user1:'', user2:'' });
  const [nameInputs,   setNameInputs]   = useState({ user1:'', user2:'' });

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

  const resolveUser = w => (w==='Ali'||w==='user1') ? 'user1' : 'user2';

  const parseDate = str => {
    if (!str) return new Date().toISOString().split('T')[0];
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const [m,d,y] = parts.map(Number);
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
    }
    try { return new Date(str).toISOString().split('T')[0]; }
    catch { return new Date().toISOString().split('T')[0]; }
  };

  // ─── CALCULATIONS ────────────────────────────────────────────────────────
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
        const name = resolveUser(e.who)==='user1' ? userNames.user1.toLowerCase() : userNames.user2.toLowerCase();
        return (e.note||'').toLowerCase().includes(q) || cat.includes(q) || name.includes(q);
      });
    }
    return list;
  }, [expenses, selectedMonth, selectedYear, searchQuery, userNames]);

  const stats = useMemo(() => {
    const u1spent  = filteredExpenses.filter(e=>resolveUser(e.who)==='user1'&&e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const u2spent  = filteredExpenses.filter(e=>resolveUser(e.who)==='user2'&&e.type==='debit' ).reduce((a,c)=>a+c.amount,0);
    const u1income = filteredExpenses.filter(e=>resolveUser(e.who)==='user1'&&e.type==='credit').reduce((a,c)=>a+c.amount,0);
    const u2income = filteredExpenses.filter(e=>resolveUser(e.who)==='user2'&&e.type==='credit').reduce((a,c)=>a+c.amount,0);
    return { u1spent, u2spent, u1income, u2income, totalSpent:u1spent+u2spent, totalIncome:u1income+u2income };
  }, [filteredExpenses]);

  // ✅ SIMPLE BUDGET: Remaining = Budget you set − Expenses. 
  //    Income is tracked separately and does NOT affect your budget.
  const budgetsData = useMemo(() => {
    if (selectedMonth === 'All') {
      const yearly = budgets.filter(b => b.year === selectedYear);
      return {
        user1: yearly.reduce((a,b) => a+(b.user1||0), 0),
        user2: yearly.reduce((a,b) => a+(b.user2||0), 0),
      };
    }
    const found = budgets.find(b => b.id === `${selectedYear}-${selectedMonth}`) || {};
    return { user1: found.user1||0, user2: found.user2||0 };
  }, [budgets, selectedMonth, selectedYear]);

  // Budget remaining: simply budget minus what's been spent
  const remaining = {
    user1: budgetsData.user1 - stats.u1spent,
    user2: budgetsData.user2 - stats.u2spent,
  };

  const chartData = useMemo(() => {
    const map = {};
    filteredExpenses.filter(e=>e.type!=='credit').forEach(e => {
      map[e.category] = (map[e.category]||0) + e.amount;
    });
    return Object.keys(map)
      .map(k => ({ name:CATEGORIES.find(c=>c.id===k)?.label||k, value:map[k], color:CATEGORIES.find(c=>c.id===k)?.color||'#ccc' }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleAddOrEditExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      toast('Enter a valid amount!', 'error'); return;
    }
    const data = { ...newExpense, amount:Number(newExpense.amount), who:resolveUser(newExpense.who) };
    if (isEditing && newExpense.id) {
      const { id, ...rest } = data;
      await updateDoc(doc(db,'moonpie_expenses',newExpense.id), rest);
      toast('Entry updated ✨');
    } else {
      await addDoc(collection(db,'moonpie_expenses'), { ...data, createdAt:new Date().toISOString() });
      confetti({ particleCount:55, spread:65, origin:{y:0.7},
        colors: data.type==='credit'?['#4ade80','#22c55e']:['#7c3aed','#f3e8ff','#c4b5fd'] });
      toast(data.type==='credit'?'Income added! 💚':'Expense added! 💕');
    }
    setShowAddModal(false); setIsEditing(false); setNewExpense(emptyExpense());
  };

  const handleEditClick = item => { setNewExpense({...item}); setIsEditing(true); setShowAddModal(true); };
  const handleDuplicate = item => {
    const { id, createdAt, ...copy } = item;
    setNewExpense({...copy, date:new Date().toISOString().split('T')[0]});
    setIsEditing(false); setShowAddModal(true);
  };
  const handleDelete = async id => {
    const ok = await showConfirm('Remove Entry','This entry will be permanently deleted.');
    if (ok) { await deleteDoc(doc(db,'moonpie_expenses',id)); toast('Entry removed','info'); }
  };

  const toggleSelectionMode = () => { setIsSelectionMode(v=>!v); setSelectedIds(new Set()); };
  const toggleId = id => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id)?s.delete(id):s.add(id); return s;
  });
  const selectAll = () =>
    selectedIds.size===filteredExpenses.length
      ? setSelectedIds(new Set())
      : setSelectedIds(new Set(filteredExpenses.map(e=>e.id)));

  const handleBulkDelete = async () => {
    const ok = await showConfirm('Delete Selected',`Permanently delete ${selectedIds.size} item(s)?`,'Delete All');
    if (!ok) return;
    const batch = writeBatch(db);
    selectedIds.forEach(id => batch.delete(doc(db,'moonpie_expenses',id)));
    try {
      await batch.commit();
      toast(`${selectedIds.size} items deleted`,'info');
      setIsSelectionMode(false); setSelectedIds(new Set());
    } catch { toast('Delete failed','error'); }
  };

  const handleUpdateBudget = async (e) => {
    e.preventDefault();
    if (selectedMonth === 'All') { toast('Pick a specific month first!','error'); return; }
    const key = `${selectedYear}-${selectedMonth}`;
    await setDoc(doc(db,'moonpie_budgets',key), {
      user1:Number(budgetInputs.user1)||0,
      user2:Number(budgetInputs.user2)||0,
      year:selectedYear, month:selectedMonth
    });
    setShowBudgetModal(false);
    toast('Budgets saved! 💰');
  };

  const handleExportCSV = () => {
    if (!filteredExpenses.length) { toast('No data to export!','error'); return; }
    const csv = Papa.unparse(filteredExpenses.map(e => ({
      Date:e.date,
      Description:e.note||'',
      Category:CATEGORIES.find(c=>c.id===e.category)?.label||e.category,
      Person:resolveUser(e.who)==='user1'?userNames.user1:userNames.user2,
      Type:e.type==='credit'?'Income':'Expense',
      Amount:e.amount
    })));
    const a = Object.assign(document.createElement('a'),{
      href:URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),
      download:`moonpie_${selectedYear}_${selectedMonth==='All'?'all':MONTH_NAMES[selectedMonth]}.csv`
    });
    a.click(); toast('CSV exported 📊');
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async ({ data:rows }) => {
        if (!rows.length) { toast('File is empty!','error'); return; }
        const ok = await showConfirm('Import Data',`Import ${rows.length} rows from "${file.name}"?`,'Import');
        if (!ok) return;
        const batch = writeBatch(db); let count=0;
        rows.forEach(row => {
          const r={}; Object.keys(row).forEach(k=>r[k.trim().toLowerCase()]=row[k]);
          const debit  = Number((r.debit||'0').toString().replace(/,/g,''));
          const credit = Number((r.credit||'0').toString().replace(/,/g,''));
          const comment = r.comment||'Imported';
          const date    = parseDate(r['date & time']||r.date||'');
          let amount=0,type='debit';
          if (debit>0){amount=debit;type='debit';}
          else if(credit>0){amount=credit;type='credit';}
          if (amount>0){
            let cat='other';
            const lc=comment.toLowerCase();
            if(lc.includes('lunch')||lc.includes('dinner')||lc.includes('coffee')||lc.includes('bakery'))cat='dining';
            else if(lc.includes('indrive')||lc.includes('careem')||lc.includes('uber'))cat='transport';
            else if(lc.includes('load')||lc.includes('bill'))cat='utilities';
            else if(lc.includes('gym')||lc.includes('doctor'))cat='home';
            else if(lc.includes('pocket money'))cat='gifts';
            batch.set(doc(collection(db,'moonpie_expenses')),
              {amount,note:comment,date,category:cat,who:'user2',type,createdAt:new Date().toISOString(),imported:true});
            count++;
          }
        });
        try {
          await batch.commit();
          toast(`Imported ${count} entries! 🎉`);
          confetti({particleCount:100,spread:100,origin:{y:0.6}});
        } catch { toast('Import failed','error'); }
        e.target.value='';
      }
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    await addDoc(collection(db,'moonpie_notes'),{text:newNote,createdAt:new Date().toISOString()});
    setNewNote(''); toast('Note pinned! 📌');
  };

  const handleDeleteNote = async id => {
    const ok = await showConfirm('Remove Note','This note will be gone forever.');
    if (ok) { await deleteDoc(doc(db,'moonpie_notes',id)); toast('Note removed','info'); }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPinCode)) { toast('PIN must be exactly 4 digits!','error'); return; }
    await setDoc(doc(db,'moonpie_settings','config'),{names:userNames,pin:newPinCode},{merge:true});
    toast('PIN updated! Logging out...','info');
    setTimeout(()=>setIsAuthenticated(false),1200);
  };

  const handleUpdateNames = async (e) => {
    e.preventDefault();
    const updated = {
      user1: nameInputs.user1.trim() || userNames.user1,
      user2: nameInputs.user2.trim() || userNames.user2,
    };
    await setDoc(doc(db,'moonpie_settings','config'),{names:updated,pin:appPin},{merge:true});
    toast('Names updated 💕'); setNameInputs({user1:'',user2:''});
  };

  if (!isAuthenticated)
    return <Login onLogin={()=>setIsAuthenticated(true)} storedPin={appPin} names={userNames}/>;

  const u1 = userNames.user1;
  const u2 = userNames.user2;
  const monthLabel = selectedMonth==='All' ? `All of ${selectedYear}` : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh',
      background:'linear-gradient(160deg,#faf5ff 0%,#faf5ff 60%,#faf5ff 100%)',
      paddingBottom:100, position:'relative', fontFamily:"'Quicksand',sans-serif" }}>
      <style>{CSS_KEYFRAMES}</style>
      <ToastContainer toasts={toasts}/>
      <ConfirmDialog dialog={dialog} onOk={onConfirmOk} onCancel={onConfirmCancel}/>

      {/* Ambient blobs */}
      <div style={{ position:'fixed',top:-60,left:-60,width:260,height:260,
        background:'#f3e8ff',borderRadius:'60% 40% 30% 70%/60% 30% 70% 40%',
        opacity:0.4,filter:'blur(60px)',pointerEvents:'none',zIndex:0 }}/>
      <div style={{ position:'fixed',bottom:100,right:-50,width:200,height:200,
        background:'#f3e8ff',borderRadius:'40% 60% 70% 30%/50% 40% 60% 50%',
        opacity:0.35,filter:'blur(50px)',pointerEvents:'none',zIndex:0 }}/>

      {/* ── HEADER ── */}
      <header style={{ padding:'20px 20px 0', position:'relative', zIndex:10 }}>
        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:800, fontSize:20, color:'#1e293b' }}>{u1}</span>
              <Heart size={19} color="#7c3aed" fill="#7c3aed"
                style={{ animation:'heartbeat 2.2s ease infinite', flexShrink:0 }}/>
              <span style={{ fontWeight:800, fontSize:20, color:'#1e293b' }}>{u2}</span>
            </div>
            <p style={{ color:'#94a3b8', fontSize:12, marginTop:2, fontWeight:600 }}>{monthLabel}</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {view==='expenses' && (
              <button onClick={toggleSelectionMode} style={{
                width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',
                background:isSelectionMode?'#7c3aed':'rgba(255,255,255,0.9)',
                color:isSelectionMode?'white':'#94a3b8',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
                <ListChecks size={17}/>
              </button>
            )}
            <label style={{ width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.9)',
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',boxShadow:'0 2px 10px rgba(0,0,0,0.07)',color:'#94a3b8' }}>
              <Upload size={17}/>
              <input type="file" accept=".csv" onChange={handleImport} style={{ display:'none' }}/>
            </label>
            <button onClick={handleExportCSV} style={{
              width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',
              background:'rgba(255,255,255,0.9)',color:'#94a3b8',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 2px 10px rgba(0,0,0,0.07)' }}>
              <TrendingUp size={17}/>
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {isSelectionMode && (
          <div style={{ background:'#1e293b',color:'white',borderRadius:18,padding:'12px 16px',
            marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <button onClick={selectAll} style={{ background:'none',border:'none',color:'white',
                cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontWeight:800,fontSize:13,fontFamily:'inherit' }}>
                <CheckSquare size={16}/>{selectedIds.size===filteredExpenses.length?'Deselect All':'Select All'}
              </button>
              <span style={{ fontSize:12,color:'#94a3b8',fontWeight:700 }}>{selectedIds.size} selected</span>
            </div>
            {selectedIds.size>0 && (
              <button onClick={handleBulkDelete} style={{ background:'#ef4444',color:'white',border:'none',
                borderRadius:10,padding:'6px 14px',fontWeight:800,fontSize:12,cursor:'pointer',
                display:'flex',alignItems:'center',gap:6,fontFamily:'inherit' }}>
                <Trash2 size={13}/> Delete
              </button>
            )}
          </div>
        )}

        {/* ── BUDGET CARDS ── */}
        {!isSelectionMode && view==='expenses' && (
          <>
            {/* Together strip */}
            <div onClick={() => {
                if(selectedMonth!=='All'){
                  setBudgetInputs({user1:budgetsData.user1||'',user2:budgetsData.user2||''});
                  setShowBudgetModal(true);
                }
              }}
              style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                borderRadius:22,padding:'15px 18px',marginBottom:12,
                display:'flex',alignItems:'center',justifyContent:'space-between',
                cursor:selectedMonth!=='All'?'pointer':'default',
                boxShadow:'0 8px 28px rgba(124,58,237,0.28)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,0.2)',
                  display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Users size={18} color="white"/>
                </div>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)',fontSize:10,fontWeight:700,
                    textTransform:'uppercase',letterSpacing:1,margin:0 }}>Together This Month</p>
                  <p style={{ color:'white',fontWeight:800,fontSize:19,margin:0 }}>
                    Rs {stats.totalSpent.toLocaleString()}
                    <span style={{ fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.6)',marginLeft:6 }}>spent</span>
                  </p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                {stats.totalIncome>0 && (
                  <p style={{ color:'#86efac',fontSize:11,fontWeight:800,margin:'0 0 2px' }}>
                    +Rs {stats.totalIncome.toLocaleString()} income
                  </p>
                )}
                {selectedMonth!=='All' && (
                  <p style={{ color:'rgba(255,255,255,0.55)',fontSize:10,fontWeight:600,margin:0 }}>
                    tap to set budgets
                  </p>
                )}
              </div>
            </div>

            {/* Per-person budget cards */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
              {[
                {key:'user1',name:u1,accent:'#3b82f6',lightBg:'#eff6ff',spent:stats.u1spent},
                {key:'user2',name:u2,accent:'#7c3aed',lightBg:'#f5f3ff',spent:stats.u2spent},
              ].map(u => {
                const budget  = budgetsData[u.key];
                const rem     = remaining[u.key];     // budget − spent
                const over    = budget > 0 && rem < 0;
                const pct     = budget > 0 ? Math.min((u.spent/budget)*100,100) : 0;
                const noBudget = budget === 0;

                return (
                  <div key={u.key}
                    onClick={() => {
                      if(selectedMonth!=='All'){
                        setBudgetInputs({user1:budgetsData.user1||'',user2:budgetsData.user2||''});
                        setShowBudgetModal(true);
                      }
                    }}
                    style={{
                      background:'rgba(255,255,255,0.9)',backdropFilter:'blur(12px)',
                      borderRadius:22,padding:14,
                      border: over?'1px solid #ddd6fe':'1px solid rgba(255,255,255,0.95)',
                      boxShadow: over?'0 4px 16px rgba(239,68,68,0.1)':'0 4px 16px rgba(0,0,0,0.04)',
                      cursor:selectedMonth!=='All'?'pointer':'default',
                    }}>
                    {/* Name */}
                    <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:12 }}>
                      <div style={{ width:26,height:26,borderRadius:'50%',background:u.lightBg,
                        display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <User size={13} color={u.accent}/>
                      </div>
                      <span style={{ fontWeight:800,color:'#334155',fontSize:14,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name}</span>
                    </div>

                    {/* Budget row */}
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4 }}>
                      <span style={{ fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5 }}>Budget</span>
                      <span style={{ fontSize:12,fontWeight:800,color: noBudget?'#d1d5db':'#475569' }}>
                        {noBudget ? '— not set' : `Rs ${budget.toLocaleString()}`}
                      </span>
                    </div>

                    {/* Spent row */}
                    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
                      <span style={{ fontSize:10,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5 }}>Spent</span>
                      <span style={{ fontSize:12,fontWeight:800,color:'#ef4444' }}>
                        Rs {u.spent.toLocaleString()}
                      </span>
                    </div>

                    {/* Progress */}
                    {!noBudget && (
                      <div style={{ width:'100%',background:'#f1f5f9',borderRadius:99,height:5,overflow:'hidden',marginBottom:8 }}>
                        <div style={{
                          height:5,borderRadius:99,transition:'width 0.6s ease',
                          background: over?'#ef4444':`linear-gradient(90deg,${u.accent},${u.accent}99)`,
                          width:`${pct}%`
                        }}/>
                      </div>
                    )}

                    {/* Remaining */}
                    {!noBudget ? (
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline' }}>
                        <span style={{ fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:0.5,
                          color:over?'#ef4444':'#94a3b8' }}>
                          {over?'⚠ Over':'Left'}
                        </span>
                        <span style={{ fontSize:16,fontWeight:800,color:over?'#ef4444':'#1e293b' }}>
                          Rs {Math.abs(rem).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <p style={{ fontSize:10,color:'#cbd5e1',fontWeight:700,margin:0,textAlign:'center' }}>
                        tap to set budget
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main style={{ padding:'0 16px', position:'relative', zIndex:10 }}>

        {/* ── EXPENSES VIEW ── */}
        {view==='expenses' && (
          <>
            {!isSelectionMode && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex',gap:8,marginBottom:8 }}>
                  <select value={selectedMonth}
                    onChange={e=>setSelectedMonth(e.target.value==='All'?'All':Number(e.target.value))}
                    style={{ flex:1,background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',
                      borderRadius:14,padding:'9px 12px',fontSize:13,fontWeight:700,color:'#334155',outline:'none' }}>
                    <option value="All">All Months</option>
                    {MONTH_NAMES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={selectedYear}
                    onChange={e=>setSelectedYear(Number(e.target.value))}
                    style={{ background:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.9)',
                      borderRadius:14,padding:'9px 12px',fontSize:13,fontWeight:700,color:'#334155',outline:'none' }}>
                    {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div style={{ position:'relative' }}>
                  <Search size={14} style={{ position:'absolute',left:12,top:'50%',
                    transform:'translateY(-50%)',color:'#d4b0be' }}/>
                  <input placeholder="Search by note, category or name..." value={searchQuery}
                    onChange={e=>setSearchQuery(e.target.value)}
                    style={{ width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.7)',
                      border:'1px solid rgba(255,255,255,0.9)',borderRadius:14,
                      padding:'9px 32px 9px 32px',fontSize:13,color:'#334155',outline:'none',fontWeight:600 }}/>
                  {searchQuery && (
                    <button onClick={()=>setSearchQuery('')} style={{ position:'absolute',right:10,top:'50%',
                      transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#d4b0be',padding:0 }}>
                      <X size={14}/>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chart */}
            {!isSelectionMode && (
              <div style={{ background:'rgba(255,255,255,0.82)',backdropFilter:'blur(12px)',
                borderRadius:24,padding:20,boxShadow:'0 4px 20px rgba(124,58,237,0.07)',
                border:'1px solid rgba(255,255,255,0.95)',marginBottom:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14 }}>
                  <h2 style={{ fontWeight:800,color:'#334155',fontSize:14,
                    display:'flex',alignItems:'center',gap:6,margin:0 }}>
                    <BarChart2 size={16} color="#7c3aed"/> Where did it go?
                  </h2>
                  <span style={{ fontSize:10,color:'#94a3b8',background:'#f8fafc',
                    padding:'4px 10px',borderRadius:99,fontWeight:700 }}>
                    {monthLabel}
                  </span>
                </div>
                {chartData.length>0 ? (
                  <>
                    <div style={{ height:160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={38}
                            outerRadius={65} paddingAngle={4} dataKey="value">
                            {chartData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Pie>
                          <ChartTooltip formatter={v=>[`Rs ${Number(v).toLocaleString()}`,'']}
                            contentStyle={{ borderRadius:14,border:'none',
                              boxShadow:'0 4px 20px rgba(0,0,0,0.12)',fontSize:12,fontFamily:'inherit' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',gap:7,marginTop:10 }}>
                      {chartData.slice(0,5).map((item,i)=>(
                        <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <div style={{ width:9,height:9,borderRadius:'50%',background:item.color,flexShrink:0 }}/>
                            <span style={{ fontSize:12,color:'#475569',fontWeight:700 }}>{item.name}</span>
                          </div>
                          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                            <span style={{ fontSize:11,color:'#94a3b8',fontWeight:600 }}>
                              {stats.totalSpent>0?Math.round(item.value/stats.totalSpent*100):0}%
                            </span>
                            <span style={{ fontSize:12,fontWeight:800,color:'#334155',minWidth:72,textAlign:'right' }}>
                              Rs {item.value.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      {chartData.length>5 && (
                        <p style={{ fontSize:11,color:'#94a3b8',textAlign:'center',margin:'2px 0 0',fontWeight:600 }}>
                          +{chartData.length-5} more categories
                        </p>
                      )}
                    </div>
                    {stats.totalIncome>0 && (
                      <div style={{ marginTop:12,paddingTop:12,borderTop:'1px solid #ede9fe',
                        display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                          <ArrowDownCircle size={14} color="#22c55e"/>
                          <span style={{ fontSize:12,color:'#22c55e',fontWeight:700 }}>Total Income</span>
                        </div>
                        <span style={{ fontSize:13,fontWeight:800,color:'#22c55e' }}>
                          +Rs {stats.totalIncome.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ height:100,display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',gap:8 }}>
                    <Sparkles size={26} color="#c4b5fd"/>
                    <p style={{ color:'#94a3b8',fontSize:13,margin:0,fontWeight:600 }}>
                      No expenses yet 💕
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Expense list */}
            <div style={{ display:'flex',flexDirection:'column',gap:9,paddingBottom:20 }}>
              {filteredExpenses.length===0 && (
                <div style={{ textAlign:'center',padding:'40px 20px',color:'#94a3b8',
                  fontSize:14,fontWeight:600 }}>
                  {searchQuery?`No results for "${searchQuery}"`:'Nothing here yet 🗓️'}
                </div>
              )}
              {filteredExpenses.map(exp => {
                const isCredit = exp.type==='credit';
                const Cat = isCredit
                  ? {icon:ArrowDownCircle,color:'#22c55e',label:'Income'}
                  : (CATEGORIES.find(c=>c.id===exp.category)||CATEGORIES[7]);
                const Icon = Cat.icon;
                const isSel = selectedIds.has(exp.id);
                const pName = resolveUser(exp.who)==='user1' ? u1 : u2;
                const pColor = resolveUser(exp.who)==='user1' ? '#3b82f6' : '#7c3aed';

                return (
                  <div key={exp.id} onClick={()=>isSelectionMode&&toggleId(exp.id)}
                    className="row-enter"
                    style={{
                      background:isSel?'#f5f3ff':'rgba(255,255,255,0.92)',
                      padding:'13px 14px',borderRadius:18,
                      boxShadow:isSel?'0 0 0 2px #7c3aed,0 4px 14px rgba(124,58,237,0.1)':'0 2px 12px rgba(0,0,0,0.04)',
                      display:'flex',alignItems:'center',justifyContent:'space-between',
                      cursor:isSelectionMode?'pointer':'default',
                      border:'1px solid rgba(255,255,255,0.9)',
                    }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                      {isSelectionMode ? (
                        <div style={{ width:22,height:22,borderRadius:'50%',
                          border:`2px solid ${isSel?'#7c3aed':'#e2e8f0'}`,
                          background:isSel?'#7c3aed':'transparent',
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                          {isSel&&<Check size={12} color="white"/>}
                        </div>
                      ) : (
                        <div style={{ width:44,height:44,borderRadius:14,background:Cat.color,
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                          boxShadow:`0 4px 12px ${Cat.color}55` }}>
                          <Icon size={19} color="white"/>
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight:800,color:'#1e293b',fontSize:14,margin:'0 0 3px' }}>
                          {exp.note||Cat.label}
                        </p>
                        <p style={{ fontSize:11,color:'#94a3b8',margin:0,fontWeight:600,
                          display:'flex',alignItems:'center',gap:4 }}>
                          <Calendar size={9}/>{exp.date}
                          <span style={{ color:'#e2e8f0' }}>·</span>
                          <span style={{ color:pColor,fontWeight:800 }}>{pName}</span>
                        </p>
                      </div>
                    </div>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontWeight:800,fontSize:15,color:isCredit?'#22c55e':'#1e293b' }}>
                        {isCredit?'+':'−'} Rs {exp.amount.toLocaleString()}
                      </span>
                      {!isSelectionMode && (
                        <div style={{ display:'flex',flexDirection:'column',gap:1 }}>
                          <button onClick={e=>{e.stopPropagation();handleEditClick(exp)}}
                            style={{ background:'none',border:'none',cursor:'pointer',padding:4,color:'#d4b0be' }}>
                            <Edit2 size={12}/>
                          </button>
                          <button onClick={e=>{e.stopPropagation();handleDuplicate(exp)}}
                            style={{ background:'none',border:'none',cursor:'pointer',padding:4,color:'#d4b0be' }}>
                            <Copy size={12}/>
                          </button>
                          <button onClick={e=>{e.stopPropagation();handleDelete(exp.id)}}
                            style={{ background:'none',border:'none',cursor:'pointer',padding:4,color:'#fca5a5' }}>
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

        {/* ── NOTES VIEW ── */}
        {view==='notes' && (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div style={{ background:'linear-gradient(135deg,#fff7ed,#faf5ff)',padding:18,borderRadius:22,
              border:'1px dashed #c4b5fd',boxShadow:'0 4px 16px rgba(124,58,237,0.07)',
              transform:'rotate(-0.4deg)' }}>
              <h3 style={{ fontWeight:800,color:'#7c3aed',marginBottom:12,fontSize:15,
                display:'flex',alignItems:'center',gap:8 }}>
                <MessageCircle size={16}/> Leave a note
              </h3>
              <form onSubmit={handleAddNote} style={{ display:'flex',gap:8 }}>
                <input style={{ flex:1,background:'rgba(255,255,255,0.7)',border:'1px solid #f3e8ff',
                  borderRadius:14,padding:'10px 14px',fontSize:13,outline:'none',fontWeight:600,color:'#334155' }}
                  placeholder="A sweet message for us... 💌"
                  value={newNote} onChange={e=>setNewNote(e.target.value)}/>
                <button type="submit" style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)',
                  border:'none',borderRadius:14,padding:'10px 14px',cursor:'pointer',color:'white',
                  display:'flex',alignItems:'center',boxShadow:'0 4px 12px rgba(124,58,237,0.25)' }}>
                  <Plus size={18}/>
                </button>
              </form>
            </div>

            {notes.length===0 && (
              <div style={{ textAlign:'center',padding:'40px 20px',color:'#94a3b8',fontSize:14,fontWeight:600 }}>
                No notes yet — leave a sweet message! 💜
              </div>
            )}

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,paddingBottom:20 }}>
              {notes.map((note,idx) => {
                const p=[
                  {bg:'#f5f3ff',color:'#6d28d9',border:'#f3e8ff'},
                  {bg:'#faf5ff',color:'#6b21a8',border:'#f3e8ff'},
                  {bg:'#fff7ed',color:'#92400e',border:'#ddd6fe'},
                  {bg:'#f0fdf4',color:'#166534',border:'#bbf7d0'},
                  {bg:'#eff6ff',color:'#1e40af',border:'#bfdbfe'},
                ][idx%5];
                return (
                  <div key={note.id} style={{ background:p.bg,padding:16,borderRadius:20,
                    position:'relative',border:`1px solid ${p.border}`,
                    transform:`rotate(${idx%2===0?'0.6':'-0.6'}deg)`,
                    boxShadow:'0 4px 14px rgba(0,0,0,0.05)',transition:'transform 0.2s' }}>
                    <p style={{ color:p.color,fontSize:14,lineHeight:1.6,marginBottom:22,
                      fontStyle:'italic',fontFamily:'Georgia,serif' }}>{note.text}</p>
                    <button onClick={()=>handleDeleteNote(note.id)} style={{ position:'absolute',
                      bottom:8,right:8,background:'none',border:'none',cursor:'pointer',
                      color:`${p.color}55`,padding:4 }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SETTINGS VIEW ── */}
        {view==='settings' && (
          <div style={{ display:'flex',flexDirection:'column',gap:14,animation:'fadeUp 0.3s ease' }}>

            <div style={{ background:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)',
              borderRadius:24,padding:20,border:'1px solid rgba(255,255,255,0.95)',
              boxShadow:'0 4px 16px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontWeight:800,color:'#1e293b',fontSize:16,margin:'0 0 16px',
                display:'flex',alignItems:'center',gap:8 }}>
                <Heart size={16} color="#7c3aed" fill="#7c3aed"/> Our Names
              </h2>
              <form onSubmit={handleUpdateNames} style={{ display:'flex',flexDirection:'column',gap:12 }}>
                {[{key:'user1',label:'User 1',hint:u1,color:'#3b82f6'},{key:'user2',label:'User 2',hint:u2,color:'#7c3aed'}].map(u=>(
                  <div key={u.key}>
                    <label style={{ display:'block',fontSize:11,fontWeight:800,color:u.color,
                      textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>{u.label}</label>
                    <input style={{ width:'100%',boxSizing:'border-box',background:'#f8fafc',
                      border:`1.5px solid ${u.color}30`,borderRadius:14,padding:'10px 14px',
                      outline:'none',fontSize:14,fontWeight:700,color:'#334155' }}
                      placeholder={u.hint}
                      value={nameInputs[u.key]}
                      onChange={e=>setNameInputs({...nameInputs,[u.key]:e.target.value})}/>
                  </div>
                ))}
                <p style={{ fontSize:11,color:'#94a3b8',margin:0,fontWeight:600 }}>
                  Leave blank to keep current names.
                </p>
                <button type="submit" style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',
                  border:'none',borderRadius:14,padding:'12px 0',fontWeight:800,cursor:'pointer',fontSize:14,
                  fontFamily:'inherit',boxShadow:'0 6px 16px rgba(124,58,237,0.25)' }}>
                  Save Names
                </button>
              </form>
            </div>

            <div style={{ background:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)',
              borderRadius:24,padding:20,border:'1px solid rgba(255,255,255,0.95)',
              boxShadow:'0 4px 16px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontWeight:800,color:'#1e293b',fontSize:16,margin:'0 0 16px',
                display:'flex',alignItems:'center',gap:8 }}>
                <Lock size={16} color="#7c3aed"/> Security
              </h2>
              <form onSubmit={handleChangePin} style={{ display:'flex',flexDirection:'column',gap:12 }}>
                <div>
                  <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#64748b',
                    textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>New PIN</label>
                  <div style={{ display:'flex',gap:8 }}>
                    <input type="password" maxLength="4"
                      style={{ flex:1,background:'#f8fafc',border:'1.5px solid #e2e8f0',
                        borderRadius:14,padding:'10px 14px',textAlign:'center',fontSize:20,
                        fontWeight:800,letterSpacing:'0.6em',outline:'none' }}
                      placeholder="••••" value={newPinCode}
                      onChange={e=>setNewPinCode(e.target.value.replace(/\D/g,''))}/>
                    <button type="submit" style={{ background:'#7c3aed',color:'white',border:'none',
                      borderRadius:14,padding:'0 18px',fontWeight:800,cursor:'pointer',fontFamily:'inherit',fontSize:13 }}>
                      Update
                    </button>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                  <p style={{ fontSize:12,color:'#94a3b8',margin:0,fontWeight:600 }}>
                    Current PIN:{' '}
                    <span style={{ fontFamily:'monospace',background:'#f1f5f9',
                      padding:'2px 10px',borderRadius:8,fontWeight:800,color:'#475569' }}>
                      {showPin?appPin:'••••'}
                    </span>
                  </p>
                  <button type="button" onClick={()=>setShowPin(v=>!v)} style={{ background:'none',
                    border:'none',cursor:'pointer',color:'#94a3b8',padding:0,display:'flex' }}>
                    {showPin?<EyeOff size={14}/>:<Eye size={14}/>}
                  </button>
                </div>
              </form>
            </div>

            <button onClick={()=>setIsAuthenticated(false)} style={{ width:'100%',background:'#faf5ff',
              color:'#7c3aed',border:'1px solid #f3e8ff',borderRadius:20,padding:'14px 0',fontWeight:800,
              cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',
              gap:8,fontFamily:'inherit',boxShadow:'0 2px 12px rgba(124,58,237,0.06)' }}>
              <LogOut size={17}/> Logout
            </button>
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      {view==='expenses' && !isSelectionMode && (
        <button onClick={()=>{ setIsEditing(false); setNewExpense(emptyExpense()); setShowAddModal(true); }}
          style={{
            position:'fixed',bottom:82,right:20,width:58,height:58,borderRadius:'50%',
            background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',
            border:'3px solid white',cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 8px 28px rgba(124,58,237,0.38)',zIndex:40,
            transition:'transform 0.15s,box-shadow 0.15s'
          }}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.1)';}}
          onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';  }}>
          <Plus size={28}/>
        </button>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',
        width:'100%',maxWidth:430,background:'rgba(255,255,255,0.92)',
        backdropFilter:'blur(20px)',borderTop:'1px solid rgba(255,220,232,0.6)',
        padding:'10px 0 22px',display:'flex',justifyContent:'space-around',
        alignItems:'center',zIndex:40 }}>
        {[
          {key:'expenses',Icon:Wallet,      label:'Wallet'},
          {key:'notes',   Icon:MessageCircle,label:'Notes'},
          {key:'settings',Icon:Settings,    label:'Settings'},
        ].map(({key,Icon,label})=>(
          <button key={key} onClick={()=>setView(key)} className="nav-btn"
            style={{ color:view===key?'#7c3aed':'#94a3b8',position:'relative' }}>
            <Icon size={22}/>
            <span style={{ fontSize:10 }}>{label}</span>
            {view===key && (
              <div style={{ position:'absolute',bottom:-2,width:20,height:3,
                background:'linear-gradient(90deg,#7c3aed,#8b5cf6)',borderRadius:99 }}/>
            )}
          </button>
        ))}
      </nav>

      {/* ── ADD / EDIT MODAL ── */}
      {showAddModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(6px)',
          zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
          <div className="modal-slide" style={{ background:'white',width:'100%',maxWidth:430,
            borderRadius:'28px 28px 0 0',padding:24,boxShadow:'0 -12px 48px rgba(124,58,237,0.14)',
            maxHeight:'92vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h3 style={{ fontWeight:800,color:'#1e293b',fontSize:18,margin:0 }}>
                {isEditing?'Edit Entry':'Add Entry'}
              </h3>
              <button onClick={()=>setShowAddModal(false)} style={{ background:'#f1f5f9',border:'none',
                borderRadius:'50%',width:36,height:36,cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center' }}>
                <X size={18}/>
              </button>
            </div>
            <form onSubmit={handleAddOrEditExpense} style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {/* Type toggle */}
              <div style={{ display:'flex',background:'#f8fafc',borderRadius:16,padding:4 }}>
                {[{v:'debit',label:'💸 Expense',c:'#7c3aed'},{v:'credit',label:'💚 Income',c:'#22c55e'}].map(t=>(
                  <button key={t.v} type="button"
                    onClick={()=>setNewExpense({...newExpense,type:t.v})}
                    style={{ flex:1,padding:'10px 0',borderRadius:12,fontWeight:800,fontSize:13,
                      border:'none',cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s',
                      background:newExpense.type===t.v?t.c:'transparent',
                      color:newExpense.type===t.v?'white':'#94a3b8',
                      boxShadow:newExpense.type===t.v?`0 4px 12px ${t.c}40`:'none' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#94a3b8',
                  textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Amount</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',
                    color:'#94a3b8',fontWeight:800,fontSize:15 }}>Rs</span>
                  <input type="number" autoFocus value={newExpense.amount}
                    onChange={e=>setNewExpense({...newExpense,amount:e.target.value})}
                    style={{ width:'100%',boxSizing:'border-box',background:'#f8fafc',
                      border:`2px solid ${newExpense.type==='credit'?'#bbf7d0':'#f3e8ff'}`,
                      borderRadius:16,padding:'14px 14px 14px 44px',fontWeight:800,fontSize:20,
                      outline:'none',transition:'border-color 0.2s' }}
                    placeholder="0"/>
                </div>
              </div>

              {/* Category */}
              {newExpense.type==='debit' && (
                <div>
                  <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#94a3b8',
                    textTransform:'uppercase',letterSpacing:1,marginBottom:8 }}>Category</label>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                    {CATEGORIES.map(cat=>(
                      <button key={cat.id} type="button"
                        onClick={()=>setNewExpense({...newExpense,category:cat.id})}
                        style={{ padding:'10px 4px',borderRadius:16,display:'flex',flexDirection:'column',
                          alignItems:'center',gap:5,border:'none',cursor:'pointer',fontFamily:'inherit',
                          transition:'all 0.15s',
                          background:newExpense.category===cat.id?cat.color:'#f8fafc',
                          color:newExpense.category===cat.id?'white':'#64748b',
                          transform:newExpense.category===cat.id?'scale(1.06)':'scale(1)',
                          boxShadow:newExpense.category===cat.id?`0 4px 14px ${cat.color}50`:'none' }}>
                        <cat.icon size={17}/>
                        <span style={{ fontSize:9,fontWeight:800,textAlign:'center' }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date & Who */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div>
                  <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#94a3b8',
                    textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Date</label>
                  <input type="date" value={newExpense.date}
                    onChange={e=>setNewExpense({...newExpense,date:e.target.value})}
                    style={{ width:'100%',boxSizing:'border-box',background:'#f8fafc',
                      border:'1.5px solid #e2e8f0',borderRadius:14,padding:'10px 12px',
                      fontSize:13,fontWeight:700,outline:'none',fontFamily:'inherit' }}/>
                </div>
                <div>
                  <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#94a3b8',
                    textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Who?</label>
                  <select value={newExpense.who}
                    onChange={e=>setNewExpense({...newExpense,who:e.target.value})}
                    style={{ width:'100%',background:'#f8fafc',border:'1.5px solid #e2e8f0',
                      borderRadius:14,padding:'10px 12px',fontSize:13,fontWeight:700,
                      outline:'none',fontFamily:'inherit' }}>
                    <option value="user1">{u1}</option>
                    <option value="user2">{u2}</option>
                  </select>
                </div>
              </div>

              {/* Note */}
              <div>
                <label style={{ display:'block',fontSize:11,fontWeight:800,color:'#94a3b8',
                  textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>Note (optional)</label>
                <input value={newExpense.note}
                  onChange={e=>setNewExpense({...newExpense,note:e.target.value})}
                  style={{ width:'100%',boxSizing:'border-box',background:'#f8fafc',border:'1.5px solid #e2e8f0',
                    borderRadius:14,padding:'10px 14px',fontSize:13,fontWeight:700,outline:'none',fontFamily:'inherit' }}
                  placeholder={newExpense.type==='debit'?'e.g. Dinner at Monal':'e.g. Salary'}/>
              </div>

              <button type="submit" style={{ width:'100%',color:'white',padding:'15px 0',borderRadius:20,
                fontWeight:800,fontSize:16,border:'none',cursor:'pointer',fontFamily:'inherit',
                display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                background:newExpense.type==='credit'
                  ?'linear-gradient(135deg,#22c55e,#16a34a)'
                  :'linear-gradient(135deg,#7c3aed,#6d28d9)',
                boxShadow:newExpense.type==='credit'
                  ?'0 8px 24px rgba(34,197,94,0.3)'
                  :'0 8px 24px rgba(124,58,237,0.3)' }}>
                {isEditing?<><Check size={18}/> Update Entry</>:<><Plus size={18}/>{newExpense.type==='credit'?'Add Income':'Add Expense'}</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── BUDGET MODAL ── */}
      {showBudgetModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(6px)',
          zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div className="modal-slide" style={{ background:'white',width:'100%',maxWidth:360,
            borderRadius:28,padding:26,boxShadow:'0 24px 60px rgba(124,58,237,0.16)' }}>
            <h3 style={{ fontWeight:800,color:'#1e293b',fontSize:18,margin:'0 0 4px' }}>Set Budgets</h3>
            <p style={{ fontSize:13,color:'#94a3b8',margin:'0 0 20px',fontWeight:600 }}>
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
            <form onSubmit={handleUpdateBudget} style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {[{key:'user1',name:u1,color:'#3b82f6'},{key:'user2',name:u2,color:'#7c3aed'}].map(u=>(
                <div key={u.key}>
                  <label style={{ display:'block',fontSize:11,fontWeight:800,color:u.color,
                    textTransform:'uppercase',letterSpacing:1,marginBottom:6 }}>{u.name}'s Budget</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',
                      color:'#94a3b8',fontWeight:800,fontSize:14 }}>Rs</span>
                    <input type="number" placeholder="0" value={budgetInputs[u.key]}
                      onChange={e=>setBudgetInputs({...budgetInputs,[u.key]:e.target.value})}
                      style={{ width:'100%',boxSizing:'border-box',background:'#f8fafc',
                        border:`1.5px solid ${u.color}40`,borderRadius:14,
                        padding:'12px 14px 12px 42px',fontWeight:800,fontSize:18,outline:'none',fontFamily:'inherit' }}/>
                  </div>
                </div>
              ))}
              <div style={{ background:'#f5f3ff',borderRadius:14,padding:'10px 14px',
                display:'flex',gap:8,alignItems:'flex-start' }}>
                <span style={{ fontSize:16 }}>💡</span>
                <p style={{ fontSize:12,color:'#6d28d9',margin:0,fontWeight:700,lineHeight:1.5 }}>
                  Remaining = Budget − Expenses only. Income is tracked separately and won't change your budget balance.
                </p>
              </div>
              <div style={{ display:'flex',gap:10,marginTop:4 }}>
                <button type="button" onClick={()=>setShowBudgetModal(false)}
                  style={{ flex:1,background:'#f1f5f9',color:'#475569',border:'none',borderRadius:14,
                    padding:'12px 0',fontWeight:800,cursor:'pointer',fontSize:14,fontFamily:'inherit' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex:1,background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'white',
                    border:'none',borderRadius:14,padding:'12px 0',fontWeight:800,cursor:'pointer',
                    fontSize:14,fontFamily:'inherit',boxShadow:'0 4px 14px rgba(124,58,237,0.25)' }}>
                  Save Budgets
                </button>
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
