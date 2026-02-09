import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { MenuItem, Order, OrderItem, Table } from './types';
import { INITIAL_INVENTORY, INITIAL_TABLES } from './constants';
import { ShoppingCart, ChefHat, User, Menu as MenuIcon, Bell, Search, Plus, Minus, ArrowRight, Clock, Trash2, CheckCircle, AlertCircle, RefreshCw, X, LogOut, CreditCard, Banknote, FileText, ChevronLeft, MapPin, Smile, Utensils, History, Receipt, Gift, Trophy, MessageSquare, Users, HelpCircle, Phone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type CartItem = MenuItem & { isReward?: boolean; quantity: number };

// --- Context ---

interface MesaContextType {
  inventory: MenuItem[];
  orders: Order[];
  tables: Table[];
  activeTableId: number | null;
  setActiveTableId: (id: number) => void;
  updateTableGuests: (tableId: number, guests: number) => void;
  cart: CartItem[];
  cartNote: string;
  setCartNote: (note: string) => void;
  hasPlayedGame: boolean;
  addToCart: (item: MenuItem, quantity?: number, isReward?: boolean) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  placeOrder: (paymentMethod: 'card'|'cash', billingType: 'final'|'invoice', billingData?: string) => void;
  cancelOrder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  toggleStock: (itemId: string) => void;
  requestBill: (tableId: number) => void;
  markTableClean: (tableId: number) => void;
  setHasPlayedGame: (played: boolean) => void;
  showToast: (msg: string) => void;
}

const MesaContext = createContext<MesaContextType | undefined>(undefined);

const useMesa = () => {
  const context = useContext(MesaContext);
  if (!context) throw new Error('useMesa must be used within a MesaProvider');
  return context;
};

// --- Components ---

// 1. ROLE SELECTOR (Landing)
const RoleSelector = ({ onSelect }: { onSelect: (role: string) => void }) => (
  <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
    <div className="mb-12 text-center">
      <div className="bg-primary size-20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
        <Bell className="size-10 text-white" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Mesa</h1>
      <p className="text-gray-400">Sistema Operativo para Restaurantes</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      <button onClick={() => onSelect('customer')} className="group relative overflow-hidden bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all text-left">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <User size={120} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Cliente</h3>
        <p className="text-gray-400 text-sm">Vista Móvil. Pedir, rastrear, jugar ruleta.</p>
      </button>

      <button onClick={() => onSelect('kitchen')} className="group relative overflow-hidden bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all text-left">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <ChefHat size={120} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Cocina (KDS)</h3>
        <p className="text-gray-400 text-sm">Vista Tablet. Comandas e inventario.</p>
      </button>

      <button onClick={() => onSelect('waiter')} className="group relative overflow-hidden bg-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-primary transition-all text-left">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <MenuIcon size={120} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Mesero</h3>
        <p className="text-gray-400 text-sm">Mapa de mesas, alertas y cuentas.</p>
      </button>
    </div>
  </div>
);

// Helper Icon
const ShieldStar = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);

