import React, { useState } from 'react';
import { Auction, Lot } from '../types';
import { Calculator } from './Calculator';
import { Trash2, Image as ImageIcon, Wallet, Plus, Calendar, ChevronLeft, ChevronRight, Edit2, Warehouse, Eye, ExternalLink, ArrowLeft, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

interface LotListProps {
  auction: Auction;
  lots: Lot[];
  onDeleteLot: (id: string) => void;
  onEditLot: (lot: Lot) => void;
  onSelectLot: (lot: Lot) => void;
  onBack: () => void;
  onAddLotClick: () => void;
}

export const LotList: React.FC<LotListProps> = ({ auction, lots, onDeleteLot, onEditLot, onSelectLot, onBack, onAddLotClick }) => {
  const [isAnimatingAdd, setIsAnimatingAdd] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  };

  const formatVisitationRange = (start?: string, end?: string) => {
      if (!start) return null;
      const dStart = new Date(start + 'T00:00:00');
      if (isNaN(dStart.getTime())) return null;
      
      const format = (d: Date) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d);

      if (!end || start === end) {
          return format(dStart);
      }
      
      const dEnd = new Date(end + 'T00:00:00');
      if (isNaN(dEnd.getTime())) {
          return format(dStart);
      }
      return `${format(dStart)} a ${format(dEnd)}`;
  };

  const handleAddClick = () => {
    setIsAnimatingAdd(true);
    setTimeout(() => {
      onAddLotClick();
      setIsAnimatingAdd(false);
    }, 200);
  };

  const totalSpent = lots.reduce((acc, lot) => {
    if (lot.status === 'purchased' && lot.winningBid) {
         const fee = lot.overrideFeePercent ?? auction.defaultFeePercent;
         const patio = lot.overridePatioFeePercent ?? (auction.defaultPatioFeePercent || 0);
         const lotCost = lot.winningBid * (1 + (fee + patio) / 100);
         const partsCost = (lot.items || []).reduce((sum, item) => sum + item.cost, 0);
         return acc + lotCost + partsCost;
    }
    return acc;
  }, 0);

  const remainingBudget = (auction.budget || 0) - totalSpent;
  const visitation = formatVisitationRange(auction.visitationStart, auction.visitationEnd);

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Navegação de Volta */}
      <button 
          onClick={onBack} 
          className="group flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-primary dark:hover:text-white transition-colors uppercase tracking-widest"
        >
          <div className="p-1 rounded-full border border-stone-200 dark:border-stone-700 group-hover:border-primary dark:group-hover:border-white transition-colors">
            <ArrowLeft className="w-3 h-3" />
          </div>
          Voltar
      </button>

      {/* Cabeçalho do Leilão - Estilo Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end border-b border-stone-200 dark:border-stone-800 pb-10">
          <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-accent bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20 w-fit">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Leilão: {formatDate(auction.date)}</span>
                  </div>
                  {visitation && (
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 w-fit">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Visitação: {visitation}</span>
                      </div>
                  )}
              </div>
              
              <h1 className="text-5xl font-serif italic text-primary dark:text-white leading-none mb-6">{auction.name}</h1>
              
              {/* Botão de Site Oficial Destacado */}
              {auction.siteUrl && (
                <a 
                    href={auction.siteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white dark:bg-white dark:text-stone-900 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white dark:hover:bg-accent dark:hover:text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    Acessar página oficial <ExternalLink className="w-4 h-4" />
                </a>
            )}
          </div>

          <div className="flex gap-6 justify-end">
               <div className="text-right">
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Gasto Realizado</p>
                    <p className="text-2xl font-mono text-stone-700 dark:text-stone-300">
                        {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
               </div>
               <div className="w-px bg-stone-200 dark:bg-stone-800 h-12"></div>
               <div className="text-right">
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-1">Saldo Disponível</p>
                    <p className={`text-3xl font-serif italic ${remainingBudget >= 0 ? 'text-primary dark:text-white' : 'text-red-500'}`}>
                        {remainingBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
               </div>
          </div>
      </div>

      {/* Grid de Lotes */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Card Adicionar (Botão Grande Minimalista) */}
        <button 
          onClick={handleAddClick}
          className={`group flex flex-col items-center justify-center gap-6 min-h-[400px] rounded-[2rem] border border-dashed border-stone-300 dark:border-stone-700 transition-all duration-300
            ${isAnimatingAdd 
                ? 'bg-stone-100 dark:bg-stone-900 scale-95' 
                : 'hover:bg-white dark:hover:bg-stone-900 hover:border-accent hover:shadow-xl'
            }`}
        >
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-accent group-hover:text-primary flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-stone-400 group-hover:text-white" />
            </div>
            <div className="text-center">
                <h3 className="font-serif italic text-2xl text-stone-400 dark:text-stone-500 group-hover:text-primary dark:group-hover:text-white transition-colors">Novo Lote</h3>
                <p className="text-xs text-stone-400 dark:text-stone-600 uppercase tracking-widest mt-2">Adicionar item ao acervo</p>
            </div>
        </button>

        {/* Lotes Existentes */}
        {lots.map((lot) => (
          <LotCard 
            key={lot.id} 
            lot={lot} 
            defaultFee={auction.defaultFeePercent} 
            defaultPatioFee={auction.defaultPatioFeePercent ?? 0}
            auctionBudget={auction.budget || 0}
            remainingBudget={remainingBudget}
            onDelete={() => onDeleteLot(lot.id)}
            onEdit={() => onEditLot(lot)}
            onClick={() => onSelectLot(lot)}
          />
        ))}
      </div>
    </div>
  );
};

export const LotCard: React.FC<{ 
    lot: Lot; 
    defaultFee: number; 
    defaultPatioFee: number; 
    auctionBudget: number;
    remainingBudget: number;
    onDelete: () => void; 
    onEdit: () => void;
    onClick: () => void;
}> = ({ lot, defaultFee, defaultPatioFee, auctionBudget, remainingBudget, onDelete, onEdit, onClick }) => {
    const [expandedCalculator, setExpandedCalculator] = useState(false);
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    const images = lot.images && lot.images.length > 0 ? lot.images : [];
    const lotStatus = lot.status || 'pending';
    
    // Cálculos
    const partsCost = (lot.items || []).reduce((acc, i) => acc + i.cost, 0);
    const currentFee = lot.overrideFeePercent ?? defaultFee;
    const currentPatioFee = lot.overridePatioFeePercent ?? defaultPatioFee;
    const totalRate = 1 + (currentFee + currentPatioFee) / 100;
    const maxPossibleBid = (remainingBudget - partsCost) / totalRate;

    // Cálculos de Lucro/Resultado
    const winningBidVal = lot.winningBid || 0;
    const sellingPriceVal = lot.sellingPrice || 0;
    const totalCost = (winningBidVal * totalRate) + partsCost;
    const profit = sellingPriceVal - totalCost;
    const hasSale = sellingPriceVal > 0;
    const isPurchased = lotStatus === 'purchased';

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatValue = (val?: number) => {
        if (!val) return '-';
        // Formatação limpa: 2 casas decimais fixas
        return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div 
            onClick={onClick}
            className={`group bg-white dark:bg-stone-900 rounded-[2rem] p-3 shadow-sm border border-stone-100 dark:border-stone-800 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden`}
        >
            {/* Imagem Container */}
            <div className="relative h-64 rounded-[1.5rem] overflow-hidden bg-primary dark:bg-black">
              {images.length > 0 ? (
                <img 
                    src={images[currentImgIndex]} 
                    alt={lot.name} 
                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100 ${lotStatus === 'lost' ? 'grayscale' : ''}`} 
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="w-12 h-12 text-white/20" />
                </div>
              )}
                
               {/* Overlay Status */}
               {lotStatus === 'purchased' && (
                  <div className="absolute top-4 left-4 bg-primary dark:bg-black text-accent px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg z-10">
                      Arrematado
                  </div>
               )}
               
               {/* Overlay Visited */}
               {lot.visited && (
                  <div className={`absolute bottom-4 left-4 bg-green-500/90 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg z-10 flex items-center gap-1 backdrop-blur-sm ${lotStatus === 'purchased' ? 'mb-0' : 'mb-12'}`}>
                      <Eye className="w-3 h-3" /> Visitado
                  </div>
               )}
               
               {/* Ações Visíveis (sempre visíveis agora para melhor UX) */}
               <div className="absolute top-4 right-4 flex gap-2 z-30">
                 {lot.lotUrl && (
                     <a 
                        href={lot.lotUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={(e) => e.stopPropagation()} 
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-blue-600 transition-colors"
                        title="Abrir link do lote"
                     >
                        <ExternalLink className="w-4 h-4" />
                     </a>
                 )}
                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-primary transition-colors cursor-pointer" title="Editar">
                    <Edit2 className="w-4 h-4" />
                 </button>
                 <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors cursor-pointer" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                 </button>
               </div>

                {/* Título Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                    <h3 className="font-serif italic text-2xl text-white leading-tight">{lot.name}</h3>
                </div>
            </div>

            {/* Conteúdo */}
            <div className="px-4 py-6">
              
              {/* Se for arrematado, mostra resultado. Se não, mostra teto. */}
              {isPurchased ? (
                  <div className="mb-6 bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-200 dark:border-stone-700/50">
                      <div className="flex justify-between items-end mb-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                             <TrendingUp className="w-3 h-3" /> Arremate
                          </span>
                          <span className="font-mono text-lg font-bold text-stone-700 dark:text-stone-200">
                             {winningBidVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                      </div>
                      
                      {hasSale ? (
                          <div className="flex justify-between items-end border-t border-stone-200 dark:border-stone-700 pt-2 mt-2">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                                 <DollarSign className="w-3 h-3" /> Lucro
                              </span>
                              <span className={`font-mono text-lg font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                 {profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                          </div>
                      ) : (
                          <div className="text-[10px] text-stone-400 mt-2 text-right italic border-t border-stone-200 dark:border-stone-700 pt-2">
                              Aguardando venda...
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="mb-6">
                       {/* Linha 1: Lance Teto (Principal) */}
                       <div className="flex justify-between items-center mb-4">
                           <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Lance Teto</span>
                                <span className={`font-mono text-2xl font-bold ${maxPossibleBid > 0 ? 'text-primary dark:text-stone-100' : 'text-red-500'}`}>
                                     {maxPossibleBid > 0 
                                            ? formatCurrency(maxPossibleBid)
                                            : 'Sem Saldo'
                                     }
                                </span>
                           </div>
                           <div className="w-10 h-10 rounded-full border border-stone-100 dark:border-stone-800 flex items-center justify-center bg-stone-50 dark:bg-stone-800">
                                <Wallet className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                           </div>
                       </div>

                       {/* Linha 2: Lance Inicial e FIPE - Melhorada */}
                       <div className="flex items-center gap-4 pt-4 border-t border-stone-100 dark:border-stone-800 mt-4">
                             <div className="flex-1">
                                <span className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Lance Inicial</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xs font-semibold text-stone-400">R$</span>
                                    <span className="font-mono text-lg font-bold text-stone-900 dark:text-white">
                                        {formatValue(lot.initialBidValue)}
                                    </span>
                                </div>
                                {/* INCREMENTO AQUI */}
                                {lot.bidIncrement && lot.bidIncrement > 0 && (
                                     <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1 font-medium">
                                        <ArrowUpRight className="w-3 h-3" /> Incr: {formatValue(lot.bidIncrement)}
                                     </div>
                                )}
                             </div>
                             <div className="w-px bg-stone-200 dark:bg-stone-700 h-8"></div>
                             <div className="flex-1 text-right">
                                <span className="block text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Tabela FIPE</span>
                                 <div className="flex items-baseline gap-1 justify-end">
                                    <span className="text-xs font-semibold text-stone-400">R$</span>
                                    <span className="font-mono text-lg font-bold text-stone-900 dark:text-white">
                                        {formatValue(lot.fipeValue)}
                                    </span>
                                </div>
                             </div>
                       </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-4">
                 <div>
                    <span className="block font-bold uppercase text-[10px] text-stone-300 dark:text-stone-600 mb-1">Taxas</span>
                    {currentFee + currentPatioFee}%
                 </div>
                 <div className="text-right">
                    <span className="block font-bold uppercase text-[10px] text-stone-300 dark:text-stone-600 mb-1">Peças</span>
                    {partsCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setExpandedCalculator(!expandedCalculator); }}
                className={`w-full mt-6 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all
                  ${expandedCalculator 
                    ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-primary dark:text-white' 
                    : 'border-stone-200 dark:border-stone-800 text-stone-400 hover:border-primary dark:hover:border-white hover:text-primary dark:hover:text-white'}`}
              >
                {expandedCalculator ? 'Fechar Simulador' : 'Simular Custos'}
              </button>

              {expandedCalculator && (
                <div className="mt-4 animate-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                    <Calculator 
                        baseFeePercent={currentFee} 
                        basePatioFeePercent={currentPatioFee}
                        maxLimit={remainingBudget}
                        initialBid={lot.initialBidValue || 0} 
                    />
                </div>
              )}
            </div>
        </div>
    );
}