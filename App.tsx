
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, ShoppingCart, FileText, Plus, Search, ArrowLeft, ChevronDown, 
  Briefcase, TrendingUp, Camera, Truck, Utensils, Wrench, 
  Fuel, Sparkles, Filter, Shield, Target, User, Wallet, 
  ArrowDownLeft, ArrowUpRight, Coins, FileSignature, X, Image as ImageIcon, 
  HandCoins, Printer, Edit3, Trash2, FolderSearch, FileStack,
  Download, FileSpreadsheet, Settings, RefreshCw, Smartphone,
  Calendar, Hash
} from 'lucide-react';

// Strict separation of Type imports vs Value imports
import type { 
  ViewState, Order, Expense, FundTransaction, ExpenseType, 
  Currency, InvoiceItem, VoucherSubCategory, AppSettings 
} from './types';

import { analyzeReceiptImage } from './services/geminiService';

// --- Configuration ---
const CURRENCIES = {
  YER: { symbol: 'ر.ي', label: 'ريال يمني', code: 'YER' },
  SAR: { symbol: 'ر.س', label: 'ريال سعودي', code: 'SAR' }
};

const CATEGORIES = [
  { id: 'FUEL', label: 'وقود وزيوت', icon: Fuel, color: 'bg-amber-100 text-amber-700' },
  { id: 'CATERING', label: 'إعاشة وتموين', icon: Utensils, color: 'bg-orange-100 text-orange-700' },
  { id: 'MAINTENANCE', label: 'صيانة وقطع غيار', icon: Wrench, color: 'bg-blue-100 text-blue-700' },
  { id: 'OFFICE', label: 'أدوات مكتبية', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  { id: 'OPERATIONAL', label: 'نفقات تشغيلية', icon: Briefcase, color: 'bg-slate-100 text-slate-700' },
];

const BENEFICIARIES = [
  { id: 'HQ', label: 'قيادة اللواء', icon: Shield, color: 'bg-indigo-100 text-indigo-700' },
  { id: 'CO_1', label: 'الكتيبة الأولى', icon: Target, color: 'bg-red-100 text-red-700' },
  { id: 'CO_SUPPORT', label: 'كتيبة الإسناد', icon: Truck, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'MAINT_SEC', label: 'قسم الصيانة', icon: Wrench, color: 'bg-gray-100 text-gray-700' },
  { id: 'MED_POINT', label: 'النقطة الطبية', icon: Briefcase, color: 'bg-pink-100 text-pink-700' },
  { id: 'OTHER', label: 'مستفيد آخر / شخص', icon: User, color: 'bg-slate-100 text-slate-700' }
];

const DEFAULT_SETTINGS: AppSettings = {
  ministryName: 'ألوية العمالقة الجنوبية',
  brigadeName: 'اللواء ٤٣ عمالقة',
  unitName: 'المالية',
  footerRightTitle: 'المستلم / المستفيد',
  footerCenterTitle: 'أمين الصندوق',
  footerLeftTitle: 'يعتمد / الركن المالي',
  logo: undefined,
  currencySymbolYER: 'ر.ي',
  currencySymbolSAR: 'ر.س',
  defaultReportPeriod: 'MONTHLY'
};

// --- Helpers ---
const usePersistedState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage`, error);
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing ${key} to localStorage`, error);
        }
    }, [key, state]);

    return [state, setState];
};

const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
};

// --- PWA Install Hook ---
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    const appInstalledHandler = () => {
        setIsInstallable(false);
        setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, install };
};

// --- Components ---