// 2. CUSTOMER VIEW
const CustomerView = ({ onLogout }: { onLogout: () => void }) => {
  const { inventory, addToCart, cart, updateCartQuantity, removeFromCart, placeOrder, cancelOrder, orders, activeTableId, setActiveTableId, updateTableGuests, tables, hasPlayedGame, setHasPlayedGame, cartNote, setCartNote, showToast } = useMesa();
  
  // Navigation State
  const [view, setView] = useState<'tables' | 'guests' | 'menu' | 'product' | 'cart' | 'status' | 'profile' | 'search' | 'checkout' | 'history' | 'order-detail' | 'help-support' | 'payment-info'>('tables');
  
  // Filters & Search & Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('burgers');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState<MenuItem | null>(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);

  // Guest Selection State
  const [guestCount, setGuestCount] = useState(2);

  // Product Page State
  const [pdpQuantity, setPdpQuantity] = useState(1);

  // Checkout Form State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [billingType, setBillingType] = useState<'final' | 'invoice'>('final');
  const [billingData, setBillingData] = useState('');
  
  // Game Logic (Fruit Ninja Style)
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameStatus, setGameStatus] = useState<'intro' | 'playing' | 'won' | 'lost'>('intro');
  const [gameTimeLeft, setGameTimeLeft] = useState(10);
  const [fruits, setFruits] = useState<{id: number, x: number, y: number, emoji: string, splatted: boolean}[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Active order is one that is NOT paid and NOT delivered (unless just delivered and not viewed yet)
  const activeOrder = activeTableId 
    ? orders
        .filter(o => o.tableId === activeTableId && !['paid', 'delivered'].includes(o.status))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    : null;
    
  const customerHistory = activeTableId ? orders.filter(o => o.tableId === activeTableId) : [];

  // Effects
  useEffect(() => {
    // If table selected but active order exists and view is initial, go to status (skipping guest selection if returning)
    if (activeOrder && view === 'tables') {
        setView('status');
    }
  }, [activeOrder, view]);

  useEffect(() => {
      // Reset quantity when opening PDP
      setPdpQuantity(1);
  }, [activeProduct]);

  // Clean up timer
  useEffect(() => {
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleTableSelect = (id: number) => {
    setActiveTableId(id);
    setView('guests'); // Go to guest selection instead of menu
  };

  const confirmGuests = () => {
    if (activeTableId) {
        updateTableGuests(activeTableId, guestCount);
        setView('menu');
    }
  };

  const handleProductClick = (item: MenuItem) => {
      setActiveProduct(item);
      setView('product');
  };

  const handleDirectAdd = (e: React.MouseEvent, item: MenuItem) => {
      e.stopPropagation();
      addToCart(item, 1);
  };

  const handlePlaceOrder = () => {
      placeOrder(paymentMethod, billingType, billingData);
      setView('status');
  };

  // --- GAME LOGIC (Fruit Smasher) ---
  const startGame = () => {
      setShowGameModal(true);
      setGameStatus('intro');
  };

  const runGame = () => {
      setGameStatus('playing');
      setGameTimeLeft(10);
      
      // Spawn 5 random fruits
      const emojis = ['🍉', '🍊', '🍋', '🍌', '🍍', '🍎', '🍓'];
      const newFruits = Array.from({ length: 5 }).map((_, i) => ({
          id: i,
          x: Math.random() * 80 + 10, // 10% to 90%
          y: Math.random() * 80 + 10,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          splatted: false
      }));
      setFruits(newFruits);

      // Start Timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
          setGameTimeLeft(prev => {
              if (prev <= 1) {
                  if (timerRef.current) clearInterval(timerRef.current);
                  setGameStatus('lost');
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const smashFruit = (id: number) => {
      if (gameStatus !== 'playing') return;

      const updatedFruits = fruits.map(f => f.id === id ? { ...f, splatted: true } : f);
      setFruits(updatedFruits);

      // Check Win Condition
      if (updatedFruits.every(f => f.splatted)) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameStatus('won');
          setHasPlayedGame(true);
          
           // Add reward
           const dessert = inventory.find(i => i.category === 'desserts');
           if (dessert) {
              setTimeout(() => {
                  addToCart(dessert, 1, true); // true = isReward
                  setShowGameModal(false);
              }, 2000);
           }
      }
  };

  const categories = [
      { id: 'burgers', label: 'Hamburguesas' },
      { id: 'drinks', label: 'Bebidas' },
      { id: 'sides', label: 'Acompañantes' },
      { id: 'desserts', label: 'Postres' }
  ];

  const getStatusColor = (status: Order['status']) => {
      switch(status) {
          case 'received': return 'bg-blue-500';
          case 'preparing': return 'bg-yellow-500';
          case 'ready': return 'bg-orange-500';
          case 'delivered': return 'bg-green-500';
          case 'paid': return 'bg-slate-500';
          default: return 'bg-slate-300';
      }
  };

  const getStatusText = (status: Order['status']) => {
      switch(status) {
          case 'received': return 'Recibido';
          case 'preparing': return 'Cocinando';
          case 'ready': return 'Listo';
          case 'delivered': return 'Entregado';
          case 'paid': return 'Pagado';
          default: return 'Pendiente';
      }
  };
  
  const orderCheck = (current: Order['status'], target: Order['status']) => {
      const steps = ['received', 'preparing', 'ready', 'delivered', 'paid'];
      return steps.indexOf(current) >= steps.indexOf(target);
  };

  // --- SUB-SCREENS ---

  if (view === 'tables') {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="mb-8 text-center">
                      <div className="bg-primary size-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                         <MapPin className="text-white" size={32} />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-800">Bienvenido a Mesa</h1>
                      <p className="text-slate-500">Por favor, selecciona tu ubicación</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      {tables.filter(t => t.status === 'free').map(table => (
                          <button 
                            key={table.id}
                            onClick={() => handleTableSelect(table.id)}
                            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-primary hover:shadow-md transition-all flex flex-col items-center"
                          >
                              <span className="text-3xl font-bold text-slate-800 mb-1">{table.id}</span>
                              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mesa Libre</span>
                          </button>
                      ))}
                  </div>
                  {tables.filter(t => t.status === 'free').length === 0 && (
                      <p className="text-red-500 font-bold mt-4">Lo sentimos, no hay mesas disponibles.</p>
                  )}
              </div>
          </div>
      );
  }

  // VIEW: GUEST SELECTION
  if (view === 'guests') {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
                  <div className="bg-white rounded-3xl p-8 shadow-xl w-full text-center">
                      <div className="bg-slate-100 size-16 rounded-full mx-auto flex items-center justify-center mb-6">
                          <Users size={32} className="text-slate-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Número de Comensales</h2>
                      <p className="text-slate-500 mb-8">¿Cuántas personas ocuparán la mesa?</p>
                      
                      <div className="flex items-center justify-center gap-6 mb-8">
                          <button 
                              onClick={() => setGuestCount(c => Math.max(1, c - 1))}
                              className="size-14 rounded-2xl border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary transition-colors active:scale-95"
                          >
                              <Minus size={24} />
                          </button>
                          <span className="text-5xl font-bold text-slate-800 w-16 text-center">{guestCount}</span>
                          <button 
                              onClick={() => setGuestCount(c => Math.min(10, c + 1))}
                              className="size-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors active:scale-95"
                          >
                              <Plus size={24} />
                          </button>
                      </div>

                      <button 
                          onClick={confirmGuests}
                          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                          Continuar al Menú <ArrowRight size={20} />
                      </button>
                  </div>
                  <button onClick={() => setView('tables')} className="mt-6 text-slate-400 font-medium hover:text-slate-600">
                      Cancelar y Volver
                  </button>
              </div>
          </div>
      );
  }

  // VIEW: HELP & SUPPORT
  if (view === 'help-support') {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
              <button onClick={() => setView('profile')} className="mb-6 text-slate-500 flex items-center gap-2 text-sm font-bold"><ChevronLeft size={16} /> Volver</button>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Ayuda & Soporte</h2>
              
              <div className="space-y-4">
                  <button 
                    onClick={() => { showToast('Mesero notificado'); setView('profile'); }}
                    className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-primary transition-colors group"
                  >
                      <div className="bg-blue-100 text-blue-600 p-4 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User size={32} />
                      </div>
                      <div className="text-left">
                          <h3 className="text-lg font-bold text-slate-800">Llamar al Mesero</h3>
                          <p className="text-sm text-slate-500">¿Necesitas algo más?</p>
                      </div>
                  </button>

                  <button 
                     onClick={() => { showToast('Supervisor notificado'); setView('profile'); }}
                     className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-primary transition-colors group"
                  >
                      <div className="bg-purple-100 text-purple-600 p-4 rounded-full group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <ShieldStar size={32} />
                      </div>
                      <div className="text-left">
                          <h3 className="text-lg font-bold text-slate-800">Hablar con Supervisor</h3>
                          <p className="text-sm text-slate-500">Para consultas especiales.</p>
                      </div>
                  </button>
              </div>
          </div>
      )
  }

  // VIEW: PAYMENT INFO
  if (view === 'payment-info') {
      return (
          <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
              <button onClick={() => setView('profile')} className="mb-6 text-slate-500 flex items-center gap-2 text-sm font-bold"><ChevronLeft size={16} /> Volver</button>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Métodos de Pago</h2>
              
              <div className="bg-white p-8 rounded-3xl shadow-sm text-center">
                  <div className="bg-green-100 size-24 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                      <CreditCard size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Pago en Caja</h3>
                  <p className="text-slate-500 leading-relaxed">
                      Independientemente del método de pago que elijas (Efectivo, Tarjeta o Transferencia), 
                      por favor acércate a la caja principal al finalizar tu comida para procesar el pago.
                  </p>
                  <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
                      <p>Aceptamos todas las tarjetas Visa, Mastercard y American Express.</p>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b px-5 py-4 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2">
            {view !== 'menu' && view !== 'status' ? (
                <button onClick={() => setView('menu')} className="p-1 -ml-2 rounded-full hover:bg-slate-100 text-slate-600">
                    <ChevronLeft />
                </button>
            ) : activeOrder ? (
                <button 
                    onClick={() => setView('status')}
                    className="flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full"
                >
                    <div className="bg-orange-500 size-2 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold uppercase tracking-wide">Pedido en curso</span>
                </button>
            ) : (
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/20">
                    <Utensils size={18} />
                </div>
            )}
            
            {view === 'menu' && !activeOrder && (
                <div>
                    <h1 className="font-bold leading-none text-slate-800">Mesa</h1>
                    <p className="text-xs text-primary font-medium mt-0.5">Mesa {activeTableId}</p>
                </div>
            )}
        </div>
        <div className="flex items-center gap-3">
            {view === 'checkout' && (
                <button onClick={() => setView('help-support')} className="text-primary font-bold text-sm flex items-center gap-1">
                    <HelpCircle size={16} /> Ayuda
                </button>
            )}
            
          {view === 'menu' && (
            <button onClick={() => setView('search')} className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-full">
              <Search size={20} />
            </button>
          )}
          {view !== 'checkout' && view !== 'status' && (
            <button onClick={() => setView('cart')} className="relative p-2 text-slate-600 hover:text-primary transition-colors bg-slate-50 rounded-full">
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold size-4 flex items-center justify-center rounded-full">
                        {cart.reduce((a,b) => a + b.quantity, 0)}
                    </span>
                )}
            </button>
          )}
           <button onClick={() => setView('profile')} className="size-9 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
             <img src="https://i.pravatar.cc/150?u=mesa_customer" alt="User" className="w-full h-full object-cover" />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        
        {/* VIEW: MENU */}
        {view === 'menu' && (
          <>
            {/* Categories Sticky Bar */}
            <div className="sticky top-0 bg-white z-20 pb-4 pt-2 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.05)]">
                 <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar">
                    {categories.map((cat, i) => (
                        <button 
                            key={cat.id} 
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                        {cat.label}
                        </button>
                    ))}
                 </div>
            </div>

            {/* Featured Item (Hero) */}
            {selectedCategory === 'burgers' && (
                <div 
                    onClick={() => handleProductClick(inventory[0])}
                    className="px-5 mb-8 mt-2 cursor-pointer"
                >
                <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img src={inventory[0].image} alt="Hero" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute bottom-5 left-5 z-20">
                    <div className="inline-block px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded mb-2 shadow-sm">Recomendación del Chef</div>
                    <h2 className="text-white text-2xl font-bold">{inventory[0].name}</h2>
                    <p className="text-gray-200 text-sm line-clamp-2 mt-1">{inventory[0].description}</p>
                    </div>
                </div>
                </div>
            )}

            {/* Product List */}
            <div className="px-5 space-y-6 min-h-[50vh]">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xl font-bold text-slate-800">{categories.find(c => c.id === selectedCategory)?.label}</h3>
                <span className="text-xs font-medium text-slate-500">{inventory.filter(i => i.category === selectedCategory).length} productos</span>
              </div>

              {inventory.filter(i => i.category === selectedCategory).map(item => (
                <div 
                    key={item.id} 
                    onClick={() => handleProductClick(item)}
                    className={`flex gap-4 group cursor-pointer ${item.stock === 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                >
                  <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 relative shadow-sm">
                     <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.name} />
                     {item.stock === 0 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-white text-[10px] font-bold uppercase border border-white px-2 py-1 tracking-wide">Agotado</span>
                        </div>
                     )}
                  </div>
                  <div className="flex flex-col flex-1 justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{item.name}</h4>
                        <span className="font-bold text-slate-800 ml-2">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-end mt-2">
                       <button 
                        onClick={(e) => handleDirectAdd(e, item)}
                        className="size-8 rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors flex items-center justify-center">
                         <Plus size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VIEW: PRODUCT DETAIL PAGE */}
        {view === 'product' && activeProduct && (
            <div className="pb-8">
                {/* Hero Image */}
                <div className="relative h-[40vh] w-full">
                    <img src={activeProduct.image} alt={activeProduct.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button 
                        onClick={() => setView('menu')}
                        className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30"
                    >
                        <ChevronLeft size={24} />
                    </button>
                </div>

                {/* Content Container */}
                <div className="relative -mt-8 bg-white rounded-t-3xl px-6 py-8 min-h-[60vh] flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-3xl font-bold text-slate-800 w-3/4 leading-tight">{activeProduct.name}</h2>
                        <span className="text-2xl font-bold text-primary">${activeProduct.price.toFixed(2)}</span>
                    </div>

                    <p className="text-slate-500 leading-relaxed mb-8">{activeProduct.description}</p>

                    {/* Quantity Selector */}
                    <div className="mb-8">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">Cantidad</h3>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                                className="size-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="text-xl font-bold text-slate-800 w-8 text-center">{pdpQuantity}</span>
                            <button 
                                onClick={() => setPdpQuantity(q => q + 1)}
                                className="size-10 rounded-full bg-slate-900 text-white flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="mb-24">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Te podría gustar</h3>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                            {inventory
                                .filter(i => i.category !== activeProduct.category && i.stock > 0)
                                .slice(0, 4)
                                .map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setActiveProduct(item)}
                                    className="min-w-[140px] bg-slate-50 rounded-xl p-3 border border-slate-100 cursor-pointer"
                                >
                                    <img src={item.image} className="w-full h-24 object-cover rounded-lg mb-2" />
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                    <p className="text-xs text-slate-500">${item.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Floating Add Button */}
                    <div className="fixed bottom-4 left-0 w-full px-6 z-40">
                        <button 
                            onClick={() => {
                                addToCart(activeProduct, pdpQuantity);
                                setView('menu');
                            }}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            Agregar al Pedido <Plus size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: CART */}
        {view === 'cart' && (
             <div className="p-6 h-full flex flex-col">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6">Mi Carrito</h2>
                 
                 {cart.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <ShoppingCart size={64} className="mb-4 opacity-20" />
                         <p>Tu carrito está vacío</p>
                         <button onClick={() => setView('menu')} className="mt-4 text-primary font-bold">Ir al Menú</button>
                     </div>
                 ) : (
                     <>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4">
                                    <img src={item.image} className="size-20 rounded-lg object-cover bg-slate-100" />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.id)} className="text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className={`font-bold ${item.isReward ? 'text-green-600' : 'text-slate-600'}`}>
                                                {item.isReward ? 'GRATIS' : `$${(item.price * item.quantity).toFixed(2)}`}
                                            </span>
                                            
                                            {!item.isReward && (
                                                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                                                    <button onClick={() => updateCartQuantity(item.id, -1)} className="size-6 bg-white shadow-sm rounded flex items-center justify-center text-slate-600"><Minus size={12} /></button>
                                                    <span className="text-sm font-bold w-4 text-center text-slate-800">{item.quantity}</span>
                                                    <button onClick={() => updateCartQuantity(item.id, 1)} className="size-6 bg-white shadow-sm rounded flex items-center justify-center text-slate-600"><Plus size={12} /></button>
                                                </div>
                                            )}
                                            {item.isReward && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Premio</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Suggestions Note */}
                            <div className="mt-6">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                    <MessageSquare size={16} /> Nota para la cocina
                                </label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800"
                                    rows={3}
                                    placeholder="Ej: Sin cebolla, aderezo aparte..."
                                    value={cartNote}
                                    onChange={(e) => setCartNote(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className="border-t pt-4 mt-4 bg-white">
                             <div className="flex justify-between items-center text-xl font-bold mb-4">
                                <span className="text-slate-600">Total</span>
                                <span className="text-primary">${cart.reduce((a,b) => a + (b.price * b.quantity), 0).toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={() => setView('checkout')}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                Procesar Pedido <ArrowRight size={20} />
                            </button>
                        </div>
                     </>
                 )}
             </div>
        )}

        {/* VIEW: SEARCH */}
        {view === 'search' && (
             <div className="p-5">
                 <div className="relative mb-6">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <input 
                        type="text" 
                        placeholder="Buscar platos, bebidas..." 
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 placeholder:text-slate-400"
                     />
                 </div>
                 
                 <div className="space-y-6">
                    {searchQuery ? (
                        inventory
                            .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(item => (
                                <div key={item.id} className="flex gap-4 items-center border-b border-slate-100 pb-4">
                                     <img src={item.image} className="size-16 rounded-lg object-cover bg-slate-100" />
                                     <div className="flex-1">
                                         <h4 className="font-bold text-slate-800">{item.name}</h4>
                                         <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                                     </div>
                                     <button onClick={() => addToCart(item)} className="bg-primary text-white p-2 rounded-full">
                                         <Plus size={16} />
                                     </button>
                                </div>
                            ))
                    ) : (
                        <div className="text-center text-slate-400 mt-20">
                            <Search size={48} className="mx-auto mb-2 opacity-20" />
                            <p>Escribe para buscar...</p>
                        </div>
                    )}
                 </div>
             </div>
        )}

        {/* VIEW: PROFILE */}
        {view === 'profile' && (
            <div className="p-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white text-center mb-8 shadow-xl">
                    <div className="size-24 rounded-full border-4 border-slate-700 mx-auto mb-4 overflow-hidden relative">
                        <img src="https://i.pravatar.cc/150?u=mesa_customer" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-2xl font-bold">Carlos Cliente</h2>
                    <p className="text-slate-400">carlos@ejemplo.com</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <div className="bg-slate-800 px-4 py-2 rounded-xl">
                            <span className="block text-xl font-bold text-primary">{customerHistory.length}</span>
                            <span className="text-xs text-slate-400">Pedidos</span>
                        </div>
                        <div className="bg-slate-800 px-4 py-2 rounded-xl">
                            <span className="block text-xl font-bold text-primary">3</span>
                            <span className="text-xs text-slate-400">Premios</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <button 
                        onClick={() => setView('history')}
                        className="w-full bg-slate-50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-100 font-medium text-slate-700"
                    >
                        <span>Historial de Pedidos</span> <ArrowRight size={18} className="text-slate-400" />
                    </button>
                    <button 
                        onClick={() => setView('payment-info')}
                        className="w-full bg-slate-50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-100 font-medium text-slate-700"
                    >
                        <span>Métodos de Pago</span> <ArrowRight size={18} className="text-slate-400" />
                    </button>
                    <button 
                        onClick={() => setView('help-support')}
                        className="w-full bg-slate-50 p-4 rounded-xl flex items-center justify-between hover:bg-slate-100 font-medium text-slate-700"
                    >
                        <span>Ayuda & Soporte</span> <ArrowRight size={18} className="text-slate-400" />
                    </button>
                    <button onClick={onLogout} className="w-full mt-8 p-4 rounded-xl flex items-center justify-center gap-2 text-red-500 font-bold hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </div>
        )}

        {/* VIEW: ORDER HISTORY */}
        {view === 'history' && (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Mis Pedidos</h2>
                {customerHistory.length === 0 ? (
                    <div className="text-center text-slate-400 py-12">
                        <History size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Aún no has realizado pedidos.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {customerHistory.slice().reverse().map(order => (
                            <div 
                                key={order.id} 
                                className={`bg-white border rounded-2xl p-4 shadow-sm ${order.status !== 'paid' ? 'border-primary/50 cursor-pointer hover:shadow-md' : 'border-slate-100'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded text-white ${getStatusColor(order.status)}`}>
                                            {getStatusText(order.status)}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {order.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <span className="font-bold text-slate-800">${order.items.reduce((acc, i) => acc + i.price, 0).toFixed(2)}</span>
                                </div>
                                <div className="space-y-1">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm text-slate-600">
                                            <span>{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                    {['delivered', 'paid'].includes(order.status) ? (
                                        <button 
                                            onClick={() => { setSelectedHistoryOrder(order); setView('order-detail'); }}
                                            className="text-slate-500 text-xs font-bold flex items-center gap-1 hover:text-slate-800"
                                        >
                                            Ver Detalles <Receipt size={12} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setView('status')}
                                            className="text-primary text-xs font-bold flex items-center gap-1 hover:text-orange-600"
                                        >
                                            Ver Estado <ArrowRight size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* VIEW: ORDER DETAIL (READ ONLY) */}
        {view === 'order-detail' && selectedHistoryOrder && (
             <div className="p-6">
                <button onClick={() => setView('history')} className="mb-4 text-slate-500 flex items-center gap-2 text-sm font-bold"><ChevronLeft size={16} /> Volver</button>
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-slate-200" />
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">Recibo</h2>
                        <span className="font-mono text-slate-400 text-sm">#{selectedHistoryOrder.id.slice(-4)}</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        {selectedHistoryOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-slate-600">{item.name}</span>
                                <span className="font-bold text-slate-800">{item.isReward ? '$0.00' : `$${item.price.toFixed(2)}`}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center mb-6">
                        <span className="font-bold text-slate-800">Total Pagado</span>
                        <span className="text-xl font-bold text-slate-800">${selectedHistoryOrder.items.reduce((a,b) => a+b.price,0).toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 mb-1">Estado Final</p>
                        <span className="font-bold text-slate-700 uppercase">{getStatusText(selectedHistoryOrder.status)}</span>
                    </div>
                </div>
             </div>
        )}

        {/* VIEW: CHECKOUT */}
        {view === 'checkout' && (
            <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Confirmar Pedido</h2>
                
                {/* GAME BANNER (Before confirming) */}
                {!hasPlayedGame && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-6 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-indigo-200"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Gift size={18} className="text-yellow-300" />
                                <span className="font-bold text-sm uppercase tracking-wide text-yellow-300">Premio Especial</span>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">¡Gana un Postre Gratis!</h3>
                            <p className="text-xs text-indigo-200 mt-1">Destruye 5 frutas en 10 segundos.</p>
                        </div>
                        <button 
                            onClick={startGame}
                            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm shadow active:scale-95 transition-transform"
                        >
                            JUGAR
                        </button>
                    </motion.div>
                )}

                {/* Order Summary */}
                <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Resumen</h3>
                    <div className="space-y-2 mb-4">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                                <span className="text-slate-800 font-medium">{item.quantity}x {item.name}</span>
                                <span className={`font-bold ${item.isReward ? 'text-green-600' : 'text-slate-800'}`}>
                                    {item.isReward ? 'GRATIS' : `$${(item.price * item.quantity).toFixed(2)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-center">
                        <span className="font-bold text-slate-800">Total a Pagar</span>
                        <span className="font-bold text-primary text-xl">${cart.reduce((a,b) => a+(b.price*b.quantity), 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                    <h3 className="font-bold text-slate-700 mb-3">Método de Pago</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setPaymentMethod('card')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-500'}`}
                        >
                            <CreditCard size={24} />
                            <span className="text-sm font-semibold">Tarjeta</span>
                        </button>
                        <button 
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-500'}`}
                        >
                            <Banknote size={24} />
                            <span className="text-sm font-semibold">Efectivo</span>
                        </button>
                    </div>
                </div>

                {/* Billing Info */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-700 mb-3">Datos de Facturación</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                        <button 
                            onClick={() => setBillingType('final')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${billingType === 'final' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                        >
                            Consumidor Final
                        </button>
                        <button 
                            onClick={() => setBillingType('invoice')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${billingType === 'invoice' ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                        >
                            Con Datos
                        </button>
                    </div>
                    
                    {billingType === 'invoice' && (
                        <input 
                            type="text" 
                            placeholder="RUC / Cédula / Nombre"
                            value={billingData}
                            onChange={(e) => setBillingData(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    )}
                </div>

                <button 
                    onClick={handlePlaceOrder}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    Realizar Pedido <CheckCircle size={20} />
                </button>
            </div>
        )}

        {/* VIEW: STATUS */}
        {view === 'status' && activeOrder && (
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Estado del Pedido</h2>
                        <div className="flex items-center gap-2 text-slate-500 mt-1">
                             <Clock size={14} />
                             <span className="text-sm">Entrega estimada: {new Date(new Date().getTime() + 15*60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">#{activeOrder.id.slice(-4)}</span>
                </div>
                
                {/* Header Action Buttons */}
                <div className="flex justify-end gap-2 mb-6">
                    <button 
                        onClick={() => setView('help-support')}
                        className="bg-slate-100 text-slate-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-slate-200"
                    >
                        <HelpCircle size={14} /> Ayuda
                    </button>
                    
                    {activeOrder.status === 'received' && (
                        <button 
                            onClick={() => { cancelOrder(activeOrder.id); setView('menu'); }}
                            className="bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-red-100 border border-red-100"
                        >
                            <X size={14} /> Cancelar Pedido
                        </button>
                    )}
                </div>

                <div className="relative pl-8 space-y-10 border-l-2 border-slate-100 ml-3">
                    {/* Status Steps */}
                    <div className="relative">
                        <div className={`absolute -left-[37px] p-2 rounded-full border-4 border-white ${['received', 'preparing', 'ready', 'delivered'].includes(activeOrder.status) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-lg">Pedido Recibido</h3>
                        <p className="text-sm text-slate-500">¡Hemos recibido tu orden!</p>
                    </div>

                    <div className="relative">
                         <div className={`absolute -left-[37px] p-2 rounded-full border-4 border-white ${['preparing', 'ready', 'delivered'].includes(activeOrder.status) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <ChefHat size={20} className={activeOrder.status === 'preparing' ? 'animate-bounce' : ''} />
                        </div>
                        <h3 className={`font-bold text-lg ${activeOrder.status === 'preparing' ? 'text-primary' : ''}`}>En Cocina</h3>
                        <p className="text-sm text-slate-500">El chef está preparando tu comida.</p>
                        {activeOrder.status === 'preparing' && (
                            <span className="inline-block mt-2 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded animate-pulse">Cocinando</span>
                        )}
                    </div>

                     <div className="relative">
                         <div className={`absolute -left-[37px] p-2 rounded-full border-4 border-white ${['ready', 'delivered'].includes(activeOrder.status) ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <Bell size={20} />
                        </div>
                        <h3 className={`font-bold text-lg ${activeOrder.status === 'ready' ? 'text-primary' : ''}`}>Listo para Servir</h3>
                        <p className="text-sm text-slate-500">Tu mesero te lo traerá pronto.</p>
                    </div>

                    <div className="relative">
                         <div className={`absolute -left-[37px] p-2 rounded-full border-4 border-white ${orderCheck(activeOrder.status, 'delivered') ? 'bg-primary text-white' : 'bg-slate-200 text-slate-400'}`}>
                            <Smile size={20} />
                        </div>
                        <h3 className={`font-bold text-lg ${activeOrder.status === 'delivered' ? 'text-primary' : ''}`}>Disfruta tu Comida</h3>
                        <p className="text-sm text-slate-500">¡Buen provecho!</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Navigation Bar (Bottom) - Only Status quick actions now, View Order removed in favor of Header Cart */}
      {view === 'status' && (
        <div className="absolute bottom-0 left-0 w-full bg-white border-t p-4 z-40">
             <div className="flex justify-around text-slate-400">
                <button onClick={() => setView('menu')} className="flex flex-col items-center gap-1 hover:text-primary"><Plus size={24} /><span className="text-[10px]">Agregar</span></button>
                <button className="flex flex-col items-center gap-1 text-primary"><Clock size={24} /><span className="text-[10px]">Estado</span></button>
             </div>
        </div>
      )}

      {/* FRUIT SMASHER GAME MODAL */}
      <AnimatePresence>
        {showGameModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
            >
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="bg-white w-full max-w-sm h-[500px] rounded-3xl p-6 text-center relative overflow-hidden flex flex-col"
                >
                    <button onClick={() => setShowGameModal(false)} className="absolute top-4 right-4 text-slate-400 z-50"><X /></button>
                    
                    {gameStatus === 'intro' && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-2xl font-bold mb-2 text-indigo-700">Fruit Smasher!</h2>
                            <p className="text-slate-500 mb-8 text-sm">Destruye 5 frutas en 10 segundos para ganar un postre.</p>
                            <button onClick={runGame} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
                                ¡COMENZAR!
                            </button>
                        </div>
                    )}

                    {gameStatus === 'playing' && (
                        <div className="flex-1 relative bg-slate-50 rounded-xl overflow-hidden cursor-crosshair border-2 border-indigo-100">
                            <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-full font-bold text-indigo-600 shadow-sm border border-indigo-100 z-20">
                                Tiempo: {gameTimeLeft}s
                            </div>
                            <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full font-bold text-green-600 shadow-sm border border-green-100 z-20">
                                Frutas: {fruits.filter(f => f.splatted).length}/5
                            </div>

                            {fruits.map(fruit => (
                                !fruit.splatted && (
                                    <motion.button
                                        key={fruit.id}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileTap={{ scale: 1.5, rotate: 20 }}
                                        onClick={() => smashFruit(fruit.id)}
                                        style={{ top: `${fruit.y}%`, left: `${fruit.x}%` }}
                                        className="absolute text-4xl p-2 select-none hover:scale-110 transition-transform"
                                    >
                                        {fruit.emoji}
                                    </motion.button>
                                )
                            ))}
                        </div>
                    )}

                    {gameStatus === 'won' && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Trophy size={64} className="text-yellow-400 mb-4 animate-bounce" />
                            <h2 className="text-3xl font-bold mb-2 text-green-600">¡GANASTE!</h2>
                            <p className="text-slate-500 mb-4">Tu postre se ha agregado al carrito.</p>
                            <div className="animate-spin-slow text-4xl">🍰</div>
                        </div>
                    )}

                    {gameStatus === 'lost' && (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <AlertCircle size={64} className="text-red-400 mb-4" />
                            <h2 className="text-3xl font-bold mb-2 text-slate-800">¡Tiempo Agotado!</h2>
                            <p className="text-slate-500 mb-4">Inténtalo en tu próxima visita.</p>
                            <button onClick={() => setShowGameModal(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-xl font-bold">
                                Cerrar
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 3. KITCHEN VIEW (KDS)
const KitchenView = ({ onLogout }: { onLogout: () => void }) => {
    const { orders, updateOrderStatus, inventory, toggleStock } = useMesa();
    const [view, setView] = useState<'tickets' | 'stock'>('tickets');

    // Filter out paid orders AND delivered orders (once delivered, it leaves kitchen display)
    const activeOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'delivered');

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-6 overflow-hidden flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-4">
                    <button onClick={onLogout} className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 text-white">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="bg-primary p-2 rounded-lg text-white">
                        <ChefHat size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Mesa KDS</h1>
                        <p className="text-xs text-gray-400">Estación: Parrilla y Fritura</p>
                    </div>
                </div>
                <div className="flex bg-gray-700 p-1 rounded-lg">
                    <button 
                        onClick={() => setView('tickets')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'tickets' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Comandas en Vivo
                    </button>
                    <button 
                        onClick={() => setView('stock')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'stock' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Inventario (86)
                    </button>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-white">12:43</div>
                    <div className="text-xs text-gray-500">AVG TICKET: 8m 12s</div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                {view === 'tickets' ? (
                    <div className="flex gap-4 h-full pb-4">
                        {activeOrders.map(order => (
                            <div key={order.id} className={`w-80 flex-shrink-0 bg-gray-800 rounded-xl border-t-4 flex flex-col ${order.status === 'received' ? 'border-primary' : 'border-yellow-500'}`}>
                                <div className="p-4 border-b border-gray-700 flex justify-between items-start bg-gray-700/30">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-xl text-white">Mesa {order.tableId}</h3>
                                            {order.items.some(i => i.isNewAppend) && (
                                                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-pulse">ANEXO</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400"># {order.id.slice(-4)}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono font-bold text-lg text-primary">04:12</span>
                                    </div>
                                </div>
                                
                                {/* Order Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {order.note && (
                                        <div className="bg-yellow-500/20 text-yellow-200 text-xs p-2 rounded-lg mb-2 flex items-start gap-1">
                                            <MessageSquare size={12} className="mt-0.5 shrink-0" />
                                            <span>{order.note}</span>
                                        </div>
                                    )}

                                    {order.items.map((item, idx) => (
                                        <div key={idx} className={`flex gap-3 ${item.status === 'ready' ? 'opacity-50' : ''}`}>
                                            <div className={`size-6 rounded flex items-center justify-center text-sm font-bold text-white ${item.isNewAppend ? 'bg-primary' : 'bg-gray-700'}`}>
                                                1
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-medium ${item.isNewAppend ? 'text-white' : 'text-gray-300'}`}>{item.name}</p>
                                                {item.isReward && <span className="text-[10px] text-green-400 font-bold uppercase">Premio</span>}
                                                {item.isNewAppend && <p className="text-[10px] text-primary font-bold">AGREGADO RECIENTE</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="p-4 border-t border-gray-700 mt-auto">
                                    {order.status === 'received' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all active:scale-95 mb-2"
                                        >
                                            EMPEZAR ORDEN
                                        </button>
                                    )}
                                    {order.status === 'preparing' && (
                                        <button 
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
                                        >
                                            MARCAR LISTO
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <div className="w-full bg-green-900/30 text-green-400 font-bold py-3 rounded-lg text-center border border-green-900">
                                            LISTO PARA SERVIR
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {activeOrders.length === 0 && (
                            <div className="flex items-center justify-center w-full text-gray-500">
                                No hay comandas activas
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-full pr-2">
                        {inventory.map(item => (
                            <div key={item.id} className={`bg-gray-800 p-4 rounded-xl border ${item.stock === 0 ? 'border-red-900 opacity-75' : 'border-gray-700'}`}>
                                <div className="flex gap-4 items-center mb-3">
                                    <img src={item.image} alt={item.name} className="size-16 rounded-lg object-cover grayscale" />
                                    <div>
                                        <h3 className="font-bold text-white">{item.name}</h3>
                                        <p className={`text-xs font-bold ${item.stock === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {item.stock === 0 ? 'AGOTADO' : `${item.stock} DISPONIBLES`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-400 uppercase font-bold">Disponibilidad</span>
                                    <button 
                                        onClick={() => toggleStock(item.id)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${item.stock > 0 ? 'bg-green-600' : 'bg-red-600'}`}
                                    >
                                        <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${item.stock > 0 ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. WAITER VIEW
const WaiterView = ({ onLogout }: { onLogout: () => void }) => {
    const { tables, orders, requestBill, markTableClean, updateOrderStatus } = useMesa();
    const [view, setView] = useState<'floor' | 'bill'>('floor');
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    // Waiter sees active order (not paid)
    const getTableOrder = (tId: number) => orders.find(o => o.tableId === tId && o.status !== 'paid');

    const handleTableClick = (tId: number) => {
        const order = getTableOrder(tId);
        if (order) {
            setSelectedTable(tId);
            setView('bill');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-20">
                 <div className="flex items-center gap-3">
                     <button onClick={view === 'bill' ? () => setView('floor') : onLogout} className="p-2 hover:bg-slate-100 rounded-full">
                         {view === 'bill' ? <ArrowRight className="rotate-180" /> : <LogOut size={20} className="text-red-500" />}
                     </button>
                    <h1 className="text-xl font-bold text-slate-800">Salón Principal</h1>
                 </div>
                 <div className="flex gap-2 text-sm">
                     <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-300"></span> Libre</span>
                     <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500"></span> Ocupada</span>
                     <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange-500"></span> Lista</span>
                 </div>
            </header>

            <div className="flex-1 p-6 overflow-auto">
                {view === 'floor' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {tables.map(table => {
                            const order = getTableOrder(table.id);
                            const isReady = order?.status === 'ready';
                            const isBillRequested = order?.billRequested;
                            
                            let borderColor = 'border-gray-200';
                            let bgColor = 'bg-white';
                            let statusColor = 'bg-slate-300';

                            if (table.status === 'occupied') {
                                borderColor = 'border-blue-200';
                                statusColor = 'bg-blue-500';
                            }
                            if (isReady) {
                                borderColor = 'border-orange-400';
                                bgColor = 'bg-orange-50 animate-pulse-fast'; // Heatmap blink
                            }
                            if (isBillRequested) {
                                borderColor = 'border-red-500';
                                bgColor = 'bg-red-50 animate-pulse'; 
                            }

                            return (
                                <button 
                                    key={table.id}
                                    onClick={() => handleTableClick(table.id)}
                                    className={`h-48 rounded-2xl border-2 p-4 flex flex-col justify-between transition-all hover:shadow-lg ${borderColor} ${bgColor}`}
                                >
                                    <div className="flex justify-between w-full">
                                        <span className="text-2xl font-bold text-slate-700 opacity-50">{table.id < 10 ? `0${table.id}` : table.id}</span>
                                        {isBillRequested && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">CUENTA</span>}
                                        {isReady && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded">LISTO</span>}
                                    </div>
                                    
                                    <div className="flex flex-col items-center">
                                        <div className={`size-12 rounded-full flex items-center justify-center mb-2 ${statusColor} text-white`}>
                                            <User size={20} />
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">{table.status === 'free' ? 'Vacía' : `${table.guests} Comensales`}</span>
                                    </div>
                                    
                                    {table.status === 'dirty' && (
                                        <div 
                                            onClick={(e) => { e.stopPropagation(); markTableClean(table.id); }}
                                            className="w-full py-2 bg-yellow-100 text-yellow-700 rounded text-xs font-bold"
                                        >
                                            MARCAR LIMPIA
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                        {/* Detail View */}
                        <div className="p-6 bg-slate-50 border-b">
                            <h2 className="text-2xl font-bold">Mesa {selectedTable}</h2>
                            <p className="text-slate-500">Detalles de la Mesa</p>
                            {getTableOrder(selectedTable!)?.billingType === 'invoice' && (
                                <div className="mt-2 text-xs bg-blue-100 text-blue-800 p-2 rounded">
                                    <strong>Datos Factura:</strong> {getTableOrder(selectedTable!)?.billingData}
                                </div>
                            )}
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Service Actions */}
                            {getTableOrder(selectedTable!)?.status === 'ready' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                                    <div className="flex items-center gap-3 mb-3 text-orange-700">
                                        <Utensils size={24} />
                                        <span className="font-bold text-lg">¡Pedido Listo!</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            updateOrderStatus(getTableOrder(selectedTable!)!.id, 'delivered');
                                            setView('floor');
                                        }}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                                    >
                                        Marcar como Entregado
                                    </button>
                                </div>
                            )}

                            {/* Order Items */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wide">Comanda Actual</h3>
                                {getTableOrder(selectedTable!)?.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-700">{item.name}</p>
                                            {item.isReward && <span className="text-xs text-green-500 font-bold uppercase">Premio Juego</span>}
                                        </div>
                                        <span className="font-mono">{item.isReward ? '$0.00' : `$${item.price.toFixed(2)}`}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-dashed pt-4 mt-4">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total</span>
                                    <span>${getTableOrder(selectedTable!)?.items.reduce((a,b) => a + b.price, 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-slate-500 mt-1">
                                    <span>Método Pago</span>
                                    <span className="capitalize">{getTableOrder(selectedTable!)?.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 6. TOAST NOTIFICATION COMPONENT
const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
    <AnimatePresence>
        {visible && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 left-0 right-0 z-[60] flex justify-center pointer-events-none"
            >
                <div className="bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold">
                    <CheckCircle size={16} className="text-green-400" />
                    {message}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

// 5. MAIN APP CONTROLLER
const AppContent = () => {
    const [role, setRole] = useState<string | null>(null);
    const { showToast } = useMesa();
    const [toastState, setToastState] = useState({ msg: '', visible: false });

    if (!role) return <RoleSelector onSelect={setRole} />;
    
    return (
        <div className="relative">
            {role === 'customer' && <CustomerView onLogout={() => setRole(null)} />}
            {role === 'kitchen' && <KitchenView onLogout={() => setRole(null)} />}
            {role === 'waiter' && <WaiterView onLogout={() => setRole(null)} />}
            
            {/* Demo Reset Button - Hidden but accessible if needed */}
            {!role && (
                <div className="fixed bottom-4 right-4 z-50">
                    <button onClick={() => setRole(null)} className="bg-black/80 text-white p-3 rounded-full hover:bg-black transition-colors shadow-lg">
                        <RefreshCw size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default function App() {
    // --- Global State ---
    const [inventory, setInventory] = useState<MenuItem[]>(INITIAL_INVENTORY);
    const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
    const [orders, setOrders] = useState<Order[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartNote, setCartNote] = useState('');
    const [activeTableId, setActiveTableId] = useState<number | null>(null); 
    const [isGameActive, setShowGame] = useState(false);
    const [hasPlayedGame, setHasPlayedGame] = useState(false);
    
    // Toast State
    const [toast, setToast] = useState({ msg: '', visible: false });

    // --- Actions ---
    
    const showToast = (msg: string) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
    };

    const updateTableGuests = (tableId: number, guests: number) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, guests, status: 'occupied' } : t));
    };

    const addToCart = (item: MenuItem, quantity = 1, isReward = false) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing && !isReward) {
                // If it exists and isn't a reward, just add quantity
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            // Add new item
            return [...prev, { ...item, quantity: quantity, isReward }];
        });
        if (!isReward) showToast("Producto Agregado");
    };

    const updateCartQuantity = (itemId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const placeOrder = (paymentMethod: 'card'|'cash', billingType: 'final'|'invoice', billingData?: string) => {
        if (cart.length === 0 || activeTableId === null) return;

        setOrders(prev => {
            // Transform cart items to order items
            const newItems: OrderItem[] = [];
            cart.forEach(cartItem => {
                for(let i=0; i < cartItem.quantity; i++) {
                     newItems.push({
                        ...cartItem,
                        uniqueId: Math.random().toString(36).substr(2, 9),
                        status: 'pending',
                        isNewAppend: false, // New orders are fresh, not appends in this logic anymore
                        isReward: cartItem.isReward
                    });
                }
            });

            // New Order - Always create a new ticket for new cart items
            const newOrder: Order = {
                id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                tableId: activeTableId,
                items: newItems,
                status: 'received',
                timestamp: new Date(),
                paymentMethod,
                billingType,
                billingData,
                note: cartNote,
            };
            return [...prev, newOrder];
        });

        // Update Table Status
        setTables(prev => prev.map(t => t.id === activeTableId ? { ...t, status: 'occupied' } : t));
        
        setCart([]);
        setCartNote('');
    };

    const cancelOrder = (orderId: string) => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast("Pedido Cancelado");
    };

    const claimReward = (item: MenuItem) => {
        addToCart(item, 1, true);
    };

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                // Update items status based on order status for consistency
                const updatedItems = o.items.map(i => {
                    if (status === 'ready') return { ...i, status: 'ready' as const, isNewAppend: false };
                    if (status === 'delivered') return { ...i, status: 'delivered' as const };
                    return i;
                });
                return { ...o, status, items: updatedItems };
            }
            return o;
        }));
    };

    const toggleStock = (itemId: string) => {
        setInventory(prev => prev.map(i => i.id === itemId ? { ...i, stock: i.stock > 0 ? 0 : 50 } : i));
    };

    const requestBill = (tableId: number) => {
        setOrders(prev => prev.map(o => o.tableId === tableId && o.status !== 'paid' ? { ...o, billRequested: true } : o));
    };
    
    const markTableClean = (tableId: number) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'free' } : t));
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const value = {
        inventory,
        orders,
        tables,
        activeTableId,
        setActiveTableId,
        updateTableGuests,
        cart,
        cartNote,
        setCartNote,
        isGameActive,
        hasPlayedGame,
        setHasPlayedGame,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        placeOrder,
        cancelOrder,
        updateOrderStatus,
        toggleStock,
        requestBill,
        markTableClean,
        claimReward,
        setShowGame,
        showToast
    };

    return (
        <MesaContext.Provider value={value}>
            <AppContent />
            <Toast message={toast.msg} visible={toast.visible} />
        </MesaContext.Provider>
    );
}