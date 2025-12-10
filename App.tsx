
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, ShoppingCart, FileText, Plus, Bell, Search, ArrowLeft, ChevronDown, 
  CheckCircle, Clock, Briefcase, TrendingUp, Camera, Truck, Utensils, Wrench, 
  Fuel, Menu, Sparkles, Inbox, Filter, Shield, Target, User, Wallet, 
  ArrowDownLeft, ArrowUpRight, Coins, FileSignature, X, Image as ImageIcon, 
  HandCoins, Printer, WifiOff, Edit3, Trash2, PieChart as PieChartIcon, 
  List, LayoutDashboard, FolderSearch, FileStack, ArrowDownCircle, CreditCard,
  Download, FileSpreadsheet, Settings, Upload, Save, RefreshCw, Smartphone
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { Status, ViewState, Order, Expense, FundTransaction, ExpenseType, Currency, InvoiceItem, VoucherSubCategory, AppSettings } from './types';

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
  { id: 'MED_POINT', label: 'النقطة الطبية', icon: Stethoscope, color: 'bg-pink-100 text-pink-700' },
  { id: 'OTHER', label: 'مستفيد آخر / شخص', icon: User, color: 'bg-slate-100 text-slate-700' }
];

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#64748b'];

const DEFAULT_SETTINGS: AppSettings = {
  ministryName: 'الجمهورية اليمنية - وزارة الدفاع',
  brigadeName: 'قيادة المنطقة / اللواء',
  unitName: 'الشؤون المالية / الصندوق',
  footerRightTitle: 'المستلم / المستفيد',
  footerCenterTitle: 'أمين الصندوق',
  footerLeftTitle: 'يعتمد / القائد',
  logo: undefined
};

function Stethoscope(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  )
}

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