const TransactionDetailModal = ({ transaction, settings, onClose }: { transaction: any, settings: AppSettings, onClose: () => void }) => {
    const isPurchase = transaction.categoryType === 'PURCHASE';
    const isVoucher = transaction.categoryType === 'VOUCHER';
    const isFund = transaction.categoryType === 'FUND';
    const isLoan = transaction.voucherSubCategory === 'LOAN';
    
    const docTitle = isPurchase 
        ? 'فاتورة مشتريات' 
        : (isVoucher 
            ? (isLoan ? 'سند سلفة / عهدة مؤقتة' : 'سند صرف نقدية') 
            : 'سند استلام عهدة');
    
    const docColor = isPurchase 
        ? 'border-blue-600' 
        : (isVoucher 
            ? (isLoan ? 'border-indigo-600' : 'border-orange-600') 
            : 'border-emerald-600');
    
    const titleColor = isPurchase 
        ? 'text-blue-800' 
        : (isVoucher 
            ? (isLoan ? 'text-indigo-800' : 'text-orange-800') 
            : 'text-emerald-800');

    const getSymbol = (code: string) => {
        if (code === 'YER') return settings.currencySymbolYER || CURRENCIES.YER.symbol;
        if (code === 'SAR') return settings.currencySymbolSAR || CURRENCIES.SAR.symbol;
        return code;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static print:block animate-fade-in">
            <div className="bg-white w-full max-w-3xl h-[85vh] md:h-auto rounded-3xl shadow-2xl flex flex-col overflow-hidden print:shadow-none print:h-auto print:w-full print:rounded-none">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 print:hidden select-none">
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-600" /></button>
                    <span className="font-bold text-gray-700">معاينة المستند</span>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                            <Printer className="w-4 h-4" />
                            طباعة
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
                    <div className={`border-4 double ${docColor} p-8 min-h-[600px] relative bg-white print:border-2`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                             {settings.logo ? (
                                <img src={settings.logo} className="w-96 h-96 object-contain grayscale" alt="" />
                             ) : (
                                <Shield className="w-96 h-96" />
                             )}
                        </div>

                        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                            <div className="text-center">
                                <h3 className="font-bold text-gray-800 text-sm mb-1">{settings.ministryName}</h3>
                                <h4 className="font-bold text-gray-600 text-xs">{settings.brigadeName}</h4>
                                <h4 className="font-bold text-gray-600 text-xs">{settings.unitName}</h4>
                            </div>
                            <div className="flex flex-col items-center">
                                {settings.logo ? (
                                    <img src={settings.logo} className="w-20 h-20 object-contain mb-2" alt="Logo" />
                                ) : (
                                    <Shield className="w-16 h-16 text-gray-800 mb-2" />
                                )}
                                <h2 className={`text-2xl font-bold ${titleColor} underline decoration-2 underline-offset-4`}>{docTitle}</h2>
                            </div>
                            <div className="text-left">
                                <div className="mb-1"><span className="font-bold text-gray-500 text-xs">التاريخ: </span><span className="font-mono font-bold text-gray-800">{transaction.date}</span></div>
                                <div><span className="font-bold text-gray-500 text-xs">الرقم: </span><span className="font-mono font-bold text-red-600 text-lg">#{transaction.documentNumber || '---'}</span></div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100 print:bg-transparent print:border-gray-200">
                                <div className="flex-1">
                                    <span className="block text-xs font-bold text-gray-500 mb-1">
                                        {isFund ? 'الجهة الموردة' : (isLoan ? 'اسم المستلف / على ذمة' : 'المستفيد / المطلوب منه')}
                                    </span>
                                    <div className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 w-full">
                                        {transaction.title || transaction.source}
                                    </div>
                                </div>
                                <div className="w-1/3">
                                    <span className="block text-xs font-bold text-gray-500 mb-1">العملة</span>
                                    <div className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-1 w-full flex justify-between">
                                        <span>{CURRENCIES[transaction.currency as Currency]?.label}</span>
                                        <span className="text-xs text-gray-400">{transaction.currency}</span>
                                    </div>
                                </div>
                            </div>

                            {isPurchase && transaction.items && transaction.items.length > 0 ? (
                                <div className="mb-8">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 print:bg-gray-100">
                                                <th className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 w-12 text-center">م</th>
                                                <th className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700">الصنف / البيان</th>
                                                <th className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 w-24 text-center">الكمية</th>
                                                <th className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 w-32 text-center">السعر</th>
                                                <th className="border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 w-32 text-center">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transaction.items.map((item: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold text-gray-500">{idx + 1}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-sm font-bold text-gray-800">{item.name}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-mono font-bold">{item.quantity}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-mono font-bold">{item.unitPrice.toLocaleString()}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-mono font-bold">{(item.quantity * item.unitPrice).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={4} className="border border-gray-300 px-3 py-2 text-sm font-bold text-left bg-gray-50">الإجمالي الكلي</td>
                                                <td className="border border-gray-300 px-3 py-2 text-lg font-bold text-center bg-gray-100 text-blue-800">{transaction.amount.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="mb-8 text-center border-2 border-gray-100 rounded-xl p-8 bg-gray-50 print:bg-transparent print:border-gray-200">
                                    <p className="text-sm font-bold text-gray-500 mb-2">مبلغ وقدره</p>
                                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">{transaction.amount.toLocaleString()} <span className="text-lg text-gray-500">{getSymbol(transaction.currency)}</span></h1>
                                    <div className="h-px bg-gray-300 w-1/2 mx-auto my-4"></div>
                                    <p className="text-sm font-bold text-gray-500 mb-2">
                                        {isLoan ? 'نوع السند: سلفة شخصية / عهدة مؤقتة' : 'وذلك مقابل / البيان'}
                                    </p>
                                    <p className="text-lg font-bold text-gray-800 leading-relaxed">{transaction.notes || '---'}</p>
                                </div>
                            )}

                            {transaction.receiptImage && (
                                <div className="mb-8 page-break-inside-avoid">
                                    <p className="text-xs font-bold text-gray-500 mb-2">صورة المرفق / الفاتورة الأصل:</p>
                                    <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 inline-block max-w-full">
                                        <img src={transaction.receiptImage} alt="Receipt" className="max-h-64 object-contain" />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-gray-300 page-break-inside-avoid">
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-500 mb-8">{settings.footerRightTitle}</p>
                                    <p className="font-bold text-sm text-gray-900">........................</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-500 mb-8 whitespace-pre-line">{settings.footerCenterTitle}</p>
                                    <p className="font-bold text-sm text-gray-900">........................</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-500 mb-8 whitespace-pre-line">{settings.footerLeftTitle}</p>
                                    <p className="font-bold text-sm text-gray-900">........................</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BottomNav = ({ active, onChange }: { active: ViewState, onChange: (v: ViewState) => void }) => {
  const items = [
    { id: 'DASHBOARD', icon: Home, label: 'الرئيسية' },
    { id: 'PROCUREMENT', icon: ShoppingCart, label: 'المشتريات' },
    { id: 'ADD_EXPENSE', icon: Plus, label: '', isFloating: true },
    { id: 'INVENTORY', icon: FolderSearch, label: 'الأرشيف' }, 
    { id: 'FINANCE', icon: FileText, label: 'التقارير' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 border-t border-gray-100 pb-safe pt-2 shadow-[0_-5px_25px_rgba(0,0,0,0.04)] z-40 backdrop-blur-2xl no-print select-none">
      <div className="flex justify-between items-end px-2 sm:px-6">
        {items.map((item) => {
          const isActive = active === item.id;
          if (item.isFloating) {
            return (
              <div key={item.id} className="relative -top-8 px-2 flex justify-center pointer-events-none">
                <button
                  onClick={() => onChange(item.id as ViewState)}
                  className="pointer-events-auto bg-emerald-600 text-white w-16 h-16 rounded-full shadow-lg shadow-emerald-200 flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-all border-4 border-white"
                >
                  <Plus className="w-8 h-8" />
                </button>
              </div>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id as ViewState)}
              className={`flex flex-col items-center gap-1.5 p-2 flex-1 rounded-2xl transition-all touch-manipulation active:scale-95 ${isActive ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110 fill-current' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

const DashboardView = ({ orders, expenses, funds, onChangeView, isInstallable, onInstall, settings }: any) => {
  const [activeCurrency, setActiveCurrency] = useState<Currency>('YER');
  const isOnline = useOnlineStatus();
  
  const totalReceivedYER = funds.filter((f: FundTransaction) => f.currency === 'YER').reduce((acc: number, curr: FundTransaction) => acc + curr.amount, 0);
  const totalSpentYER = expenses.filter((e: Expense) => e.currency === 'YER').reduce((acc: number, curr: Expense) => acc + curr.amount, 0);
  const balanceYER = totalReceivedYER - totalSpentYER;

  const totalReceivedSAR = funds.filter((f: FundTransaction) => f.currency === 'SAR').reduce((acc: number, curr: FundTransaction) => acc + curr.amount, 0);
  const totalSpentSAR = expenses.filter((e: Expense) => e.currency === 'SAR').reduce((acc: number, curr: Expense) => acc + curr.amount, 0);
  const balanceSAR = totalReceivedSAR - totalSpentSAR;

  const currentBalance = activeCurrency === 'YER' ? balanceYER : balanceSAR;
  const currentReceived = activeCurrency === 'YER' ? totalReceivedYER : totalReceivedSAR;
  const currentSpent = activeCurrency === 'YER' ? totalSpentYER : totalSpentSAR;
  
  const getSymbol = (code: string) => {
      if (code === 'YER') return settings?.currencySymbolYER || CURRENCIES.YER.symbol;
      if (code === 'SAR') return settings?.currencySymbolSAR || CURRENCIES.SAR.symbol;
      return code;
  };
  const currencySymbol = getSymbol(activeCurrency);

  return (
    <div className="pb-36 animate-fade-in bg-slate-50 min-h-screen select-none">
      <div className="bg-white px-5 pt-safe pb-8 rounded-b-[2.5rem] shadow-sm relative z-20">
        <div className="flex justify-between items-center mb-6 mt-2">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 relative shadow-sm overflow-hidden">
               {settings?.logo ? (
                 <img src={settings.logo} className="w-full h-full object-cover" alt="Logo" />
               ) : (
                 <Shield className="w-6 h-6 text-emerald-700" />
               )}
               <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 font-bold">مرحباً بك،</span>
               <h2 className="text-lg font-bold text-gray-900 leading-none">أمين الصندوق</h2>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {isInstallable && (
                <button 
                    onClick={onInstall} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-200 active:scale-95 transition-all animate-pulse mr-2"
                >
                    <Smartphone className="w-4 h-4" />
                    <span className="text-xs font-bold">تثبيت</span>
                </button>
            )}
            <button onClick={() => onChangeView('SETTINGS')} className="p-2.5 bg-gray-50 rounded-full active:bg-gray-200 transition-colors touch-manipulation">
                <Settings className="text-gray-600 w-6 h-6" />
            </button>
          </div>
        </div>

        <div className={`rounded-[2rem] p-7 text-white shadow-xl relative overflow-hidden ring-1 ring-black/5 mx-1 transition-all duration-500 ${activeCurrency === 'YER' ? 'bg-gradient-to-br from-emerald-800 to-teal-700 shadow-emerald-200/50' : 'bg-gradient-to-br from-blue-800 to-indigo-700 shadow-blue-200/50'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-20 -translate-x-10 blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <span className="text-white/90 text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 opacity-70" />
                    رصيد الصندوق ({CURRENCIES[activeCurrency].label})
                </span>
                
                <div className="flex bg-black/20 rounded-lg p-1 backdrop-blur-sm">
                    <button 
                        onClick={() => setActiveCurrency('YER')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeCurrency === 'YER' ? 'bg-white text-emerald-800 shadow-sm' : 'text-white/60 hover:text-white'}`}
                    >
                        {CURRENCIES.YER.code}
                    </button>
                    <button 
                        onClick={() => setActiveCurrency('SAR')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeCurrency === 'SAR' ? 'bg-white text-blue-800 shadow-sm' : 'text-white/60 hover:text-white'}`}
                    >
                        {CURRENCIES.SAR.code}
                    </button>
                </div>
            </div>
            
            <div className="flex items-baseline gap-1 mb-6 dir-ltr justify-end">
                <span className="text-lg font-medium opacity-80">{currencySymbol}</span>
                <span className="text-4xl sm:text-5xl font-bold tracking-tight">{currentBalance.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-sm border border-white/10 ${currentBalance >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-100'}`}>
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{currentBalance >= 0 ? 'الرصيد متوفر' : 'عجز في الرصيد'}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 px-6 -mt-8 relative z-30">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-center gap-1">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-1">
                <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-gray-400 font-bold">المصروفات ({currencySymbol})</span>
            <span className="font-bold text-gray-800 text-base">{currentSpent.toLocaleString()}</span>
        </div>
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-center gap-1">
             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1">
                <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className="text-[11px] text-gray-400 font-bold">المستلم ({currencySymbol})</span>
            <span className="font-bold text-gray-800 text-base">{currentReceived.toLocaleString()}</span>
        </div>
      </div>

      <div className="px-6 mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            إجراءات سريعة
        </h3>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'طلب شراء', icon: Plus, bg: 'bg-emerald-600', text: 'text-white', action: () => onChangeView('PROCUREMENT') },
            { label: 'صرف / فاتورة', icon: FileSignature, bg: 'bg-white', text: 'text-emerald-700', action: () => onChangeView('ADD_EXPENSE') },
            { label: 'الأرشيف', icon: FileStack, bg: 'bg-white', text: 'text-emerald-700', action: () => onChangeView('INVENTORY') }, 
            { label: 'استلام عهدة', icon: Coins, bg: 'bg-white', text: 'text-emerald-700', action: () => onChangeView('ADD_FUND') },
          ].map((action, idx) => (
            <button key={idx} onClick={action.action} className="group flex flex-col items-center gap-2.5 active:scale-95 transition-transform touch-manipulation">
              <div className={`w-[16vw] h-[16vw] max-w-[4rem] max-h-[4rem] sm:w-16 sm:h-16 ${action.bg} rounded-[1.2rem] shadow-sm flex items-center justify-center ${action.text} border border-gray-100 group-hover:shadow-md transition-all`}>
                <action.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AddExpenseView = ({ onSave, onCancel, initialData, existingExpenses }: any) => {
  const [type, setType] = useState<ExpenseType>(initialData?.type || 'VOUCHER');
  const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'YER');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [voucherSubCategory, setVoucherSubCategory] = useState<VoucherSubCategory>(initialData?.voucherSubCategory || 'EXPENSE');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'OPERATIONAL');
  const [beneficiary, setBeneficiary] = useState(initialData?.beneficiary || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState(initialData?.documentNumber || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(initialData?.receiptImage || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBeneficiaryList, setShowBeneficiaryList] = useState(false);

  useEffect(() => {
      if (initialData?.items && initialData.items.length > 0) {
          setInvoiceItems(initialData.items);
      } else if (!initialData && type === 'PURCHASE' && invoiceItems.length === 0) {
          setInvoiceItems([{ id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 }]);
      }
  }, [initialData, type]);

  useEffect(() => {
    if (!initialData) {
      const relevantExpenses = existingExpenses.filter((e: Expense) => e.type === type);
      let maxNum = 0;
      relevantExpenses.forEach((e: Expense) => {
        const num = parseInt(e.documentNumber || '0', 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      setDocumentNumber(String(maxNum + 1).padStart(4, '0'));
    }
  }, [type, existingExpenses, initialData]);

  useEffect(() => {
      if (type === 'PURCHASE') {
          const total = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          setAmount(total.toString());
      }
  }, [invoiceItems, type]);

  const handleAddItem = () => setInvoiceItems([...invoiceItems, { id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 }]);
  
  const handleRemoveItem = (id: string) => {
      if (invoiceItems.length > 1) setInvoiceItems(invoiceItems.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
      setInvoiceItems(invoiceItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessing(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64 = reader.result as string;
              setReceiptImage(base64);
              
              // Call Gemini AI
              try {
                  const base64Data = base64.split(',')[1];
                  const aiData = await analyzeReceiptImage(base64Data);
                  if (aiData) {
                      if (aiData.amount) setAmount(String(aiData.amount).replace(/[^0-9.]/g, ''));
                      if (aiData.beneficiary) setBeneficiary(aiData.beneficiary);
                      if (aiData.date) setDate(aiData.date);
                      if (aiData.category) {
                           const matchedCat = CATEGORIES.find(c => c.label.includes(aiData.category) || aiData.category.includes(c.label));
                           if (matchedCat) setSelectedCategory(matchedCat.id);
                      }
                      if (aiData.notes) setNotes(aiData.notes);
                  }
              } catch (error) {
                  console.error("AI Analysis failed", error);
              }
              setIsProcessing(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
    if (!amount || (!beneficiary && type === 'VOUCHER')) return;

    const expenseData: Expense = {
      id: initialData?.id || Date.now().toString(),
      type,
      currency,
      amount: parseFloat(amount),
      category: selectedCategory,
      beneficiary,
      date,
      documentNumber,
      notes,
      items: type === 'PURCHASE' ? invoiceItems : undefined,
      receiptImage: receiptImage || undefined,
      voucherSubCategory: type === 'VOUCHER' ? voucherSubCategory : undefined
    };

    onSave(expenseData);
  };

  return (
    <div className="bg-white min-h-screen pb-safe animate-fade-in relative z-50 select-none">
      <div className={`px-5 py-4 flex items-center justify-between border-b sticky top-0 z-30 pt-safe backdrop-blur-md transition-colors ${type === 'VOUCHER' ? 'bg-orange-50/90 border-orange-100' : 'bg-blue-50/90 border-blue-100'}`}>
        <button onClick={onCancel} className="p-2 -mr-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors">
            <X className={`w-6 h-6 ${type === 'VOUCHER' ? 'text-orange-900' : 'text-blue-900'}`} />
        </button>
        <span className={`text-lg font-bold ${type === 'VOUCHER' ? 'text-orange-900' : 'text-blue-900'}`}>
            {initialData ? 'تعديل عملية' : (type === 'VOUCHER' ? 'سند صرف نقدية' : 'فاتورة مشتريات')}
        </span>
        <div className="w-8"></div>
      </div>

      <div className="px-5 py-6 space-y-6 pb-40">
        <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-100 p-1 rounded-xl flex relative">
                <button onClick={() => setType('VOUCHER')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all z-10 ${type === 'VOUCHER' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}>سند صرف</button>
                <button onClick={() => setType('PURCHASE')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all z-10 ${type === 'PURCHASE' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>فاتورة شراء</button>
            </div>
            <div className="w-1/3 bg-gray-100 p-1 rounded-xl flex">
                <button onClick={() => setCurrency(currency === 'YER' ? 'SAR' : 'YER')} className="w-full h-full bg-white rounded-lg shadow-sm text-xs font-bold flex flex-col items-center justify-center text-gray-700 active:scale-95 transition-transform">
                    <span className="text-[9px] text-gray-400">العملة</span>
                    {CURRENCIES[currency].code}
                </button>
            </div>
        </div>

        {/* --- VOUCHER UI --- */}
        {type === 'VOUCHER' && (
            <div className={`bg-orange-50 border-2 border-dashed rounded-xl p-5 relative overflow-hidden transition-colors ${voucherSubCategory === 'LOAN' ? 'border-indigo-200 bg-indigo-50/50' : 'border-orange-200'}`}>
                <div className="relative z-10 space-y-6">
                    <div className="flex bg-white/50 p-1 rounded-lg border border-gray-100">
                        <button onClick={() => setVoucherSubCategory('EXPENSE')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${voucherSubCategory === 'EXPENSE' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-400'}`}>عهدة / مصروفات</button>
                        <button onClick={() => setVoucherSubCategory('LOAN')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${voucherSubCategory === 'LOAN' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-400'}`}>سلفة / عهدة مؤقتة</button>
                    </div>

                    <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                         <div><label className="text-[10px] font-bold text-gray-500 block mb-0.5">رقم السند</label><div className="text-xl font-mono font-bold text-gray-800">#{documentNumber}</div></div>
                         <div className="text-left"><label className="text-[10px] font-bold text-gray-500 block mb-0.5">التاريخ</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent font-bold text-gray-800 text-sm focus:outline-none text-left" /></div>
                    </div>

                    <div>
                        <label className={`text-xs font-bold block mb-2 ${voucherSubCategory === 'LOAN' ? 'text-indigo-700' : 'text-orange-700'}`}>{voucherSubCategory === 'LOAN' ? 'اسم المستلف (على ذمة)' : 'اصرفوا لأمر / المستفيد'}</label>
                        <div className="relative">
                            <input type="text" value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="اكتب الاسم..." className="w-full bg-white border rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 border-orange-200 focus:ring-orange-300" />
                            <button onClick={() => setShowBeneficiaryList(!showBeneficiaryList)} className="absolute left-2 top-2 p-1.5 rounded-md text-orange-400 hover:bg-orange-100"><ChevronDown className="w-4 h-4" /></button>
                            {showBeneficiaryList && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                                    {BENEFICIARIES.filter(b => b.id !== 'OTHER').map((b) => (
                                        <button key={b.id} onClick={() => { setBeneficiary(b.label); setShowBeneficiaryList(false); }} className="w-full text-right px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><b.icon className="w-4 h-4 text-gray-400" />{b.label}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center py-2">
                        <label className={`text-xs font-bold block mb-2 ${voucherSubCategory === 'LOAN' ? 'text-indigo-700' : 'text-orange-700'}`}>مبلغ وقدره</label>
                        <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="00" className={`text-5xl font-bold text-center bg-transparent w-full focus:outline-none ${voucherSubCategory === 'LOAN' ? 'text-indigo-900 placeholder-indigo-200' : 'text-orange-900 placeholder-orange-200'}`} />
                        <span className={`text-sm font-bold mt-1 block ${voucherSubCategory === 'LOAN' ? 'text-indigo-600' : 'text-orange-600'}`}>{CURRENCIES[currency].label}</span>
                    </div>

                    <div><label className="text-xs font-bold text-gray-500 block mb-2">وذلك مقابل / البيان</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-white border border-orange-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none" placeholder="شرح سبب الصرف..." /></div>
                </div>
            </div>
        )}

        {/* --- PURCHASE UI --- */}
        {type === 'PURCHASE' && (
            <div className="space-y-5">
                 <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                     <div><label className="text-[10px] text-gray-400 font-bold block">رقم الفاتورة</label><span className="font-mono font-bold text-gray-800">#{documentNumber}</span></div>
                     <div className="flex-1 mr-4"><label className="text-[10px] text-gray-400 font-bold block mb-1">تاريخ الشراء</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 rounded px-2 py-1 text-xs font-bold focus:outline-none" /></div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600">المورد / المتجر</label>
                     <input type="text" value={beneficiary} onChange={e => setBeneficiary(e.target.value)} placeholder="اسم المحل أو التاجر" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100" />
                 </div>

                 <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                     <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center"><h4 className="text-xs font-bold text-gray-500 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> قائمة الأصناف</h4><span className="text-[10px] bg-white px-2 py-0.5 rounded text-gray-400 border border-gray-200">{invoiceItems.length} صنف</span></div>
                     <div className="divide-y divide-gray-100">
                         {invoiceItems.map((item, index) => (
                             <div key={item.id} className="p-3 hover:bg-white transition-colors">
                                 <div className="flex gap-2 mb-2">
                                     <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-[10px] font-bold text-gray-500">{index + 1}</span>
                                     <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} placeholder="اسم الصنف" className="flex-1 bg-transparent border-b border-dashed border-gray-300 text-sm font-bold text-gray-800 focus:outline-none" />
                                 </div>
                                 <div className="flex items-center gap-3 pr-8">
                                     <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-200 px-2 py-1"><span className="text-[10px] text-gray-400 ml-2">الكمية</span><input type="number" inputMode="decimal" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none" /></div>
                                     <span className="text-gray-400">×</span>
                                     <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-200 px-2 py-1"><span className="text-[10px] text-gray-400 ml-2">السعر</span><input type="number" inputMode="decimal" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-sm font-bold text-center focus:outline-none" /></div>
                                     <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" disabled={invoiceItems.length === 1}><Trash2 className="w-4 h-4" /></button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <button onClick={handleAddItem} className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100"><Plus className="w-4 h-4" /> إضافة صنف جديد</button>
                     <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center"><span className="text-xs font-bold text-gray-500">الإجمالي الكلي</span><span className="text-xl font-bold text-blue-700">{amount || '0'} <span className="text-xs text-gray-400">{CURRENCIES[currency].symbol}</span></span></div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600">مسح الفاتورة ضوئياً (AI)</label>
                     <div className={`border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                         <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                         {isProcessing ? (
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                         ) : receiptImage ? (
                             <div className="relative w-full h-32 rounded-lg overflow-hidden">
                                 <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                                 <button onClick={(e) => { e.preventDefault(); setReceiptImage(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full z-10"><X className="w-4 h-4" /></button>
                             </div>
                         ) : (
                             <>
                                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-400">اضغط لالتقاط صورة للتحليل الذكي</span>
                             </>
                         )}
                     </div>
                 </div>
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-40">
        <button onClick={handleSave} disabled={!amount} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none min-h-[56px] text-white ${type === 'VOUCHER' ? 'bg-orange-600 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}>
            {initialData ? 'حفظ التعديلات' : (type === 'VOUCHER' ? (voucherSubCategory === 'LOAN' ? 'اعتماد السلفة' : 'اعتماد سند الصرف') : 'حفظ الفاتورة')}
        </button>
      </div>
    </div>
  );
};

// --- SettingsView ---
const SettingsView = ({ settings, onSave, onBack }: { settings: AppSettings, onSave: (s: AppSettings) => void, onBack: () => void }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-safe animate-fade-in">
       {/* Header */}
       <div className="bg-white px-5 py-4 flex items-center gap-3 border-b sticky top-0 z-30 pt-safe">
          <button onClick={onBack} className="p-2 -mr-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-6 h-6 text-gray-700"/></button>
          <h1 className="text-xl font-bold text-gray-800">الإعدادات</h1>
       </div>

       <div className="p-5 space-y-6">
          {/* Logo Section */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600"/>
                شعار المؤسسة
             </h3>
             <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden relative">
                   {localSettings.logo ? (
                      <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                   ) : (
                      <Shield className="w-12 h-12 text-gray-300" />
                   )}
                </div>
                <div className="flex gap-2">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload}/>
                   <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
                      رفع شعار
                   </button>
                   {localSettings.logo && (
                      <button onClick={() => handleChange('logo', undefined)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                         حذف
                      </button>
                   )}
                </div>
             </div>
          </section>

          {/* Org Info */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600"/>
                بيانات المؤسسة
             </h3>
             <input value={localSettings.ministryName} onChange={e => handleChange('ministryName', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="الجهة العليا (مثل: وزارة الدفاع)" />
             <input value={localSettings.brigadeName} onChange={e => handleChange('brigadeName', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="اسم الوحدة (مثل: اللواء الأول)" />
             <input value={localSettings.unitName} onChange={e => handleChange('unitName', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="القسم الفرعي (مثل: الصندوق المالي)" />
          </section>

          {/* Currencies & Reports */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Coins className="w-5 h-5 text-blue-600"/>
                العملات والتقارير
             </h3>
             
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">رمز الريال اليمني</label>
                   <input value={localSettings.currencySymbolYER || 'ر.ي'} onChange={e => handleChange('currencySymbolYER', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-center" />
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 mb-1 block">رمز الريال السعودي</label>
                   <input value={localSettings.currencySymbolSAR || 'ر.س'} onChange={e => handleChange('currencySymbolSAR', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-center" />
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">الفترة الافتراضية للتقارير</label>
                <select value={localSettings.defaultReportPeriod || 'MONTHLY'} onChange={e => handleChange('defaultReportPeriod', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold text-gray-700">
                   <option value="WEEKLY">أسبوعي</option>
                   <option value="MONTHLY">شهري</option>
                   <option value="YEARLY">سنوي</option>
                </select>
             </div>
          </section>

          {/* Print Footer */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
             <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600"/>
                توقيعات الطباعة
             </h3>
             <div className="grid grid-cols-1 gap-3">
                <input value={localSettings.footerRightTitle} onChange={e => handleChange('footerRightTitle', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="العنوان الأيمن (المستلم)" />
                <input value={localSettings.footerCenterTitle} onChange={e => handleChange('footerCenterTitle', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="العنوان الأوسط (أمين الصندوق)" />
                <input value={localSettings.footerLeftTitle} onChange={e => handleChange('footerLeftTitle', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border-none text-sm font-bold" placeholder="العنوان الأيسر (الاعتماد)" />
             </div>
          </section>

          <button onClick={() => onSave(localSettings)} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all">
             حفظ التغييرات
          </button>
       </div>
    </div>
  );
}

// Improved Inventory View (Archive)
const InventoryView = ({ 
  expenses, 
  funds, 
  settings, 
  isInstallable, 
  onInstall 
}: { 
  expenses: Expense[], 
  funds: FundTransaction[], 
  settings: AppSettings, 
  isInstallable?: boolean, 
  onInstall?: () => void 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'FUND' | 'PURCHASE' | 'VOUCHER_EXPENSE' | 'VOUCHER_LOAN'>('ALL');
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

    // Normalize Data
    const allTransactions = [
        ...expenses.map(e => ({ 
            ...e, 
            categoryType: e.type, 
            title: e.beneficiary, 
            dateObj: new Date(e.date),
            subType: e.voucherSubCategory 
        })),
        ...funds.map(f => ({ 
            ...f, 
            categoryType: 'FUND', 
            title: f.source, 
            type: 'FUND', 
            dateObj: new Date(f.date), 
            documentNumber: undefined,
            subType: undefined,
            category: undefined
        }))
    ].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    // Filter Logic
    const filtered = allTransactions.filter(t => {
        const docNum = t.documentNumber || '';
        const notes = t.notes || '';
        const catLabel = CATEGORIES.find(c => c.id === t.category)?.label || '';
        
        const term = searchTerm.toLowerCase();
        
        const matchesSearch = t.title.toLowerCase().includes(term) || 
                              t.amount.toString().includes(term) ||
                              docNum.includes(term) ||
                              notes.toLowerCase().includes(term) ||
                              catLabel.includes(term);
        
        let matchesType = true;
        switch (filterType) {
            case 'FUND': matchesType = t.categoryType === 'FUND'; break;
            case 'PURCHASE': matchesType = t.categoryType === 'PURCHASE'; break;
            case 'VOUCHER_EXPENSE': matchesType = t.categoryType === 'VOUCHER' && t.subType === 'EXPENSE'; break;
            case 'VOUCHER_LOAN': matchesType = t.categoryType === 'VOUCHER' && t.subType === 'LOAN'; break;
            default: matchesType = true;
        }

        return matchesSearch && matchesType;
    });

    // Calculate Totals for the current view
    const totalCount = filtered.length;
    const totalAmountYER = filtered.filter(t => t.currency === 'YER').reduce((acc, t) => acc + (t.categoryType === 'FUND' ? t.amount : -t.amount), 0);
    const totalAmountSAR = filtered.filter(t => t.currency === 'SAR').reduce((acc, t) => acc + (t.categoryType === 'FUND' ? t.amount : -t.amount), 0);

    // Group by Date
    const groupedTransactions: { [key: string]: any[] } = {};
    filtered.forEach(t => {
        const dateKey = t.date;
        if (!groupedTransactions[dateKey]) groupedTransactions[dateKey] = [];
        groupedTransactions[dateKey].push(t);
    });

    // Export Handler
    const handleExport = () => {
        const headers = ['التاريخ', 'رقم المستند', 'النوع', 'الاسم/البيان', 'المبلغ', 'العملة', 'الملاحظات'];
        const rows = filtered.map(t => [
            t.date,
            t.documentNumber || '-',
            t.categoryType === 'FUND' ? 'توريد' : (t.categoryType === 'PURCHASE' ? 'شراء' : 'صرف'),
            t.title,
            t.amount,
            t.currency,
            t.notes || '-'
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `archive_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getIcon = (type: string, subType?: string) => {
        if (type === 'FUND') return <ArrowDownLeft className="text-emerald-600" size={20} />;
        if (type === 'PURCHASE') return <ShoppingCart className="text-blue-600" size={20} />;
        if (type === 'VOUCHER') {
            return subType === 'LOAN' 
                ? <HandCoins className="text-indigo-600" size={20} /> 
                : <FileSignature className="text-orange-600" size={20} />;
        }
        return <FileText className="text-gray-600" size={20} />;
    };

    const getColor = (type: string, subType?: string) => {
        if (type === 'FUND') return 'bg-emerald-50 border-emerald-100';
        if (type === 'PURCHASE') return 'bg-blue-50 border-blue-100';
        if (type === 'VOUCHER') {
             return subType === 'LOAN' 
                ? 'bg-indigo-50 border-indigo-100' 
                : 'bg-orange-50 border-orange-100';
        }
        return 'bg-gray-50 border-gray-100';
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-36 animate-fade-in">
            {/* Header */}
            <div className="bg-white px-5 pt-safe pb-4 shadow-sm border-b sticky top-0 z-20">
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h1 className="text-xl font-bold text-gray-800">الأرشيف والسجلات</h1>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>تصدير</span>
                        </button>
                        {isInstallable && onInstall && (
                            <button 
                                onClick={onInstall} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all animate-pulse"
                            >
                                <Download className="w-4 h-4" />
                                <span>تثبيت</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="ابحث بالاسم، البيان، أو رقم السند..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-100 border-none rounded-xl py-3 pr-10 pl-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'ALL', label: 'الكل' },
                        { id: 'FUND', label: 'الواردات' },
                        { id: 'PURCHASE', label: 'المشتريات' },
                        { id: 'VOUCHER_EXPENSE', label: 'سندات صرف' },
                        { id: 'VOUCHER_LOAN', label: 'سلف وعهد' }
                    ].map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setFilterType(f.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === f.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Summary Card */}
                {filtered.length > 0 && (
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-bold text-slate-300">ملخص النتائج</h3>
                            <span className="bg-white/10 px-2 py-1 rounded-lg text-xs font-mono">{totalCount} عملية</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-white/10">
                            <div>
                                <span className="text-xs text-slate-400 block mb-1">الصافي (ريال يمني)</span>
                                <span className={`text-lg font-bold dir-ltr block ${totalAmountYER >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {totalAmountYER.toLocaleString()} <span className="text-xs text-slate-500">YER</span>
                                </span>
                            </div>
                            <div className="pr-4">
                                <span className="text-xs text-slate-400 block mb-1">الصافي (ريال سعودي)</span>
                                <span className={`text-lg font-bold dir-ltr block ${totalAmountSAR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {totalAmountSAR.toLocaleString()} <span className="text-xs text-slate-500">SAR</span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* List grouped by date */}
                {Object.keys(groupedTransactions).length > 0 ? (
                    Object.entries(groupedTransactions).map(([date, items]) => (
                        <div key={date}>
                            <h3 className="text-xs font-bold text-gray-400 mb-3 pr-2 border-r-2 border-gray-200">{date}</h3>
                            <div className="space-y-3">
                                {items.map((item: any) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => setSelectedTransaction(item)}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center active:scale-[0.98] transition-transform cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors group-hover:bg-opacity-80 ${getColor(item.categoryType, item.subType)}`}>
                                                {getIcon(item.categoryType, item.subType)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                                                    {item.documentNumber ? (
                                                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded text-slate-500 font-mono">#{item.documentNumber}</span>
                                                    ) : (
                                                        <span className="text-xs italic opacity-50">بدون رقم</span>
                                                    )}
                                                    
                                                </div>
                                                {/* Category/Notes Preview */}
                                                {(item.category || item.notes) && (
                                                    <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">
                                                        {CATEGORIES.find(c => c.id === item.category)?.label || item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <span className={`font-bold text-base block ${item.categoryType === 'FUND' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {item.categoryType === 'FUND' ? '+' : '-'}{item.amount.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">{item.currency === 'YER' ? 'ر.ي' : 'ر.س'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FolderSearch size={32} className="opacity-40" />
                        </div>
                        <p className="font-bold text-sm">لا توجد سجلات مطابقة</p>
                        <p className="text-xs mt-1">حاول تغيير خيارات البحث أو التصفية</p>
                    </div>
                )}
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <TransactionDetailModal 
                    transaction={selectedTransaction} 
                    settings={settings} 
                    onClose={() => setSelectedTransaction(null)} 
                />
            )}
        </div>
    );
};

// Stub components for missing views to ensure compilation
const FinancialReportView = ({ expenses, funds, onEditExpense, onDeleteExpense }: any) => {
    return (
         <div className="bg-slate-50 min-h-screen pb-36 p-5">
            <h2 className="text-xl font-bold mb-4">التقارير المالية</h2>
            <div className="bg-white p-5 rounded-xl shadow-sm mb-4">
                <p>إجمالي المصروفات: {expenses.reduce((a:number, b:Expense) => a + b.amount, 0)}</p>
                <p>إجمالي الواردات: {funds.reduce((a:number, b:FundTransaction) => a + b.amount, 0)}</p>
            </div>
            {expenses.map((e: Expense) => (
                <div key={e.id} className="bg-white p-4 rounded-xl mb-2 shadow-sm flex justify-between items-center">
                    <span>{e.beneficiary} ({e.amount})</span>
                    <div className="flex gap-2">
                        <button onClick={() => onEditExpense(e)} className="text-blue-500"><Edit3 size={16}/></button>
                        <button onClick={() => onDeleteExpense(e.id)} className="text-red-500"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
    )
}
const AddFundView = ({ onSave, onCancel }: any) => {
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [currency, setCurrency] = useState<Currency>('YER');
    
    return (
        <div className="bg-white min-h-screen p-5 pb-safe animate-fade-in relative z-50">
             <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-gray-800">استلام عهدة (توريد)</h2>
                 <button onClick={onCancel} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
             </div>
            
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المبلغ</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-4 rounded-xl border-2 border-emerald-100 focus:border-emerald-500 focus:outline-none text-2xl font-bold text-center" placeholder="00" />
                </div>
                
                <div className="flex gap-2">
                    <button onClick={() => setCurrency('YER')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${currency === 'YER' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-400'}`}>ر.ي</button>
                    <button onClick={() => setCurrency('SAR')} className={`flex-1 py-3 rounded-xl font-bold border-2 ${currency === 'SAR' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-400'}`}>ر.س</button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">المصدر / المورد</label>
                    <input type="text" value={source} onChange={e => setSource(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-emerald-500 focus:outline-none font-bold" placeholder="اسم الجهة الموردة..." />
                </div>

                <button 
                    onClick={() => onSave({
                        id: Date.now().toString(), 
                        amount: Number(amount), 
                        currency, 
                        source, 
                        date: new Date().toISOString().split('T')[0]
                    })} 
                    disabled={!amount || !source}
                    className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-emerald-200 mt-4 disabled:opacity-50"
                >
                    حفظ التوريد
                </button>
             </div>
        </div>
    )
}

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [orders, setOrders] = usePersistedState<Order[]>('orders', []);
  const [expenses, setExpenses] = usePersistedState<Expense[]>('expenses', []);
  const [funds, setFunds] = usePersistedState<FundTransaction[]>('funds', []);
  const [settings, setSettings] = usePersistedState<AppSettings>('app_settings_v2', DEFAULT_SETTINGS);
  
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const { isInstallable, install } = usePWAInstall();

  const handleSaveExpense = (newExpense: Expense) => {
      if (editingExpense) {
          setExpenses(prev => prev.map(e => e.id === newExpense.id ? newExpense : e));
          setEditingExpense(undefined);
      } else {
          setExpenses(prev => [newExpense, ...prev]);
      }
      setView('INVENTORY');
  };

  return (
    <div className="font-sans text-gray-900 bg-slate-50 min-h-screen">
      {view === 'DASHBOARD' && <DashboardView settings={settings} orders={orders} expenses={expenses} funds={funds} onChangeView={setView} isInstallable={isInstallable} onInstall={install} />}
      {view === 'PROCUREMENT' && <div className="p-5 text-center mt-20">عذراً، هذا القسم قيد التطوير</div>}
      {view === 'INVENTORY' && <InventoryView expenses={expenses} funds={funds} settings={settings} isInstallable={isInstallable} onInstall={install} />}
      {view === 'FINANCE' && <FinancialReportView expenses={expenses} funds={funds} onEditExpense={(e: Expense) => { setEditingExpense(e); setView('ADD_EXPENSE'); }} onDeleteExpense={(id: string) => setExpenses(prev => prev.filter(e => e.id !== id))} isInstallable={isInstallable} onInstall={install} />}
      {view === 'ADD_FUND' && <AddFundView onSave={(f: FundTransaction) => { setFunds([f, ...funds]); setView('DASHBOARD'); }} onCancel={() => setView('DASHBOARD')} />}
      {view === 'ADD_EXPENSE' && <AddExpenseView onSave={handleSaveExpense} onCancel={() => { setView('DASHBOARD'); setEditingExpense(undefined); }} initialData={editingExpense} existingExpenses={expenses} />}
      {view === 'SETTINGS' && <SettingsView settings={settings} onSave={(s: AppSettings) => { setSettings(s); setView('DASHBOARD'); }} onBack={() => setView('DASHBOARD')} />}
      {(view !== 'ADD_EXPENSE' && view !== 'ADD_FUND' && view !== 'SETTINGS') && <BottomNav active={view} onChange={setView} />}
    </div>
  );
}
