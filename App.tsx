import React, { useState, useEffect } from 'react';
import { Auction, Lot, AuctionType, LotItem } from './types';
import { AuctionList } from './components/AuctionList';
import { LotList } from './components/LotList';
import { LotDetail } from './components/LotDetail';
import { PurchasedLots } from './components/PurchasedLots';
import { Auth } from './components/Auth';
import { ConfirmModal } from './components/ConfirmModal';
import { Plus, X, Moon, Sun, Upload, Eye, Calendar, LogOut, Loader2, User as UserIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

export const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // States de Dados
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  
  const [view, setView] = useState<'auctions' | 'lots' | 'lotDetail' | 'archived' | 'purchased'>('auctions');
  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Modal States
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [newAuctionData, setNewAuctionData] = useState<Partial<Auction>>({
    name: '', date: '', budget: 0, defaultFeePercent: 5, defaultPatioFeePercent: 0, visitationStart: '', visitationEnd: '', type: 'Outros'
  });
  
  // State para Confirmação de Exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'auction' | 'lot';
    id: string;
    title: string;
    message: string;
  }>({ isOpen: false, type: 'auction', id: '', title: '', message: '' });

  // States para inputs de moeda
  const [auctionBudgetRaw, setAuctionBudgetRaw] = useState('');
  const [lotInitialBidRaw, setLotInitialBidRaw] = useState('');
  const [lotFipeRaw, setLotFipeRaw] = useState('');

  const [showLotModal, setShowLotModal] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [newLotData, setNewLotData] = useState<Partial<Lot>>({
    name: '', description: '', initialBidValue: 0, fipeValue: 0, currentEstimatedBid: 0, images: []
  });

  // --- Helpers ---
  const getSafeErrorMessage = (error: any): string => {
      if (typeof error === 'string') return error;
      if (error?.message) return error.message;
      if (error?.error_description) return error.error_description;
      return 'Ocorreu um erro inesperado.';
  };

  // Gera um nome amigável a partir do email
  const getUserName = () => {
      if (!session?.user?.email) return 'Visitante';
      // Pega a parte antes do @
      const prefix = session.user.email.split('@')[0];
      // Substitui pontos ou underscores por espaços e capitaliza cada palavra
      return prefix
        .split(/[._]/)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  };

  // --- MAPPERS (Adapter Pattern para Supabase Snake_Case) ---
  
  const mapAuctionFromDB = (dbAuction: any): Auction => ({
    id: dbAuction.id,
    userId: dbAuction.user_id,
    name: dbAuction.name,
    date: dbAuction.date,
    budget: dbAuction.budget,
    type: dbAuction.type as AuctionType,
    defaultFeePercent: dbAuction.default_fee_percent,
    defaultPatioFeePercent: dbAuction.default_patio_fee_percent,
    description: dbAuction.description,
    bannerImage: dbAuction.banner_image,
    visitationStart: dbAuction.visitation_start,
    visitationEnd: dbAuction.visitation_end,
    siteUrl: dbAuction.site_url,
    visited: dbAuction.visited,
    status: dbAuction.status
  });

  const mapAuctionToDB = (auction: Partial<Auction>) => ({
    user_id: session?.user?.id,
    name: auction.name,
    date: auction.date || null, // Fix: converte string vazia para null
    budget: auction.budget,
    type: auction.type,
    default_fee_percent: auction.defaultFeePercent,
    default_patio_fee_percent: auction.defaultPatioFeePercent,
    description: auction.description,
    banner_image: auction.bannerImage,
    visitation_start: auction.visitationStart || null, // Fix: converte string vazia para null
    visitation_end: auction.visitationEnd || null, // Fix: converte string vazia para null
    site_url: auction.siteUrl,
    visited: auction.visited,
    status: auction.status || 'active'
  });

  const mapLotFromDB = (dbLot: any): Lot => ({
    id: dbLot.id,
    auctionId: dbLot.auction_id,
    name: dbLot.name,
    description: dbLot.description,
    images: dbLot.images || [], // JSONB
    maxBidLimit: dbLot.max_bid_limit,
    initialBidValue: dbLot.initial_bid_value,
    fipeValue: dbLot.fipe_value,
    bidIncrement: dbLot.bid_increment,
    currentEstimatedBid: dbLot.current_estimated_bid,
    overrideFeePercent: dbLot.override_fee_percent,
    overridePatioFeePercent: dbLot.override_patio_fee_percent,
    items: dbLot.items || [], // JSONB
    status: dbLot.status,
    winningBid: dbLot.winning_bid,
    lotUrl: dbLot.lot_url,
    sellingPrice: dbLot.selling_price,
    visited: dbLot.visited
  });

  const mapLotToDB = (lot: Partial<Lot>, auctionId: string) => ({
    auction_id: auctionId,
    name: lot.name,
    description: lot.description,
    images: lot.images, // Array to JSONB
    max_bid_limit: lot.maxBidLimit || 0,
    initial_bid_value: lot.initialBidValue,
    fipe_value: lot.fipeValue,
    bid_increment: lot.bidIncrement,
    current_estimated_bid: lot.currentEstimatedBid,
    override_fee_percent: lot.overrideFeePercent,
    override_patio_fee_percent: lot.overridePatioFeePercent,
    items: lot.items, // Array to JSONB
    status: lot.status || 'pending',
    winning_bid: lot.winningBid,
    lot_url: lot.lotUrl,
    selling_price: lot.sellingPrice,
    visited: lot.visited
  });

  // --- EFEITOS (Auth e Data Fetching) ---

  useEffect(() => {
    // 1. Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingInitial(false);
    });

    // 2. Escuta mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
          setAuctions([]);
          setLots([]);
      }
    });

    // 3. Tema
    const storedTheme = localStorage.getItem('lotecerto_theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      localStorage.setItem('lotecerto_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Carregar dados quando a sessão existe
  useEffect(() => {
      if (session) {
          fetchData();
      }
  }, [session]);

  const fetchData = async () => {
      try {
          // Fetch Auctions
          const { data: auctionsData, error: auctionsError } = await supabase
            .from('auctions')
            .select('*')
            .order('date', { ascending: true });
          
          if (auctionsError) throw auctionsError;
          setAuctions(auctionsData ? auctionsData.map(mapAuctionFromDB) : []);

          // Fetch Lots (idealmente paginado ou por demanda, mas ok para MVP)
          const { data: lotsData, error: lotsError } = await supabase
            .from('lots')
            .select('*');
            
          if (lotsError) throw lotsError;
          setLots(lotsData ? lotsData.map(mapLotFromDB) : []);

      } catch (error) {
          console.error("Erro ao carregar dados:", error);
          // Não mostramos alert no fetch inicial para não travar a UX, apenas log
      }
  };

  // --- Handlers Auth ---
  const handleLogout = async () => {
      await supabase.auth.signOut();
      setView('auctions');
  };

  // --- Handlers Auction ---

  const handleCreateAuction = () => {
    setEditingAuction(null);
    setNewAuctionData({
        name: '', 
        date: '', 
        budget: 0, 
        defaultFeePercent: 5, 
        defaultPatioFeePercent: 0,
        visitationStart: '',
        visitationEnd: '',
        type: 'Outros'
    });
    setAuctionBudgetRaw('');
    setShowAuctionModal(true);
  };

  const handleEditAuction = (auction: Auction) => {
    setEditingAuction(auction);
    setNewAuctionData({ ...auction });
    setAuctionBudgetRaw(auction.budget ? (auction.budget * 100).toFixed(0) : ''); 
    setShowAuctionModal(true);
  };

  const handleSaveAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    const finalBudget = auctionBudgetRaw ? parseInt(auctionBudgetRaw) / 100 : 0;
    
    const auctionPayload = {
        ...newAuctionData,
        budget: finalBudget
    };
    
    const dbPayload = mapAuctionToDB(auctionPayload);

    try {
        if (editingAuction) {
            const { error } = await supabase
                .from('auctions')
                .update(dbPayload)
                .eq('id', editingAuction.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('auctions')
                .insert([dbPayload]);
            if (error) throw error;
        }
        await fetchData(); // Recarrega
        setShowAuctionModal(false);
    } catch (error: any) {
        alert('Erro ao salvar leilão: ' + getSafeErrorMessage(error));
    }
  };

  // Solicita a exclusão (apenas abre modal)
  const handleDeleteAuction = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'auction',
      id,
      title: 'Excluir Leilão?',
      message: 'Você está prestes a excluir este leilão e TODOS os lotes vinculados a ele.\n\nEsta ação é irreversível.'
    });
  };

  const handleArchiveAuction = async (id: string) => {
      const auction = auctions.find(a => a.id === id);
      if (!auction) return;
      const newStatus = auction.status === 'archived' ? 'active' : 'archived';

      try {
          const { error } = await supabase
            .from('auctions')
            .update({ status: newStatus })
            .eq('id', id);
          if (error) throw error;
          
          setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      } catch (error: any) {
          console.error('Erro ao arquivar:', error);
      }
  };
  
  // Handler auxiliar para atualizar visited direto do card (sem modal)
  const handleUpdateAuctionDirect = async (auction: Auction) => {
      try {
           const { error } = await supabase
            .from('auctions')
            .update(mapAuctionToDB(auction))
            .eq('id', auction.id);
          if (error) throw error;
          await fetchData();
      } catch (e) { console.error(e); }
  };

  // --- Handlers Lots ---

  const handleCreateLot = () => {
    setEditingLot(null);
    setNewLotData({
      name: '', description: '', currentEstimatedBid: 0, initialBidValue: 0, fipeValue: 0, images: []
    });
    setLotInitialBidRaw('');
    setLotFipeRaw('');
    setShowLotModal(true);
  };

  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setNewLotData({ ...lot });
    setLotInitialBidRaw(lot.initialBidValue ? (lot.initialBidValue * 100).toFixed(0) : '');
    setLotFipeRaw(lot.fipeValue ? (lot.fipeValue * 100).toFixed(0) : '');
    setShowLotModal(true);
  };

  const handleSaveLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuctionId || !session) return;

    const finalInitialBid = lotInitialBidRaw ? parseInt(lotInitialBidRaw) / 100 : 0;
    const finalFipe = lotFipeRaw ? parseInt(lotFipeRaw) / 100 : 0;

    const lotPayload: Partial<Lot> = {
        ...newLotData,
        initialBidValue: finalInitialBid,
        fipeValue: finalFipe,
        items: editingLot ? editingLot.items : [], // Preserva items se apenas editando detalhes
    };
    
    const dbPayload = mapLotToDB(lotPayload, selectedAuctionId);

    try {
        if (editingLot) {
            const { error } = await supabase
                .from('lots')
                .update(dbPayload)
                .eq('id', editingLot.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('lots')
                .insert([dbPayload]);
            if (error) throw error;
        }
        await fetchData();
        setShowLotModal(false);
    } catch (error: any) {
        alert('Erro ao salvar lote: ' + getSafeErrorMessage(error));
    }
  };

  // Solicita a exclusão de lote (apenas abre modal)
  const handleDeleteLot = (id: string) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'lot',
      id,
      title: 'Excluir Lote?',
      message: 'Este lote e todos os seus registros de custos serão removidos permanentemente.'
    });
  };

  // --- EXECUÇÃO DE EXCLUSÃO (Chamado pelo Modal) ---
  const executeDeletion = async () => {
    const { type, id } = deleteConfirmation;
    
    try {
      if (type === 'auction') {
          // 1. Deletar Lotes (Tentativa explícita para evitar erro de FK)
          // Mesmo que a FK esteja configurada, fazer isso manualmente no frontend garante feedback melhor
          const { error: lotsError } = await supabase.from('lots').delete().eq('auction_id', id);
          if (lotsError) console.warn('Aviso ao deletar lotes vinculados:', lotsError);

          // 2. Deletar Leilão
          const { error } = await supabase.from('auctions').delete().eq('id', id);
          if (error) throw error;

          // Atualiza UI
          setAuctions(prev => prev.filter(a => a.id !== id));
          setLots(prev => prev.filter(l => l.auctionId !== id));
          
          if (selectedAuctionId === id) {
              setView('auctions');
              setSelectedAuctionId(null);
          }
      } else if (type === 'lot') {
          const { error } = await supabase.from('lots').delete().eq('id', id);
          if (error) throw error;

          setLots(prev => prev.filter(l => l.id !== id));
          
          if (selectedLotId === id) {
              setView('lots');
              setSelectedLotId(null);
          }
      }
    } catch (error: any) {
        alert('Erro ao excluir: ' + getSafeErrorMessage(error));
    } finally {
      // Fecha o modal
      setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleUpdateLot = async (lotId: string, data: Partial<Lot>) => {
      // Otimista Update UI
      setLots(prev => prev.map(l => l.id === lotId ? { ...l, ...data } : l));
      
      try {
          // Precisamos dos dados completos para mapear para o DB, então pegamos o estado atual
          const currentLot = lots.find(l => l.id === lotId);
          if (!currentLot) return;
          
          const mergedLot = { ...currentLot, ...data };
          const dbPayload = mapLotToDB(mergedLot, currentLot.auctionId);
          
          const { error } = await supabase
            .from('lots')
            .update(dbPayload)
            .eq('id', lotId);
            
          if (error) {
              // Reverter se falhar (opcional, mas boa prática)
              fetchData(); 
              throw error;
          }
      } catch (error) {
          console.error("Erro ao atualizar lote", error);
      }
  };

  // Image Upload (Base64)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAuctionBanner = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const processFile = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    } else {
                        resolve(event.target?.result as string);
                    }
                };
                img.onerror = () => resolve("");
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    if (isAuctionBanner) {
        const base64 = await processFile(files[0]);
        setNewAuctionData(prev => ({ ...prev, bannerImage: base64 }));
    } else {
        const filePromises = Array.from(files).map(processFile);
        const base64Images = await Promise.all(filePromises);
        setNewLotData(prev => {
            const currentImages = prev.images || [];
            return { ...prev, images: [...currentImages, ...base64Images] };
        });
    }
  };

  // --- Lógica de Derivação de Dados (View Logic) ---
  
  const activeAuctions = auctions
    .filter(a => a.status !== 'archived')
    .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const dateA = new Date(a.date + 'T00:00:00').getTime();
        const dateB = new Date(b.date + 'T00:00:00').getTime();
        return dateA - dateB;
    });

  const archivedAuctions = auctions.filter(a => a.status === 'archived');
  
  const activeLots = selectedAuctionId 
    ? lots
        .filter(l => l.auctionId === selectedAuctionId)
        .sort((a, b) => {
           if (a.status === 'purchased' && b.status !== 'purchased') return 1;
           if (a.status !== 'purchased' && b.status === 'purchased') return -1;
           return a.name.localeCompare(b.name);
        }) 
    : [];

  const selectedAuction = auctions.find(a => a.id === selectedAuctionId);
  const selectedLot = lots.find(l => l.id === selectedLotId);
  
  const totalLotsCount = lots.length;
  const purchasedLotsCount = lots.filter(l => l.status === 'purchased').length;
  const archivedCount = archivedAuctions.length;
  
  const activeAuctionIds = new Set(activeAuctions.map(a => a.id));
  const targetedLotsCount = lots.filter(l => 
    activeAuctionIds.has(l.auctionId) && (l.status === 'pending' || !l.status)
  ).length;

  const renderContent = () => {
      if (view === 'auctions' || view === 'archived') {
          return (
              <AuctionList 
                  auctions={view === 'archived' ? archivedAuctions : activeAuctions}
                  totalLotsCount={totalLotsCount}
                  purchasedLotsCount={purchasedLotsCount}
                  targetedLotsCount={targetedLotsCount}
                  archivedCount={archivedCount}
                  onSelectAuction={(a) => { setSelectedAuctionId(a.id); setView('lots'); }}
                  onDeleteAuction={handleDeleteAuction}
                  onEditAuction={handleEditAuction}
                  onCreateAuction={handleCreateAuction}
                  onUpdateAuction={handleUpdateAuctionDirect as any}
                  onArchiveAuction={handleArchiveAuction}
                  onViewArchived={() => setView('archived')}
                  onViewPurchased={() => setView('purchased')}
                  isArchiveView={view === 'archived'}
              />
          );
      }
      if (view === 'purchased') {
          return (
              <PurchasedLots 
                lots={lots}
                auctions={auctions}
                onBack={() => setView('auctions')}
              />
          );
      }
      if (view === 'lots' && selectedAuction) {
          return (
              <LotList 
                  auction={selectedAuction}
                  lots={activeLots}
                  onDeleteLot={handleDeleteLot}
                  onEditLot={handleEditLot}
                  onSelectLot={(l) => { setSelectedLotId(l.id); setView('lotDetail'); }}
                  onBack={() => { setSelectedAuctionId(null); setView('auctions'); }}
                  onAddLotClick={handleCreateLot}
              />
          );
      }
      if (view === 'lotDetail' && selectedAuction && selectedLot) {
          return (
              <LotDetail 
                  auction={selectedAuction}
                  lot={selectedLot}
                  allLots={lots.filter(l => l.auctionId === selectedAuctionId)}
                  onBack={() => { setSelectedLotId(null); setView('lots'); }}
                  onUpdateLot={handleUpdateLot}
                  onDelete={() => { handleDeleteLot(selectedLot.id); }}
              />
          );
      }
      return null;
  };

  // Se estiver carregando sessão
  if (loadingInitial) {
      return (
          <div className="min-h-screen bg-stone-950 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
      );
  }

  // Se não estiver logado, mostra Auth
  if (!session) {
      return <Auth onLogin={() => {}} />;
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors duration-300 font-sans selection:bg-accent selection:text-white">
        
        <nav className="sticky top-0 z-40 bg-gradient-to-b from-white/90 to-stone-50/90 dark:from-stone-900/90 dark:to-stone-950/90 backdrop-blur-md shadow-xl border-b border-accent/20">
            <div className="max-w-7xl mx-auto px-6 h-28 flex items-center justify-between">
                <div className="flex flex-col cursor-pointer group select-none" onClick={() => { setSelectedAuctionId(null); setView('auctions'); }}>
                    <div className="flex items-center leading-none">
                        <span className="font-sans font-black text-4xl tracking-tighter text-primary dark:text-white">L</span>
                        <div className="mx-0.5 w-10 h-10 bg-primary dark:bg-white rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-lg">
                            <Calendar className="w-5 h-5 text-white dark:text-primary" strokeWidth={3} />
                        </div>
                        <span className="font-sans font-black text-4xl tracking-tighter text-primary dark:text-white">te</span>
                        <div className="w-3 h-3 rounded-full bg-accent ml-1 mt-3"></div>
                    </div>
                    <div className="font-sans font-bold text-base uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300 group-hover:text-primary dark:group-hover:text-white transition-colors w-full pl-0.5">
                        Certo
                    </div>
                </div>

                <div className="flex items-center gap-4">
                     {/* Username Display */}
                    <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700">
                        <div className="p-1 bg-white dark:bg-stone-900 rounded-full">
                            <UserIcon className="w-4 h-4 text-stone-500" />
                        </div>
                        <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                            Olá, <span className="text-primary dark:text-white">{getUserName()}</span>
                        </span>
                    </div>

                    <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors shadow-md border border-stone-200 dark:border-stone-700">
                        {darkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-stone-600" />}
                    </button>
                    <button onClick={handleLogout} className="group p-3 rounded-full bg-white dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-md border border-stone-200 dark:border-stone-700 flex items-center gap-2" title="Sair">
                        <LogOut className="w-5 h-5 text-stone-600 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>
            </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-12">
            {renderContent()}
        </main>

        <ConfirmModal 
            isOpen={deleteConfirmation.isOpen}
            title={deleteConfirmation.title}
            message={deleteConfirmation.message}
            onConfirm={executeDeletion}
            onCancel={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
        />

        {showAuctionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-stone-200 dark:border-stone-800">
                    <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                        <h2 className="text-2xl font-serif italic text-primary dark:text-white">{editingAuction ? 'Editar Leilão' : 'Novo Leilão'}</h2>
                        <button onClick={() => setShowAuctionModal(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-stone-500" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleSaveAuction} className="p-6 space-y-4">
                        <div className="relative w-full h-32 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden group cursor-pointer border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-accent transition-colors">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {newAuctionData.bannerImage ? (
                                <img src={newAuctionData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400">
                                    <Upload className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold uppercase">Capa do Leilão</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Nome do Evento</label>
                            <input required value={newAuctionData.name} onChange={(e) => setNewAuctionData({...newAuctionData, name: e.target.value})} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white" placeholder="Ex: Leilão de Veículos Recuperados" />
                        </div>

                        {/* Campo de Tipo de Leilão */}
                        <div>
                             <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Categoria / Tipo</label>
                             <select 
                                value={newAuctionData.type || 'Outros'} 
                                onChange={(e) => setNewAuctionData({...newAuctionData, type: e.target.value as AuctionType})}
                                className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white appearance-none"
                             >
                                <option value="Detran">Detran</option>
                                <option value="Prefeitura">Prefeitura</option>
                                <option value="Financeira">Financeira</option>
                                <option value="Judicial">Judicial</option>
                                <option value="Outros">Outros</option>
                             </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Data</label>
                                <input type="date" required value={newAuctionData.date} onChange={(e) => setNewAuctionData({...newAuctionData, date: e.target.value})} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Orçamento Teto (R$)</label>
                                <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-3 focus-within:border-accent transition-colors">
                                    <span className="text-stone-500 font-serif italic">R$</span>
                                    <input 
                                        value={auctionBudgetRaw ? (parseInt(auctionBudgetRaw)/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setAuctionBudgetRaw(val);
                                        }}
                                        className="w-full bg-transparent outline-none font-mono text-lg font-bold text-stone-700 dark:text-stone-200 placeholder:text-stone-300"
                                        placeholder="0,00"
                                        inputMode="numeric"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-accent/5 px-3 py-3 rounded-xl border border-accent/20 relative group mt-1">
                            <div className="absolute -top-2 left-2 bg-white dark:bg-stone-900 px-1 text-[9px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5" /> Visitação
                            </div>
                            <div className="flex gap-2 items-end pt-1">
                                <div className="flex-1 min-w-0">
                                    <span className="block text-[9px] text-stone-400 font-bold mb-0.5">Início</span>
                                    <input 
                                        type="date" 
                                        value={newAuctionData.visitationStart}
                                        onChange={(e) => setNewAuctionData({...newAuctionData, visitationStart: e.target.value})}
                                        className="w-full h-8 px-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs dark:text-stone-200 focus:border-accent outline-none" 
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block text-[9px] text-stone-400 font-bold mb-0.5">Fim</span>
                                    <input 
                                        type="date" 
                                        value={newAuctionData.visitationEnd}
                                        onChange={(e) => setNewAuctionData({...newAuctionData, visitationEnd: e.target.value})}
                                        className="w-full h-8 px-2 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg text-xs dark:text-stone-200 focus:border-accent outline-none" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Taxa Leiloeiro (%)</label>
                                <input type="number" step="0.1" value={newAuctionData.defaultFeePercent} onChange={(e) => setNewAuctionData({...newAuctionData, defaultFeePercent: parseFloat(e.target.value)})} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Taxa Pátio (%)</label>
                                <input type="number" step="0.1" value={newAuctionData.defaultPatioFeePercent} onChange={(e) => setNewAuctionData({...newAuctionData, defaultPatioFeePercent: parseFloat(e.target.value)})} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Link do Site (Opcional)</label>
                            <input value={newAuctionData.siteUrl || ''} onChange={(e) => setNewAuctionData({...newAuctionData, siteUrl: e.target.value})} className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 outline-none focus:border-accent dark:text-white" placeholder="https://..." />
                        </div>

                        <button type="submit" className="w-full bg-primary dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:bg-black dark:hover:bg-stone-200 transition-colors uppercase tracking-widest text-xs shadow-lg mt-4">
                            {editingAuction ? 'Salvar Alterações' : 'Criar Leilão'}
                        </button>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};