const Header = ({ title, showBack = false, onBack, rightAction }: { title: string, showBack?: boolean, onBack?: () => void, rightAction?: React.ReactNode }) => (
  <header className="flex justify-between items-center px-5 py-4 bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] sticky top-0 z-30 pt-safe transition-all no-print border-b border-gray-100/50">
    <div className="flex items-center gap-3">
      {showBack && (
        <button onClick={onBack} className="p-2 -mr-2 hover:bg-gray-100/80 rounded-full active:scale-95 transition-all touch-manipulation">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h1>
    </div>
    <div className="flex gap-2">
       {rightAction}
       {!rightAction && !showBack && <button className="p-2.5 rounded-full hover:bg-gray-100/80 active:bg-gray-200 transition-colors touch-manipulation"><Search className="w-6 h-6 text-gray-600" /></button>}
       {!rightAction && !showBack && <button className="p-2.5 rounded-full hover:bg-gray-100/80 active:bg-gray-200 transition-colors touch-manipulation"><Bell className="w-6 h-6 text-gray-600" /></button>}
    </div>
  </header>
);

const EmptyState = ({ title, subtitle, icon: Icon }: { title: string, subtitle: string, icon: any }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-8 animate-fade-in">
    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
      <Icon className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{subtitle}</p>
  </div>
);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static">
            <div className="bg-white w-full max-w-3xl h-[85vh] md:h-auto rounded-3xl shadow-2xl flex flex-col overflow-hidden print:shadow-none print:h-auto print:w-full print:rounded-none">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 print:hidden">
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-6 h-6 text-gray-600" /></button>
                    <span className="font-bold text-gray-700">معاينة المستند</span>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                            <Printer className="w-4 h-4" />
                            طباعة
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                            <Download className="w-4 h-4" />
                            حفظ PDF
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
                                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">{transaction.amount.toLocaleString()} <span className="text-lg text-gray-500">{CURRENCIES[transaction.currency as Currency]?.symbol}</span></h1>
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
                                    <p className="font-bold text-xs text-gray-500 mb-8">{settings.footerCenterTitle}</p>
                                    <p className="font-bold text-sm text-gray-900">........................</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-500 mb-8">{settings.footerLeftTitle}</p>
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-100 pb-safe pt-2 shadow-[0_-5px_25px_rgba(0,0,0,0.04)] z-40 backdrop-blur-xl no-print">
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

interface DashboardProps {
  orders: Order[];
  expenses: Expense[];
  funds: FundTransaction[];
  onChangeView: (v: ViewState) => void;
  isInstallable: boolean;
  onInstall: () => void;
}

const DashboardView = ({ orders, expenses, funds, onChangeView, isInstallable, onInstall }: DashboardProps) => {
  const [activeCurrency, setActiveCurrency] = useState<Currency>('YER');
  const isOnline = useOnlineStatus();
  const pendingOrders = orders.filter(o => o.status === Status.PENDING);
  
  const totalReceivedYER = funds.filter(f => f.currency === 'YER').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpentYER = expenses.filter(e => e.currency === 'YER').reduce((acc, curr) => acc + curr.amount, 0);
  const balanceYER = totalReceivedYER - totalSpentYER;

  const totalReceivedSAR = funds.filter(f => f.currency === 'SAR').reduce((acc, curr) => acc + curr.amount, 0);
  const totalSpentSAR = expenses.filter(e => e.currency === 'SAR').reduce((acc, curr) => acc + curr.amount, 0);
  const balanceSAR = totalReceivedSAR - totalSpentSAR;

  const currentBalance = activeCurrency === 'YER' ? balanceYER : balanceSAR;
  const currentReceived = activeCurrency === 'YER' ? totalReceivedYER : totalReceivedSAR;
  const currentSpent = activeCurrency === 'YER' ? totalSpentYER : totalSpentSAR;
  const currencySymbol = CURRENCIES[activeCurrency].symbol;

  return (
    <div className="pb-36 animate-fade-in bg-slate-50 min-h-screen">
      <div className="bg-white px-5 pt-safe pb-8 rounded-b-[2.5rem] shadow-sm relative z-20">
        <div className="flex justify-between items-center mb-6 mt-2">
          <div className="flex items-center gap-3">
             <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 relative shadow-sm">
               <Shield className="w-6 h-6 text-emerald-700" />
               <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
             </div>
             <div className="flex flex-col">
               <span className="text-xs text-gray-500 font-bold">مرحباً بك،</span>
               <h2 className="text-lg font-bold text-gray-900 leading-none">أمين الصندوق</h2>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
                <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-500">غير متصل</span>
                </div>
            )}
            {isInstallable && (
                <button onClick={onInstall} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full active:bg-emerald-100 transition-colors touch-manipulation animate-pulse" title="تثبيت التطبيق">
                    <Download className="w-6 h-6" />
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

      <div className="px-6 mt-8">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex justify-between items-end">
            <span>طلبات الوحدات الأخيرة</span>
            <button className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg active:bg-emerald-100">عرض الكل</button>
        </h3>
        {pendingOrders.length > 0 ? (
          <div className="space-y-3">
             {/* Map tasks here */}
          </div>
        ) : (
          <div className="bg-white rounded-[1.5rem] p-8 text-center border border-gray-100 shadow-sm flex flex-col items-center">
             <div className="bg-gray-50 p-4 rounded-full mb-3">
                <Inbox className="w-6 h-6 text-gray-300" />
             </div>
             <p className="text-xs font-medium text-gray-400">لا توجد طلبات شراء جديدة من السرايا</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProcurementProps {
    orders: Order[];
}

const ProcurementView = ({ orders }: ProcurementProps) => {
  const [filter, setFilter] = useState<string>('all');
  
  const filteredOrders = orders.filter(order => {
     if (filter === 'all') return true;
     if (filter === 'pending') return order.status === Status.PENDING;
     if (filter === 'approved') return order.status === Status.APPROVED;
     return true;
  });

  const totalOrders = orders.length;

  return (
    <div className="pb-36 animate-fade-in bg-slate-50 min-h-screen">
        <Header title="طلبات الشراء" />
        
        <div className="px-5 mt-5">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                {[
                    { label: 'إجمالي الطلبات', value: totalOrders, icon: ShoppingCart, bg: 'bg-blue-50', text: 'text-blue-600' },
                    { label: 'قيد الاعتماد', value: 0, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
                    { label: 'تم الصرف', value: 0, icon: CheckCircle, bg: 'bg-green-50', text: 'text-green-600' },
                ].map((stat, idx) => (
                    <div key={idx} className="min-w-[110px] flex-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 snap-center">
                        <div className={`w-9 h-9 ${stat.bg} rounded-full flex items-center justify-center mb-1`}>
                            <stat.icon className={`w-5 h-5 ${stat.text}`} />
                        </div>
                        <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
                        <span className="text-[10px] text-gray-500 font-bold">{stat.label}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="px-5 mt-5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['الكل', 'قيد الانتظار', 'معتمد', 'مرفوض'].map((tab, i) => (
                    <button 
                        key={i}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all touch-manipulation active:scale-95 ${i === 0 ? 'bg-gray-800 text-white shadow-md shadow-gray-200' : 'bg-white border border-gray-200 text-gray-600 active:bg-gray-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        <div className="px-5 mt-5 space-y-3">
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                        {/* Order Item */}
                    </div>
                ))
            ) : (
                <EmptyState 
                    title="سجل الطلبات فارغ" 
                    subtitle="لا توجد طلبات شراء مسجلة من الوحدات أو الأقسام." 
                    icon={Inbox} 
                />
            )}
        </div>
    </div>
  );
};

interface InventoryProps {
    expenses: Expense[];
    funds: FundTransaction[];
    settings: AppSettings;
}

const InventoryView = ({ expenses, funds, settings }: InventoryProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'VOUCHER' | 'PURCHASE' | 'FUND'>('ALL');
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

    const allOperations = [
        ...funds.map(f => ({ 
            ...f, 
            categoryType: 'FUND' as const, 
            title: f.source, 
            displayAmount: f.amount,
            isPositive: true,
            docId: 'Deposit'
        })),
        ...expenses.map(e => ({ 
            ...e, 
            categoryType: e.type, 
            title: e.beneficiary, 
            displayAmount: e.amount,
            isPositive: false,
            docId: e.documentNumber
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredOps = allOperations.filter(op => {
        const matchesSearch = 
            op.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            op.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (op.docId && op.docId.toString().includes(searchTerm)) ||
            op.amount.toString().includes(searchTerm);
        
        const matchesType = filterType === 'ALL' || op.categoryType === filterType;
        
        return matchesSearch && matchesType;
    });

    const getIcon = (op: any) => {
        if (op.categoryType === 'FUND') return ArrowDownCircle;
        if (op.categoryType === 'VOUCHER') {
            return (op as Expense).voucherSubCategory === 'LOAN' ? CreditCard : HandCoins;
        }
        if (op.categoryType === 'PURCHASE') return ShoppingCart;
        return FileText;
    };

    const getColor = (op: any) => {
        if (op.categoryType === 'FUND') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (op.categoryType === 'VOUCHER') {
            return (op as Expense).voucherSubCategory === 'LOAN' 
                ? 'text-indigo-600 bg-indigo-50 border-indigo-100' 
                : 'text-amber-600 bg-amber-50 border-amber-100';
        }
        if (op.categoryType === 'PURCHASE') return 'text-blue-600 bg-blue-50 border-blue-100';
        return 'text-gray-600 bg-gray-50 border-gray-100';
    };

    return (
        <div className="pb-36 animate-fade-in bg-slate-50 min-h-screen">
             {selectedTransaction && (
                <TransactionDetailModal 
                    transaction={selectedTransaction} 
                    settings={settings}
                    onClose={() => setSelectedTransaction(null)} 
                />
             )}

             <div className="bg-white/80 backdrop-blur-xl px-5 py-4 sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex justify-between items-center pt-safe no-print border-b border-gray-100/50">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg shadow-gray-200">
                         <FolderSearch className="w-5 h-5" />
                     </div>
                     <h1 className="text-lg font-bold text-gray-900">سجل العمليات والأرشيف</h1>
                 </div>
                 <button className="w-10 h-10 flex items-center justify-center text-gray-600 rounded-full active:bg-gray-100 transition-colors">
                     <Menu className="w-6 h-6" />
                 </button>
             </div>

             <div className="px-5 mt-5 no-print">
                 <div className="relative shadow-sm rounded-xl">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="بحث برقم السند، المستفيد، المبلغ..." 
                        className="w-full bg-white border-none rounded-xl py-4 px-12 text-right text-base focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400 shadow-sm" 
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 px-5 mt-5 no-print">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center mb-1">
                          <FileStack className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">{allOperations.length}</h3>
                      <p className="text-[10px] text-gray-400 font-bold">إجمالي العمليات</p>
                 </div>
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center mb-1">
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800">
                          {expenses.filter(e => e.receiptImage).length}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold">مرفقات محفوظة</p>
                 </div>
             </div>

             <div className="px-5 mt-6 no-print">
                 <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'ALL', label: 'الكل' },
                        { id: 'FUND', label: 'إيداعات' },
                        { id: 'VOUCHER', label: 'سندات صرف' },
                        { id: 'PURCHASE', label: 'فواتير شراء' }
                    ].map((cat) => (
                        <button 
                            key={cat.id} 
                            onClick={() => setFilterType(cat.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors touch-manipulation active:scale-95 ${filterType === cat.id ? 'bg-gray-800 text-white shadow-md shadow-gray-200' : 'bg-white text-gray-600 border border-gray-200 active:bg-gray-50'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                 </div>
             </div>

             <div className="px-5 mt-4 space-y-3 pb-safe">
                 {filteredOps.length > 0 ? filteredOps.map((op: any) => {
                     const Icon = getIcon(op);
                     const style = getColor(op);
                     
                     return (
                        <div 
                            key={op.id} 
                            onClick={() => setSelectedTransaction(op)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
                        >
                             <div className="flex items-center gap-4">
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${style}`}>
                                     <Icon className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                             {op.categoryType === 'FUND' ? 'إيداع' : (op.documentNumber ? `#${op.documentNumber}` : '-')}
                                         </span>
                                         {(op as Expense).voucherSubCategory === 'LOAN' && (
                                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">سلفة</span>
                                         )}
                                         <span className="text-[10px] text-gray-400">{op.date}</span>
                                     </div>
                                     <h3 className="text-sm font-bold text-gray-800">{op.title}</h3>
                                     <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{op.notes || 'لا توجد ملاحظات'}</p>
                                 </div>
                             </div>
                             <div className="text-left flex flex-col items-end gap-1">
                                 <span className={`text-sm font-bold ${op.isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>
                                     {op.isPositive ? '+' : '-'}{op.amount.toLocaleString()}
                                 </span>
                                 <span className="text-[10px] font-bold text-gray-400">{CURRENCIES[op.currency as Currency].code}</span>
                                 {op.receiptImage && <Camera className="w-3 h-3 text-blue-400 mt-1" />}
                             </div>
                        </div>
                     );
                 }) : (
                     <EmptyState title="الأرشيف فارغ" subtitle="لا توجد عمليات مطابقة لبحثك في السجل." icon={FolderSearch} />
                 )}
             </div>
        </div>
    );
}

interface FinancialProps {
    expenses: Expense[];
    funds: FundTransaction[];
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (id: string) => void;
}

const FinancialReportView = ({ expenses, funds, onEditExpense, onDeleteExpense }: FinancialProps) => {
    const [reportTab, setReportTab] = useState<'SUMMARY' | 'LEDGER' | 'ANALYSIS'>('SUMMARY');
    const [currencyFilter, setCurrencyFilter] = useState<Currency>('YER');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const filterByDate = (dateStr: string) => dateStr >= dateRange.start && dateStr <= dateRange.end;
    const filterByCurrency = (c: Currency) => c === currencyFilter;

    const filteredExpenses = expenses.filter(e => filterByDate(e.date) && filterByCurrency(e.currency));
    const filteredFunds = funds.filter(f => filterByDate(f.date) && filterByCurrency(f.currency));

    const totalIncome = filteredFunds.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;

    const allTransactions = [
        ...filteredFunds.map(f => ({ ...f, type: 'FUND' as const, sortDate: new Date(f.date) })),
        ...filteredExpenses.map(e => ({ ...e, type: e.type, sortDate: new Date(e.date) }))
    ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    const categoryData = CATEGORIES.map(cat => ({
        name: cat.label,
        value: filteredExpenses.filter(e => e.category === cat.id).reduce((acc, curr) => acc + curr.amount, 0),
        color: cat.color.split(' ')[1].replace('text-', '') 
    })).filter(d => d.value > 0);

    const beneficiaryData = BENEFICIARIES.map(ben => ({
        name: ben.label,
        value: filteredExpenses.filter(e => e.beneficiary === ben.label || (ben.id === 'OTHER' && !BENEFICIARIES.find(b => b.label === e.beneficiary))).reduce((acc, curr) => acc + curr.amount, 0)
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const handlePrint = () => window.print();

    const exportToCSV = () => {
        const csvRows = [];
        // Header
        csvRows.push(['التاريخ', 'رقم السند', 'النوع', 'المستفيد/المصدر', 'المبلغ', 'العملة', 'ملاحظات'].join(','));
        
        // Rows
        allTransactions.forEach(tx => {
            const typeLabel = tx.type === 'FUND' ? 'إيداع' : (tx.type === 'PURCHASE' ? 'فاتورة شراء' : 'سند صرف');
            const beneficiary = (tx as any).beneficiary || (tx as any).source || '-';
            const docNum = (tx as any).documentNumber || '-';
            const notes = `"${(tx.notes || '').replace(/"/g, '""')}"`; // Escape quotes
            
            csvRows.push([
                tx.date,
                docNum,
                typeLabel,
                beneficiary,
                tx.amount,
                CURRENCIES[tx.currency as Currency].code,
                notes
            ].join(','));
        });

        const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `financial_report_${dateRange.start}_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderSummaryTab = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-emerald-500 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs font-bold mb-1">إجمالي المقبوضات (فترة التقرير)</span>
                    <h3 className="text-3xl font-bold text-gray-900">{totalIncome.toLocaleString()} <span className="text-sm text-gray-400">{CURRENCIES[currencyFilter].symbol}</span></h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-red-500 flex flex-col justify-center">
                    <span className="text-gray-500 text-xs font-bold mb-1">إجمالي المصروفات (فترة التقرير)</span>
                    <h3 className="text-3xl font-bold text-gray-900">{totalExpense.toLocaleString()} <span className="text-sm text-gray-400">{CURRENCIES[currencyFilter].symbol}</span></h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-blue-500 flex flex-col justify-center">
                     <span className="text-gray-500 text-xs font-bold mb-1">صافي الرصيد</span>
                     <h3 className={`text-3xl font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{balance.toLocaleString()} <span className="text-sm text-gray-400">{CURRENCIES[currencyFilter].symbol}</span></h3>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-64">
                <h4 className="text-sm font-bold text-gray-700 mb-4">التدفق المالي (يومي)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={allTransactions.slice(0, 10).reverse()}>
                        <defs>
                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                        <YAxis hide />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorAmt)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderLedgerTab = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in print:shadow-none print:border-none">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right min-w-[600px] sm:min-w-full">
                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 whitespace-nowrap">التاريخ</th>
                            <th className="px-4 py-3 whitespace-nowrap">رقم السند</th>
                            <th className="px-4 py-3">البيان / المستفيد</th>
                            <th className="px-4 py-3 whitespace-nowrap text-emerald-600">قبض (+)</th>
                            <th className="px-4 py-3 whitespace-nowrap text-red-600">صرف (-)</th>
                            <th className="px-4 py-3 text-center no-print">إجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {allTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-500">{tx.date}</td>
                                <td className="px-4 py-3 font-mono text-gray-400">{(tx as any).documentNumber || '-'}</td>
                                <td className="px-4 py-3">
                                    <div className="font-bold text-gray-800">{(tx as any).beneficiary || (tx as any).source}</div>
                                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{tx.notes}</div>
                                    {/* Display Multiple items if available */}
                                    {(tx as any).items && (tx as any).items.length > 0 && (
                                        <div className="text-[9px] text-gray-500 mt-1">
                                            {((tx as any).items as InvoiceItem[]).map((i, idx) => (
                                                <span key={idx} className="bg-gray-100 px-1 rounded ml-1">
                                                    {i.name} ({i.quantity})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {/* Display Loan Badge */}
                                    {(tx as any).voucherSubCategory === 'LOAN' && (
                                        <span className="inline-block mr-2 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">سلفة</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 font-bold text-emerald-600">
                                    {tx.type === 'FUND' ? tx.amount.toLocaleString() : '-'}
                                </td>
                                <td className="px-4 py-3 font-bold text-red-600">
                                    {tx.type !== 'FUND' ? tx.amount.toLocaleString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-center no-print">
                                    {tx.type !== 'FUND' && (
                                        <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => onEditExpense(tx as Expense)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 active:scale-90 transition-transform"><Edit3 className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteExpense(tx.id)} className="p-2 bg-red-50 hover:bg-red-100 rounded text-red-500 active:scale-90 transition-transform"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-left">الإجمالي</td>
                            <td className="px-4 py-3 text-emerald-700">{totalIncome.toLocaleString()}</td>
                            <td className="px-4 py-3 text-red-700">{totalExpense.toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
             {allTransactions.length === 0 && <EmptyState title="لا توجد بيانات" subtitle="لا توجد حركات مسجلة في هذا التاريخ." icon={FileText} />}
        </div>
    );

    const renderAnalysisTab = () => (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                 <h4 className="text-sm font-bold text-gray-700 w-full mb-4 flex items-center gap-2"><PieChartIcon className="w-4 h-4" /> توزيع المصروفات حسب التصنيف</h4>
                 {categoryData.length > 0 ? (
                    <div className="flex flex-col items-center w-full gap-8">
                        <div className="w-64 h-64 relative">
                             <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={categoryData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                 <span className="text-3xl font-bold text-gray-800">{totalExpense.toLocaleString()}</span>
                                 <span className="text-xs text-gray-400">{CURRENCIES[currencyFilter].code}</span>
                             </div>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-3">
                            {categoryData.map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center w-full bg-gray-50 p-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-gray-600 truncate">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-900">{Math.round((cat.value / totalExpense) * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                 ) : (
                     <EmptyState title="لا توجد بيانات" subtitle="لم يتم تسجيل مصروفات في هذه الفترة." icon={PieChartIcon} />
                 )}
             </div>

             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                 <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><List className="w-4 h-4" /> أكثر المستفيدين صرفاً</h4>
                 <div className="space-y-3">
                     {beneficiaryData.map((ben, idx) => (
                         <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50">
                             <div className="flex items-center gap-3">
                                 <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                 <span className="text-sm font-bold text-gray-700">{ben.name}</span>
                             </div>
                             <span className="text-sm font-bold text-gray-900">{ben.value.toLocaleString()} <span className="text-[10px] text-gray-400">{CURRENCIES[currencyFilter].symbol}</span></span>
                         </div>
                     ))}
                 </div>
             </div>
        </div>
    );

    return (
        <div className="pb-36 animate-fade-in bg-slate-50 min-h-screen">
             <Header 
                title="التقارير المالية" 
                showBack={true} 
                rightAction={
                    <div className="flex gap-2">
                        <button onClick={exportToCSV} className="p-2.5 rounded-full hover:bg-green-50 active:bg-green-100 transition-colors text-emerald-700" title="تصدير إكسل">
                            <FileSpreadsheet className="w-6 h-6" />
                        </button>
                        <button onClick={handlePrint} className="p-2.5 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700" title="طباعة">
                            <Printer className="w-6 h-6" />
                        </button>
                        <button onClick={handlePrint} className="p-2.5 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors text-blue-700" title="حفظ PDF">
                            <Download className="w-6 h-6" />
                        </button>
                    </div>
                }
             />

             <div className="hidden print:block text-center mb-8 pt-4 border-b-2 border-gray-800 pb-4">
                 <h2 className="text-xl font-bold">نظام إدارة صندوق اللواء</h2>
                 <h1 className="text-3xl font-bold mt-2 underline">تقرير مالي شامل</h1>
                 <div className="mt-4 flex justify-between px-8 text-sm">
                     <p>الفترة من: <b>{dateRange.start}</b> إلى: <b>{dateRange.end}</b></p>
                     <p>العملة: <b>{CURRENCIES[currencyFilter].label}</b></p>
                 </div>
             </div>

             <div className="px-5 mt-4 no-print space-y-4">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                     <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                        <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1"><Filter className="w-3 h-3" /> خيارات التقرير</h3>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                             <button onClick={() => setCurrencyFilter('YER')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${currencyFilter === 'YER' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}>YER</button>
                             <button onClick={() => setCurrencyFilter('SAR')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${currencyFilter === 'SAR' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500'}`}>SAR</button>
                        </div>
                     </div>
                     <div className="flex gap-3">
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-gray-400 mb-1 block">من تاريخ</label>
                             <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full bg-gray-50 rounded-lg text-xs font-bold py-2 px-2 border-none focus:ring-1 focus:ring-emerald-200 h-10" />
                         </div>
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-gray-400 mb-1 block">إلى تاريخ</label>
                             <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full bg-gray-50 rounded-lg text-xs font-bold py-2 px-2 border-none focus:ring-1 focus:ring-emerald-200 h-10" />
                         </div>
                     </div>
                 </div>

                 <div className="flex p-1 bg-gray-200/50 rounded-xl overflow-hidden">
                     {[
                         { id: 'SUMMARY', label: 'الملخص العام', icon: LayoutDashboard },
                         { id: 'LEDGER', label: 'كشف الحساب', icon: FileText },
                         { id: 'ANALYSIS', label: 'تحليل المصروفات', icon: PieChartIcon },
                     ].map((tab) => (
                         <button
                            key={tab.id}
                            onClick={() => setReportTab(tab.id as any)}
                            className={`flex-1 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${reportTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                         >
                             <tab.icon className="w-4 h-4" />
                             <span className="hidden sm:inline">{tab.label}</span>
                         </button>
                     ))}
                 </div>
             </div>

             <div className="px-5 mt-6 pb-12">
                 {reportTab === 'SUMMARY' && renderSummaryTab()}
                 {reportTab === 'LEDGER' && renderLedgerTab()}
                 {reportTab === 'ANALYSIS' && renderAnalysisTab()}
             </div>
        </div>
    );
};

interface SettingsProps {
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
    onBack: () => void;
    orders: Order[];
    expenses: Expense[];
    funds: FundTransaction[];
    onRestoreData: (data: any) => void;
    isInstallable: boolean;
    onInstall: () => void;
}

const SettingsView = ({ settings, onSave, onBack, orders, expenses, funds, onRestoreData, isInstallable, onInstall }: SettingsProps) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof AppSettings, value: string) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

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

    const handleExportData = () => {
        const data = {
            version: 1,
            timestamp: new Date().toISOString(),
            settings: localSettings,
            orders,
            expenses,
            funds
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_brigade_fund_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.expenses && data.funds) {
                    if (window.confirm('تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات الموجودة في ملف النسخة الاحتياطية. هل أنت متأكد من المتابعة؟')) {
                        onRestoreData(data);
                        alert('تم استعادة البيانات بنجاح!');
                    }
                } else {
                    alert('خطأ: ملف النسخة الاحتياطية غير صالح أو تالف.');
                }
            } catch (err) {
                console.error("Import Error", err);
                alert('حدث خطأ أثناء قراءة الملف. يرجى التأكد من اختيار ملف صحيح.');
            }
        };
        reader.readAsText(file);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-slate-50 min-h-screen animate-fade-in pb-10">
            <Header title="إعدادات النظام" showBack={true} onBack={onBack} />
            
            <div className="max-w-xl mx-auto px-5 py-6 space-y-6">
                
                {/* Logo Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative mb-4">
                        {localSettings.logo ? (
                            <img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Shield className="w-12 h-12 text-gray-300" />
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <button className="text-sm font-bold text-emerald-600 flex items-center gap-2 relative">
                        <Upload className="w-4 h-4" />
                        تغيير شعار اللواء
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2">سيظهر هذا الشعار في ترويسة جميع الفواتير والسندات</p>
                </div>

                {/* Organization Details */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">بيانات المؤسسة (الترويسة)</h3>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">اسم الوزارة / الجهة العليا</label>
                        <input 
                            type="text" 
                            value={localSettings.ministryName} 
                            onChange={(e) => handleChange('ministryName', e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">اسم الوحدة / اللواء</label>
                        <input 
                            type="text" 
                            value={localSettings.brigadeName} 
                            onChange={(e) => handleChange('brigadeName', e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">الفرع / القسم (مثل: الشؤون المالية)</label>
                        <input 
                            type="text" 
                            value={localSettings.unitName} 
                            onChange={(e) => handleChange('unitName', e.target.value)}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                        />
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">مسميات التوقيع (ذيل الصفحة)</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">التوقيع الأيمن (المستلم)</label>
                            <input 
                                type="text" 
                                value={localSettings.footerRightTitle} 
                                onChange={(e) => handleChange('footerRightTitle', e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">التوقيع الأوسط (أمين الصندوق)</label>
                            <input 
                                type="text" 
                                value={localSettings.footerCenterTitle} 
                                onChange={(e) => handleChange('footerCenterTitle', e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">التوقيع الأيسر (الاعتماد / القائد)</label>
                            <input 
                                type="text" 
                                value={localSettings.footerLeftTitle} 
                                onChange={(e) => handleChange('footerLeftTitle', e.target.value)}
                                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold border-none focus:ring-2 focus:ring-emerald-100" 
                            />
                        </div>
                    </div>
                </div>
                
                {/* Backup & Restore Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-emerald-600" />
                        إدارة البيانات والنسخ الاحتياطي
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={handleExportData}
                            className="bg-blue-50 text-blue-700 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                            <Save className="w-6 h-6" />
                            <span>تصدير نسخة احتياطية</span>
                        </button>
                        <div className="relative">
                            <button 
                                className="bg-gray-50 text-gray-700 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200 w-full h-full"
                            >
                                <Upload className="w-6 h-6" />
                                <span>استعادة نسخة</span>
                            </button>
                            <input 
                                type="file" 
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleImportData}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">قم بتحميل ملف النسخة الاحتياطية (JSON) لاستعادة بياناتك السابقة.</p>

                    {/* INSTALL BUTTON */}
                    {isInstallable && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                             <button 
                                onClick={onInstall}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                            >
                                <Smartphone className="w-6 h-6" />
                                <span>تثبيت التطبيق على الجهاز</span>
                            </button>
                             <p className="text-[10px] text-gray-400 text-center mt-2">تثبيت التطبيق للوصول السريع والعمل بدون إنترنت.</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => onSave(localSettings)}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-[0.98] transition-transform"
                >
                    حفظ الإعدادات
                </button>
            </div>
        </div>
    );
};

interface AddFundProps {
    onSave: (fund: FundTransaction) => void;
    onCancel: () => void;
}

const AddFundView = ({ onSave, onCancel }: AddFundProps) => {
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('قيادة المنطقة');
    const [currency, setCurrency] = useState<Currency>('YER');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!amount || !source) return;
        onSave({
            id: Date.now().toString(),
            amount: parseFloat(amount),
            source,
            date,
            notes,
            currency
        });
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-safe animate-fade-in">
             <div className="bg-emerald-600 text-white px-5 pt-safe pb-8 shadow-md rounded-b-[2rem]">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onCancel} className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-sm transition-colors active:scale-95">
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <h1 className="text-lg font-bold">استلام عهدة مالية</h1>
                    <div className="w-10"></div>
                </div>
                
                <div className="bg-emerald-700/50 p-1 rounded-lg flex justify-center max-w-xs mx-auto mb-8 backdrop-blur-md">
                     <button onClick={() => setCurrency('YER')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${currency === 'YER' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70'}`}>ريال يمني</button>
                     <button onClick={() => setCurrency('SAR')} className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${currency === 'SAR' ? 'bg-white text-emerald-700 shadow-sm' : 'text-white/70'}`}>ريال سعودي</button>
                </div>

                <div className="text-center mb-4">
                    <p className="text-emerald-100 text-xs font-bold mb-2">المبلغ المستلم</p>
                    <div className="flex items-center justify-center gap-2">
                         <input 
                            type="number" 
                            inputMode="decimal"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent text-6xl font-bold text-white placeholder-emerald-300/50 text-center w-full focus:outline-none"
                            autoFocus
                         />
                    </div>
                    <span className="text-sm font-medium opacity-80 mt-2 block">{CURRENCIES[currency].label}</span>
                </div>
            </div>

            <div className="px-5 -mt-6 pb-32">
                 <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 space-y-5 border border-gray-100">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">الجهة الموردة / المصدر</label>
                          <div className="relative">
                              <select 
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-gray-50 rounded-xl py-4 px-4 text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              >
                                  <option value="قيادة المنطقة">قيادة المنطقة</option>
                                  <option value="الشؤون الإدارية">الشؤون الإدارية والمالية</option>
                                  <option value="سلفة مؤقتة">سلفة مؤقتة</option>
                                  <option value="اخرى">اخرى</option>
                              </select>
                              <ChevronDown className="absolute left-4 top-4 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">تاريخ الاستلام</label>
                          <input 
                             type="date"
                             value={date}
                             onChange={(e) => setDate(e.target.value)}
                             className="w-full bg-gray-50 rounded-xl py-4 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-2">ملاحظات</label>
                          <textarea 
                             rows={3}
                             placeholder="أي تفاصيل إضافية..."
                             value={notes}
                             onChange={(e) => setNotes(e.target.value)}
                             className="w-full bg-gray-50 rounded-xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
                          />
                      </div>
                 </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-50">
                <button 
                    onClick={handleSave}
                    disabled={!amount}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none min-h-[56px]"
                >
                    إيداع في الصندوق
                </button>
            </div>
        </div>
    );
};

interface AddExpenseProps {
  onSave: (expense: Expense) => void;
  onCancel: () => void;
  initialData?: Expense;
  existingExpenses: Expense[];
}

const AddExpenseView = ({ onSave, onCancel, initialData, existingExpenses }: AddExpenseProps) => {
  const [type, setType] = useState<ExpenseType>(initialData?.type || 'VOUCHER');
  const [currency, setCurrency] = useState<Currency>(initialData?.currency || 'YER');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  
  // Voucher SubCategory (Expense vs Loan)
  const [voucherSubCategory, setVoucherSubCategory] = useState<VoucherSubCategory>(initialData?.voucherSubCategory || 'EXPENSE');

  // New Multiple Items State
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || 'OPERATIONAL');
  const [beneficiary, setBeneficiary] = useState(initialData?.beneficiary || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [documentNumber, setDocumentNumber] = useState(initialData?.documentNumber || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(initialData?.receiptImage || null);
  
  const [showBeneficiaryList, setShowBeneficiaryList] = useState(false);

  // Initialize Items: Check if legacy or new format
  useEffect(() => {
      if (initialData?.items && initialData.items.length > 0) {
          setInvoiceItems(initialData.items);
      } else if (initialData?.itemName) {
          // Legacy conversion: Create a single item from old fields
          setInvoiceItems([{
              id: 'legacy-1',
              name: initialData.itemName,
              quantity: initialData.quantity || 1,
              unitPrice: initialData.unitPrice || (initialData.amount || 0)
          }]);
      } else if (!initialData && type === 'PURCHASE' && invoiceItems.length === 0) {
          // Start with one empty row for new Purchase
          setInvoiceItems([{ id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 }]);
      }
  }, [initialData, type]);

  useEffect(() => {
    if (!initialData) {
      const relevantExpenses = existingExpenses.filter(e => e.type === type);
      let maxNum = 0;
      relevantExpenses.forEach(e => {
        const num = parseInt(e.documentNumber || '0', 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      setDocumentNumber(String(maxNum + 1).padStart(4, '0'));
    }
  }, [type, existingExpenses, initialData]);

  // Auto-Calculate Total Amount from Items
  useEffect(() => {
      if (type === 'PURCHASE') {
          const total = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
          setAmount(total.toString());
      }
  }, [invoiceItems, type]);

  const handleAddItem = () => {
      setInvoiceItems([...invoiceItems, { id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
      if (invoiceItems.length > 1) {
          setInvoiceItems(invoiceItems.filter(i => i.id !== id));
      }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
      setInvoiceItems(invoiceItems.map(item => 
          item.id === id ? { ...item, [field]: value } : item
      ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setReceiptImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
    if (!amount || (!beneficiary && type === 'VOUCHER')) return;

    // Determine legacy fields for backward compatibility (use first item)
    const primaryItem = invoiceItems[0] || {};

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
      // Save full items list
      items: type === 'PURCHASE' ? invoiceItems : undefined,
      // Legacy fields
      itemName: type === 'PURCHASE' ? primaryItem.name : undefined,
      quantity: type === 'PURCHASE' ? primaryItem.quantity : undefined,
      unitPrice: type === 'PURCHASE' ? primaryItem.unitPrice : undefined,
      
      receiptImage: receiptImage || undefined,
      voucherSubCategory: type === 'VOUCHER' ? voucherSubCategory : undefined
    };

    onSave(expenseData);
  };

  return (
    <div className="bg-white min-h-screen pb-safe animate-fade-in relative z-50">
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
        
        {/* Toggle Type & Currency */}
        <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-100 p-1 rounded-xl flex relative">
                <button 
                    onClick={() => setType('VOUCHER')} 
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all z-10 ${type === 'VOUCHER' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}
                >
                    سند صرف
                </button>
                <button 
                    onClick={() => setType('PURCHASE')} 
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all z-10 ${type === 'PURCHASE' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                    فاتورة شراء
                </button>
            </div>
            <div className="w-1/3 bg-gray-100 p-1 rounded-xl flex">
                <button 
                    onClick={() => setCurrency(currency === 'YER' ? 'SAR' : 'YER')} 
                    className="w-full h-full bg-white rounded-lg shadow-sm text-xs font-bold flex flex-col items-center justify-center text-gray-700 active:scale-95 transition-transform"
                >
                    <span className="text-[9px] text-gray-400">العملة</span>
                    {CURRENCIES[currency].code}
                </button>
            </div>
        </div>

        {/* --- VOUCHER UI --- */}
        {type === 'VOUCHER' && (
            <div className={`bg-orange-50 border-2 border-dashed rounded-xl p-5 relative overflow-hidden transition-colors ${voucherSubCategory === 'LOAN' ? 'border-indigo-200 bg-indigo-50/50' : 'border-orange-200'}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                     <FileSignature className={`w-48 h-48 ${voucherSubCategory === 'LOAN' ? 'text-indigo-900' : 'text-orange-900'}`} />
                </div>
                
                <div className="relative z-10 space-y-6">
                    {/* Sub Category Toggle (Expense vs Loan) */}
                    <div className="flex bg-white/50 p-1 rounded-lg border border-gray-100">
                        <button 
                            onClick={() => setVoucherSubCategory('EXPENSE')} 
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${voucherSubCategory === 'EXPENSE' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-400'}`}
                        >
                            عهدة / مصروفات
                        </button>
                        <button 
                            onClick={() => setVoucherSubCategory('LOAN')} 
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${voucherSubCategory === 'LOAN' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-400'}`}
                        >
                            سلفة / عهدة مؤقتة
                        </button>
                    </div>

                    <div className="flex justify-between items-center border-b border-orange-200/50 pb-2">
                         <div>
                             <label className="text-[10px] font-bold text-gray-500 block mb-0.5">رقم السند</label>
                             <div className="text-xl font-mono font-bold text-gray-800">#{documentNumber}</div>
                         </div>
                         <div className="text-left">
                             <label className="text-[10px] font-bold text-gray-500 block mb-0.5">التاريخ</label>
                             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent font-bold text-gray-800 text-sm focus:outline-none text-left" />
                         </div>
                    </div>

                    <div>
                        <label className={`text-xs font-bold block mb-2 ${voucherSubCategory === 'LOAN' ? 'text-indigo-700' : 'text-orange-700'}`}>
                            {voucherSubCategory === 'LOAN' ? 'اسم المستلف (على ذمة)' : 'اصرفوا لأمر / المستفيد'}
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={beneficiary}
                                onChange={(e) => setBeneficiary(e.target.value)}
                                placeholder={voucherSubCategory === 'LOAN' ? "اكتب اسم الشخص المستلف..." : "اكتب اسم المستفيد..."}
                                className={`w-full bg-white border rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 ${voucherSubCategory === 'LOAN' ? 'border-indigo-200 focus:ring-indigo-300' : 'border-orange-200 focus:ring-orange-300'}`}
                            />
                            <button 
                                onClick={() => setShowBeneficiaryList(!showBeneficiaryList)}
                                className={`absolute left-2 top-2 p-1.5 rounded-md ${voucherSubCategory === 'LOAN' ? 'text-indigo-400 hover:bg-indigo-100' : 'text-orange-400 hover:bg-orange-100'}`}
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            {showBeneficiaryList && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden">
                                    {BENEFICIARIES.filter(b => b.id !== 'OTHER').map((b) => (
                                        <button 
                                            key={b.id}
                                            onClick={() => { setBeneficiary(b.label); setShowBeneficiaryList(false); }}
                                            className="w-full text-right px-4 py-3 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <b.icon className="w-4 h-4 text-gray-400" />
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center py-2">
                        <label className={`text-xs font-bold block mb-2 ${voucherSubCategory === 'LOAN' ? 'text-indigo-700' : 'text-orange-700'}`}>مبلغ وقدره</label>
                        <div className="flex items-center justify-center gap-2">
                            <input 
                                type="number" 
                                inputMode="decimal"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="00"
                                className={`text-5xl font-bold text-center bg-transparent w-full focus:outline-none ${voucherSubCategory === 'LOAN' ? 'text-indigo-900 placeholder-indigo-200' : 'text-orange-900 placeholder-orange-200'}`}
                            />
                        </div>
                        <span className={`text-sm font-bold mt-1 block ${voucherSubCategory === 'LOAN' ? 'text-indigo-600' : 'text-orange-600'}`}>{CURRENCIES[currency].label}</span>
                    </div>

                    <div>
                         <label className="text-xs font-bold text-gray-500 block mb-2">وذلك مقابل / البيان</label>
                         <textarea 
                             value={notes} 
                             onChange={(e) => setNotes(e.target.value)} 
                             rows={2}
                             className={`w-full bg-white border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none ${voucherSubCategory === 'LOAN' ? 'border-indigo-200 focus:ring-indigo-300' : 'border-orange-200 focus:ring-orange-300'}`}
                             placeholder={voucherSubCategory === 'LOAN' ? "سبب السلفة / العهدة..." : "شرح سبب الصرف..."}
                         />
                    </div>
                </div>
            </div>
        )}

        {/* --- PURCHASE UI --- */}
        {type === 'PURCHASE' && (
            <div className="space-y-5">
                 <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex justify-between items-center">
                     <div>
                         <label className="text-[10px] text-gray-400 font-bold block">رقم الفاتورة</label>
                         <span className="font-mono font-bold text-gray-800">#{documentNumber}</span>
                     </div>
                     <div className="h-8 w-px bg-gray-200 mx-4"></div>
                     <div className="flex-1">
                          <label className="text-[10px] text-gray-400 font-bold block mb-1">تاريخ الشراء</label>
                          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 rounded px-2 py-1 text-xs font-bold focus:outline-none" />
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600">المورد / المتجر</label>
                     <input 
                        type="text" 
                        value={beneficiary} 
                        onChange={e => setBeneficiary(e.target.value)} 
                        placeholder="اسم المحل أو التاجر" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-100" 
                     />
                 </div>

                 <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                     <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
                         <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> قائمة الأصناف</h4>
                         <span className="text-[10px] bg-white px-2 py-0.5 rounded text-gray-400 border border-gray-200">{invoiceItems.length} صنف</span>
                     </div>
                     
                     <div className="divide-y divide-gray-100">
                         {invoiceItems.map((item, index) => (
                             <div key={item.id} className="p-3 hover:bg-white transition-colors">
                                 <div className="flex gap-2 mb-2">
                                     <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-[10px] font-bold text-gray-500">{index + 1}</span>
                                     <input 
                                         type="text" 
                                         value={item.name}
                                         onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                         placeholder="اسم الصنف / المادة" 
                                         className="flex-1 bg-transparent border-b border-dashed border-gray-300 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500" 
                                     />
                                 </div>
                                 <div className="flex items-center gap-3 pr-8">
                                     <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-200 px-2 py-1">
                                        <span className="text-[10px] text-gray-400 ml-2">الكمية</span>
                                        <input 
                                            type="number"
                                            inputMode="decimal"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-center focus:outline-none"
                                        />
                                     </div>
                                     <span className="text-gray-400">×</span>
                                     <div className="flex-1 flex items-center bg-white rounded-lg border border-gray-200 px-2 py-1">
                                        <span className="text-[10px] text-gray-400 ml-2">السعر</span>
                                        <input 
                                            type="number"
                                            inputMode="decimal"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-transparent text-sm font-bold text-center focus:outline-none"
                                        />
                                     </div>
                                     <button 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        disabled={invoiceItems.length === 1}
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     
                     <button 
                        onClick={handleAddItem}
                        className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-t border-gray-100"
                     >
                         <Plus className="w-4 h-4" /> إضافة صنف جديد
                     </button>
                     
                     <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-500">الإجمالي الكلي</span>
                         <span className="text-xl font-bold text-blue-700">{amount || '0'} <span className="text-xs text-gray-400">{CURRENCIES[currency].symbol}</span></span>
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600">تصنيف المشتريات</label>
                     <div className="grid grid-cols-4 gap-2">
                         {CATEGORIES.map(cat => (
                             <button 
                                key={cat.id} 
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${selectedCategory === cat.id ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-500'}`}
                             >
                                 <cat.icon className="w-5 h-5" />
                                 <span className="text-[9px] font-bold">{cat.label.split(' ')[0]}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-600">صورة الفاتورة (اختياري)</label>
                     <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
                         <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 w-full h-full" />
                         {receiptImage ? (
                             <div className="relative w-full h-32 rounded-lg overflow-hidden">
                                 <img src={receiptImage} alt="Receipt" className="w-full h-full object-cover" />
                                 <button onClick={(e) => { e.preventDefault(); setReceiptImage(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X className="w-4 h-4" /></button>
                             </div>
                         ) : (
                             <>
                                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-400">اضغط لالتقاط صورة أو رفع ملف</span>
                             </>
                         )}
                     </div>
                 </div>
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 pb-safe z-40">
        <button 
            onClick={handleSave} 
            disabled={!amount}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none min-h-[56px] text-white ${type === 'VOUCHER' ? 'bg-orange-600 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
        >
            {initialData ? 'حفظ التعديلات' : (type === 'VOUCHER' ? (voucherSubCategory === 'LOAN' ? 'اعتماد السلفة' : 'اعتماد سند الصرف') : 'حفظ الفاتورة')}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [orders, setOrders] = usePersistedState<Order[]>('orders', []);
  const [expenses, setExpenses] = usePersistedState<Expense[]>('expenses', []);
  const [funds, setFunds] = usePersistedState<FundTransaction[]>('funds', []);
  const [settings, setSettings] = usePersistedState<AppSettings>('app_settings', DEFAULT_SETTINGS);
  
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const { isInstallable, install } = usePWAInstall();

  const handleSaveFund = (newFund: FundTransaction) => {
      setFunds(prev => [newFund, ...prev]);
      setView('DASHBOARD');
  };

  const handleSaveExpense = (newExpense: Expense) => {
      if (editingExpense) {
          setExpenses(prev => prev.map(e => e.id === newExpense.id ? newExpense : e));
          setEditingExpense(undefined);
      } else {
          setExpenses(prev => [newExpense, ...prev]);
      }
      setView('INVENTORY');
  };

  const handleEditExpense = (expense: Expense) => {
      setEditingExpense(expense);
      setView('ADD_EXPENSE');
  };

  const handleDeleteExpense = (id: string) => {
      if (window.confirm('هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.')) {
          setExpenses(prev => prev.filter(e => e.id !== id));
      }
  };

  const handleViewChange = (newView: ViewState) => {
      if (newView === 'ADD_EXPENSE') {
          setEditingExpense(undefined);
      }
      setView(newView);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
      setSettings(newSettings);
      setView('DASHBOARD');
  };

  const handleRestoreData = (data: any) => {
      if (data.settings) setSettings(data.settings);
      if (data.orders) setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      if (data.funds) setFunds(data.funds);
      setView('DASHBOARD');
  };

  return (
    <div className="font-sans text-gray-900 bg-slate-50 min-h-screen">
      {view === 'DASHBOARD' && (
        <DashboardView 
            orders={orders} 
            expenses={expenses} 
            funds={funds}
            onChangeView={handleViewChange} 
            isInstallable={isInstallable}
            onInstall={install}
        />
      )}
      
      {view === 'PROCUREMENT' && (
        <ProcurementView orders={orders} />
      )}
      
      {view === 'INVENTORY' && (
        <InventoryView expenses={expenses} funds={funds} settings={settings} />
      )}

      {view === 'FINANCE' && (
        <FinancialReportView 
            expenses={expenses} 
            funds={funds} 
            onEditExpense={handleEditExpense} 
            onDeleteExpense={handleDeleteExpense} 
        />
      )}

      {view === 'ADD_FUND' && (
          <AddFundView 
            onSave={handleSaveFund} 
            onCancel={() => setView('DASHBOARD')} 
          />
      )}

      {view === 'ADD_EXPENSE' && (
          <AddExpenseView 
            onSave={handleSaveExpense} 
            onCancel={() => { setView('DASHBOARD'); setEditingExpense(undefined); }}
            initialData={editingExpense}
            existingExpenses={expenses}
          />
      )}

      {view === 'SETTINGS' && (
          <SettingsView 
            settings={settings}
            onSave={handleSaveSettings}
            onBack={() => setView('DASHBOARD')}
            orders={orders}
            expenses={expenses}
            funds={funds}
            onRestoreData={handleRestoreData}
            isInstallable={isInstallable}
            onInstall={install}
          />
      )}

      {(view !== 'ADD_EXPENSE' && view !== 'ADD_FUND' && view !== 'SETTINGS') && (
        <BottomNav active={view} onChange={handleViewChange} />
      )}
    </div>
  );
}
