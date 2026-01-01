import React, { useState, useEffect } from 'react';
import { Auction, Lot, LotItem } from '../types';
import { ArrowLeft, Plus, Trash2, ShoppingBag, CheckCircle2, Circle, Trophy, Gavel, XCircle, ArrowDown, PiggyBank, Receipt, ChevronLeft, ChevronRight, ChevronDown, StickyNote, ExternalLink, Wallet, Clock, Ban, TrendingUp, DollarSign, Eye, Wrench, ArrowUpFromLine } from 'lucide-react';

interface LotDetailProps {
  auction: Auction;
  lot: Lot;
  allLots?: Lot[]; 
  onBack: () => void;
  onUpdateLot: (lotId: string, data: Partial<Lot>) => void;
  onDelete: () => void;
}

export const LotDetail: React.FC<LotDetailProps> = ({ auction, lot, allLots = [], onBack, onUpdateLot, onDelete }) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('');
  const [newItemObservation, setNewItemObservation] = useState('');
  
  // Estados de UI
  const [showOtherLots, setShowOtherLots] = useState(false);
  const [showRecoveryCosts, setShowRecoveryCosts] = useState(true); // Default aberto
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  // Inputs Controlados
  const [winningBidRaw, setWinningBidRaw] = useState(lot.winningBid ? (lot.winningBid * 100).toFixed(0) : '');
  const [sellingPriceRaw, setSellingPriceRaw] = useState(lot.sellingPrice ? (lot.sellingPrice * 100).toFixed(0) : '');

  const items = lot.items || [];
  const lotStatus = lot.status || 'pending';
  const images = lot.images || [];

  const currentFeePercent = lot.overrideFeePercent ?? auction.defaultFeePercent;
  const currentPatioFeePercent = lot.overridePatioFeePercent ?? (auction.defaultPatioFeePercent || 0);
  const totalRate = 1 + (currentFeePercent / 100) + (currentPatioFeePercent / 100);
  const totalItemsCost = items.reduce((acc, item) => acc + item.cost, 0);

  // Helper simples para ID único compatível com qualquer ambiente
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
        setCurrentImgIndex(prev => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };
  const prevImage = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const otherPurchasedLots = allLots.filter(l => l.id !== lot.id && l.status === 'purchased');
  const spentOnOtherLots = otherPurchasedLots.reduce((acc, l) => {
      if (l.winningBid) {
          const lFee = l.overrideFeePercent ?? auction.defaultFeePercent;
          const lPatio = l.overridePatioFeePercent ?? (auction.defaultPatioFeePercent || 0);
          const lCost = l.winningBid * (1 + (lFee + lPatio) / 100);
          const lParts = (l.items || []).reduce((sum, i) => sum + i.cost, 0);
          return acc + lCost + lParts;
      }
      return acc;
  }, 0);

  const getLotTotalCost = (l: Lot) => {
      if (!l.winningBid) return 0;
      const lFee = l.overrideFeePercent ?? auction.defaultFeePercent;
      const lPatio = l.overridePatioFeePercent ?? (auction.defaultPatioFeePercent || 0);
      const lCost = l.winningBid * (1 + (lFee + lPatio) / 100);
      const lParts = (l.items || []).reduce((sum, i) => sum + i.cost, 0);
      return lCost + lParts;
  };

  const auctionBudget = auction.budget || 0;
  const availableForThisLot = auctionBudget - spentOnOtherLots;
  const maxSafeBid = availableForThisLot > 0 ? (availableForThisLot - totalItemsCost) / totalRate : 0;
  
  const actualWinningBid = winningBidRaw ? parseInt(winningBidRaw) / 100 : 0;
  const feesValue = actualWinningBid * ((currentFeePercent + currentPatioFeePercent) / 100);
  const totalToPayAuctioneer = actualWinningBid + feesValue; 
  const totalSpentThisLot = totalToPayAuctioneer + totalItemsCost;
  const finalGlobalBalance = auctionBudget - (spentOnOtherLots + totalSpentThisLot);

  // Profit Calculation
  const actualSellingPrice = sellingPriceRaw ? parseInt(sellingPriceRaw) / 100 : 0;
  const estimatedProfit = actualSellingPrice - totalSpentThisLot;
  const roiPercentage = totalSpentThisLot > 0 ? (estimatedProfit / totalSpentThisLot) * 100 : 0;
  const hasSale = actualSellingPrice > 0;

  const handleStatusChange = (status: 'pending' | 'purchased' | 'lost') => {
      onUpdateLot(lot.id, { status: status });
  };

  const handleWinningBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      setWinningBidRaw(raw);
      const val = raw ? parseInt(raw) / 100 : undefined;
      onUpdateLot(lot.id, { winningBid: val });
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '');
      setSellingPriceRaw(raw);
      const val = raw ? parseInt(raw) / 100 : undefined;
      onUpdateLot(lot.id, { sellingPrice: val });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCost) return;
    const cost = parseFloat(newItemCost.replace(/\./g, '').replace(',', '.'));
    
    // Geração segura de ID
    const newItem: LotItem = {
      id: generateId(),
      name: newItemName,
      cost: cost,
      checked: false,
      observation: newItemObservation
    };
    
    // Atualiza
    onUpdateLot(lot.id, { items: [...items, newItem] });
    
    // Limpa
    setNewItemName('');
    setNewItemCost('');
    setNewItemObservation('');
  };

  const handleDeleteItem = (itemId: string) => {
    // Filtra removendo o item pelo ID
    const updatedItems = items.filter(i => i.id !== itemId);
    onUpdateLot(lot.id, { items: updatedItems });
  };

  const toggleItemCheck = (itemId: string) => {
    onUpdateLot(lot.id, { items: items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) });
  };

  const toggleVisited = () => {
    onUpdateLot(lot.id, { visited: !lot.visited });
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Navegação */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-primary dark:hover:text-white font-bold text-sm uppercase tracking-widest transition-colors duration-300">
            <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button 
            onClick={onDelete} 
            className="group flex items-center gap-2 text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-colors duration-300 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-full border border-red-100 dark:border-red-900/30 hover:border-red-200"
        >
            <Trash2 className="w-4 h-4" /> 
            <span>Excluir Lote</span>
        </button>
      </div>

      {/* Cabeçalho do Lote com Seletor de Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-stone-100 dark:border-stone-800 pb-6">
          <div className="flex-1">
              <h1 className="text-4xl font-serif italic text-primary dark:text-white leading-tight mb-4 animate-in slide-in-from-left-2 fade-in duration-500">{lot.name}</h1>
              
              <div className="flex flex-wrap gap-3 items-center">
                  {/* Status Selector */}
                  <div className="inline-flex bg-white dark:bg-stone-900 p-1.5 rounded-full border border-stone-200 dark:border-stone-800 shadow-sm animate-in slide-in-from-bottom-2 fade-in duration-700">
                      <button 
                        onClick={() => handleStatusChange('pending')} 
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${lotStatus === 'pending' ? 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-inner scale-105' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
                      >
                        <Clock className="w-3 h-3" /> Pendente
                      </button>
                      <button 
                        onClick={() => handleStatusChange('purchased')} 
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${lotStatus === 'purchased' ? 'bg-accent text-white shadow-md scale-105' : 'text-stone-400 hover:text-accent'}`}
                      >
                        <Trophy className="w-3 h-3" /> Arrematado
                      </button>
                      <button 
                        onClick={() => handleStatusChange('lost')} 
                        className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${lotStatus === 'lost' ? 'bg-stone-600 text-white shadow-md scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <Ban className="w-3 h-3" /> Não Arrematado
                      </button>
                  </div>

                  {/* Visited Toggle Button */}
                  <button 
                    onClick={toggleVisited}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 border ${lot.visited 
                        ? 'bg-green-500 border-green-500 text-white shadow-md' 
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400 hover:border-green-500 hover:text-green-500'}`}
                  >
                    {lot.visited ? <CheckCircle2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {lot.visited ? 'Vistoriado' : 'Não Vistoriado'}
                  </button>
              </div>
          </div>

          {/* Resumo Rápido */}
           <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-stone-400 animate-in slide-in-from-right-2 fade-in duration-700">
                <div className="bg-stone-50 dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-100 dark:border-stone-800 transition-transform hover:scale-105 duration-300 cursor-default">
                    <span className="block text-stone-300 dark:text-stone-600 mb-1">Comissão</span>
                    <span className="text-primary dark:text-stone-200 text-sm">{currentFeePercent}%</span>
                </div>
                <div className="bg-stone-50 dark:bg-stone-900 px-4 py-2 rounded-xl border border-stone-100 dark:border-stone-800 transition-transform hover:scale-105 duration-300 cursor-default">
                    <span className="block text-stone-300 dark:text-stone-600 mb-1">Pátio/Adm</span>
                    <span className="text-primary dark:text-stone-200 text-sm">{currentPatioFeePercent}%</span>
                </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda */}
        <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100">
          
          {/* Imagem */}
          <div className={`bg-white dark:bg-stone-900 rounded-[2rem] overflow-hidden border transition-all duration-500 relative group ${lotStatus === 'purchased' ? 'border-accent shadow-lg' : 'border-stone-200 dark:border-stone-800 hover:shadow-md'}`}>
            <div className="h-64 bg-primary dark:bg-black relative overflow-hidden">
               {images.length > 0 ? (
                 <>
                    <img src={images[currentImgIndex]} alt={lot.name} className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${lotStatus === 'lost' ? 'grayscale opacity-50' : ''}`} />
                    {images.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <button onClick={prevImage} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm"><ChevronLeft className="w-5 h-5" /></button>
                            <button onClick={nextImage} className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    )}
                 </>
               ) : (
                 <div className="flex items-center justify-center h-full text-white/20"><ShoppingBag className="w-16 h-16" /></div>
               )}
            </div>
            
            <div className="p-6">
              <p className="text-sm text-stone-600 dark:text-stone-300 mb-4 leading-relaxed font-light">{lot.description || 'Sem descrição.'}</p>
              {lot.lotUrl && (
                  <a href={lot.lotUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center text-xs font-bold uppercase tracking-widest text-primary dark:text-white border border-stone-200 dark:border-stone-700 py-3 rounded-xl hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-300 active:scale-95">
                      Ver no Site Oficial
                  </a>
              )}
            </div>
          </div>

          {/* Private Banking Card / Estratégia */}
          <div className="bg-primary dark:bg-black text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-1000"></div>
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-white/5 rounded-full"><Wallet className="w-5 h-5 text-accent" /></div>
                <h3 className="font-serif italic text-xl">Estratégia do Lote</h3>
             </div>

             <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-sm font-light text-white/60 border-b border-white/10 pb-2">
                    <span>Teto do Leilão</span>
                    <span className="font-mono text-white">{formatCurrency(auctionBudget)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-light text-white/60 border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1"><ArrowUpFromLine className="w-3 h-3 text-accent" /> Incremento Mínimo</span>
                    <span className="font-mono text-white">{formatCurrency(lot.bidIncrement || 0)}</span>
                </div>

                <div className="flex flex-col text-sm text-white/60 border-b border-white/10 pb-2">
                    <button 
                        onClick={() => setShowOtherLots(!showOtherLots)} 
                        disabled={otherPurchasedLots.length === 0 && totalSpentThisLot === 0} 
                        className={`flex justify-between items-center w-full transition-colors duration-300 ${otherPurchasedLots.length > 0 || totalSpentThisLot > 0 ? 'hover:text-accent cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    >
                        <span className="flex items-center gap-1 transition-transform duration-300">
                             <ChevronDown className={`w-3 h-3 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showOtherLots ? 'rotate-180' : ''}`} /> 
                             Detalhamento de Gastos
                        </span>
                        <span className="font-mono">{formatCurrency(spentOnOtherLots + totalSpentThisLot)}</span>
                    </button>
                    
                    {/* Animação Expansível com Grid (Outros Lotes + Lote Atual) */}
                    <div 
                        className={`grid transition-[grid-template-rows,opacity,margin] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            showOtherLots 
                                ? 'grid-rows-[1fr] opacity-100 mt-3' 
                                : 'grid-rows-[0fr] opacity-0 mt-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                             <div className="pl-4 space-y-1 border-l border-white/10 pt-1">
                                {/* Listagem dos Outros Lotes */}
                                {otherPurchasedLots.map((ol, index) => (
                                    <div 
                                        key={ol.id} 
                                        className={`flex justify-between text-[10px] text-white/60 ${showOtherLots ? 'animate-in slide-in-from-top-1 fade-in duration-500' : ''}`}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <span className="truncate w-32">{ol.name}</span>
                                        <span>{formatCurrency(getLotTotalCost(ol))}</span>
                                    </div>
                                ))}
                                
                                {/* Lote Atual Destacado */}
                                {totalSpentThisLot > 0 && (
                                     <div 
                                        className={`flex justify-between text-[10px] text-accent font-bold bg-accent/10 -mx-2 px-2 py-1.5 rounded border border-accent/20 mt-1 ${showOtherLots ? 'animate-in slide-in-from-top-2 fade-in duration-500' : ''}`}
                                        style={{ animationDelay: `${otherPurchasedLots.length * 50 + 100}ms` }}
                                     >
                                        <span className="truncate w-32 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                            {lot.name}
                                        </span>
                                        <span>{formatCurrency(totalSpentThisLot)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm text-white/60 pb-2">
                    <span>(-) Custos Extras (Peças/Doc)</span>
                    <span className="font-mono">{formatCurrency(totalItemsCost)}</span>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10 mt-2 transition-colors hover:bg-white/10 duration-300">
                    <p className="text-[10px] uppercase tracking-widest text-accent mb-1 font-bold">Lance Máximo Sugerido</p>
                    <div className="text-3xl font-serif italic text-white transition-all duration-300">{maxSafeBid < 0 ? 'R$ 0,00' : formatCurrency(maxSafeBid)}</div>
                </div>
             </div>

             {/* Área de Input de Arremate */}
             <div className="mt-8 pt-6 border-t border-white/10">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Valor do Arremate</label>
                 <div className="flex items-center gap-2">
                     <span className="text-accent text-lg font-serif italic">R$</span>
                     <input 
                        type="text"
                        inputMode="numeric"
                        value={winningBidRaw ? (parseInt(winningBidRaw)/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                        onChange={handleWinningBidChange}
                        placeholder="0,00"
                        className="w-full bg-transparent text-2xl font-mono text-white placeholder:text-stone-700 outline-none border-b border-stone-700 focus:border-accent pb-1 transition-colors duration-300"
                     />
                 </div>
                 
                 {actualWinningBid > 0 && (
                     <div className="mt-4 animate-in slide-in-from-bottom-4 fade-in zoom-in-95 duration-500 bg-accent text-primary p-4 rounded-xl shadow-lg">
                         <div className="flex justify-between items-end">
                             <div>
                                 <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Total Boleto Leiloeiro</p>
                                 <p className="text-2xl font-bold">{formatCurrency(totalToPayAuctioneer)}</p>
                             </div>
                             <Receipt className="w-6 h-6 opacity-50" />
                         </div>
                     </div>
                 )}
                 
                 {actualWinningBid > 0 && (
                    <div className={`mt-2 text-center text-xs font-bold uppercase tracking-wider py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-700 ${finalGlobalBalance >= 0 ? 'text-accent' : 'text-red-400 bg-red-400/10'}`}>
                        {finalGlobalBalance >= 0 ? 'Dentro do Teto' : `Excedeu Teto: ${formatCurrency(Math.abs(finalGlobalBalance))}`}
                    </div>
                 )}
             </div>
          </div>
        </div>

        {/* Coluna Direita - Lista */}
        <div className="lg:col-span-2 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-200">
            
            {/* NOVO: Resultado Financeiro (Venda e Lucro) */}
            <div className="bg-stone-50 dark:bg-stone-900 rounded-[2rem] shadow-sm border border-stone-200 dark:border-stone-800 p-8">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full"><TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                    <h3 className="font-serif italic text-2xl text-primary dark:text-white">Resultado Financeiro</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* Input Valor de Venda */}
                     <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
                        <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Valor de Venda (Realizado)</label>
                         <div className="flex items-center gap-2">
                             <span className="text-stone-400">R$</span>
                             <input 
                                type="text"
                                inputMode="numeric"
                                value={sellingPriceRaw ? (parseInt(sellingPriceRaw)/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                                onChange={handleSellingPriceChange}
                                placeholder="0,00"
                                className="w-full bg-transparent text-xl font-mono text-primary dark:text-white outline-none font-bold placeholder:text-stone-300"
                             />
                         </div>
                     </div>

                     {/* Custo Total Real */}
                     <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 opacity-70">
                        <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Custo Total (Arremate + Extras)</label>
                        <p className="text-xl font-mono text-primary dark:text-white font-medium">{formatCurrency(totalSpentThisLot)}</p>
                     </div>

                     {/* Lucro Líquido */}
                     <div className={`p-4 rounded-2xl border flex flex-col justify-center relative overflow-hidden transition-colors duration-500 ${hasSale ? (estimatedProfit > 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800') : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}`}>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1 z-10 ${hasSale ? (estimatedProfit > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-stone-500'}`}>
                            Lucro Realizado
                        </label>
                        <div className={`text-2xl font-serif italic z-10 ${hasSale ? (estimatedProfit > 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'text-stone-400 dark:text-stone-500'}`}>
                            {hasSale ? formatCurrency(estimatedProfit) : '—'}
                        </div>
                        {hasSale && estimatedProfit !== 0 && (
                            <div className={`text-xs font-bold mt-1 z-10 ${estimatedProfit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                ROI: {roiPercentage.toFixed(1)}%
                            </div>
                        )}
                        {/* Icon Background */}
                        <DollarSign className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12 ${hasSale && estimatedProfit > 0 ? 'text-green-600' : 'text-stone-400'}`} />
                     </div>
                 </div>
            </div>

            {/* Custos de Recuperação (Animação Suave) */}
            <div className="bg-white dark:bg-stone-900 rounded-[2rem] shadow-sm border border-stone-200 dark:border-stone-800 h-fit transition-all duration-500">
                
                {/* Cabeçalho Clicável */}
                <div 
                    onClick={() => setShowRecoveryCosts(!showRecoveryCosts)}
                    className="flex justify-between items-center p-8 cursor-pointer group select-none hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-t-[2rem] transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-full group-hover:bg-primary group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors duration-300">
                             <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif italic text-primary dark:text-white leading-none">Custos de Recuperação</h2>
                            <p className="text-stone-500 dark:text-stone-400 font-light text-sm mt-1">Peças, funilaria e serviços.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Total Estimado</p>
                            <p className="text-2xl font-mono text-primary dark:text-stone-200 transition-all duration-300">{formatCurrency(totalItemsCost)}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${showRecoveryCosts ? 'bg-primary border-primary text-white rotate-180' : 'text-stone-400 group-hover:border-primary group-hover:text-primary'}`}>
                             <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Conteúdo Expansível */}
                <div 
                    className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        showRecoveryCosts 
                            ? 'grid-rows-[1fr] opacity-100' 
                            : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="px-8 pb-8">
                            <form onSubmit={handleAddItem} className={`bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-end transition-shadow focus-within:shadow-md duration-300 ${showRecoveryCosts ? 'animate-in slide-in-from-top-4 fade-in duration-700' : ''}`}>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Descrição</label>
                                    <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item..." className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:border-accent outline-none transition-colors dark:text-white" />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Valor</label>
                                    <input type="number" step="0.01" value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)} placeholder="0,00" className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm font-mono focus:border-accent outline-none transition-colors dark:text-white" />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Obs/Link</label>
                                    <input value={newItemObservation} onChange={(e) => setNewItemObservation(e.target.value)} placeholder="http://..." className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm focus:border-accent outline-none transition-colors dark:text-white" />
                                </div>
                                <button type="submit" disabled={!newItemName || !newItemCost} className="bg-primary dark:bg-black text-white p-3 rounded-xl hover:bg-black dark:hover:bg-stone-900 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"><Plus className="w-5 h-5" /></button>
                            </form>

                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div 
                                        key={item.id} 
                                        className={`flex items-center p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${showRecoveryCosts ? 'animate-in slide-in-from-top-2 fade-in duration-500' : ''} ${item.checked ? 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 opacity-60' : 'bg-white dark:bg-stone-900 border-stone-100 dark:border-stone-800 hover:border-accent dark:hover:border-accent'}`}
                                        style={{ animationDelay: `${index * 50 + 100}ms` }}
                                    >
                                        <button onClick={() => toggleItemCheck(item.id)} className={`mr-4 transition-colors duration-300 ${item.checked ? 'text-accent' : 'text-stone-300 dark:text-stone-600 hover:text-stone-400 dark:hover:text-stone-500'}`}>
                                            {item.checked ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                        </button>
                                        <div className="flex-1">
                                            <p className={`font-medium transition-colors duration-300 ${item.checked ? 'line-through text-stone-400 dark:text-stone-500' : 'text-primary dark:text-stone-200'}`}>{item.name}</p>
                                            {item.observation && <p className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-xs">{item.observation}</p>}
                                        </div>
                                        <div className="font-mono text-stone-600 dark:text-stone-400 mr-4">{formatCurrency(item.cost)}</div>
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteItem(item.id); }} 
                                            className="text-stone-300 dark:text-stone-600 hover:text-red-400 transition-colors duration-300"
                                            title="Excluir item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {items.length === 0 && <p className="text-center text-stone-300 dark:text-stone-600 py-10 font-serif italic text-lg animate-in fade-in duration-500">Nenhum custo extra lançado.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}