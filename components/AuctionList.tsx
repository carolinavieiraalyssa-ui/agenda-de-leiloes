import React, { useState, useMemo } from 'react';
import { Auction, AuctionType } from '../types';
import { Calendar, Trash2, Gavel, ArrowRight, Eye, Bell, Clock, AlertCircle, Edit2, ExternalLink, BarChart3, Layers, Plus, ArrowUpRight, Timer, CheckCircle2, AlertTriangle, Archive, Trophy, Crosshair, Search, Filter } from 'lucide-react';

interface AuctionListProps {
  auctions: Auction[];
  totalLotsCount: number;
  purchasedLotsCount: number;
  targetedLotsCount: number;
  archivedCount: number;
  onSelectAuction: (auction: Auction) => void;
  onDeleteAuction: (id: string) => void;
  onEditAuction: (auction: Auction) => void;
  onCreateAuction: () => void;
  onUpdateAuction: (auction: Auction) => void;
  onArchiveAuction: (id: string) => void;
  onViewArchived: () => void;
  onViewPurchased: () => void;
  isArchiveView?: boolean;
}

export const AuctionList: React.FC<AuctionListProps> = ({ 
    auctions, totalLotsCount, purchasedLotsCount, targetedLotsCount, archivedCount, 
    onSelectAuction, onDeleteAuction, onEditAuction, onCreateAuction, onUpdateAuction, onArchiveAuction,
    onViewArchived, onViewPurchased, isArchiveView = false
}) => {
  
  // Estado para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<AuctionType | 'Todos'>('Todos');
  const [filterDate, setFilterDate] = useState('');

  // Lógica de Filtragem
  const filteredAuctions = useMemo(() => {
    return auctions.filter(auction => {
        const matchesName = auction.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todos' || auction.type === filterType;
        const matchesDate = !filterDate || auction.date === filterDate;
        
        return matchesName && matchesType && matchesDate;
    });
  }, [auctions, searchTerm, filterType, filterDate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); 
    if (isNaN(date.getTime())) return 'Data inválida';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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

  const getUrgencyStatus = (dateString: string) => {
    if (!dateString) return null;
    const auctionDate = new Date(dateString + 'T00:00:00');
    if (isNaN(auctionDate.getTime())) return null;

    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = auctionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Encerrado', color: 'bg-stone-800 text-stone-400 dark:bg-stone-700 dark:text-stone-300', icon: <Clock className="w-3 h-3" /> };
    if (diffDays === 0) return { label: 'Leilão Hoje', color: 'bg-accent text-primary', icon: <Bell className="w-3 h-3" />, pulse: true };
    if (diffDays <= 5) return { label: `${diffDays} dias para o leilão`, color: 'bg-primary text-white dark:bg-stone-700', icon: <Clock className="w-3 h-3" /> };
    return { label: `Em ${diffDays} dias`, color: 'bg-white/90 text-primary dark:bg-stone-900/90 dark:text-white', icon: <Calendar className="w-3 h-3" /> };
  };

  const getVisitationAlert = (auction: Auction) => {
      if (!auction.visitationStart || auction.visited) return null;
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const start = new Date(auction.visitationStart + 'T00:00:00');
      const end = auction.visitationEnd ? new Date(auction.visitationEnd + 'T00:00:00') : start;
      
      const diffStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffEnd < 0) return null;

      if (diffStart <= 0 && diffEnd >= 0) {
          return { label: 'Visitação Aberta Hoje', severity: 'high' };
      }
      if (diffStart > 0 && diffStart <= 3) {
           return { label: `Visitação em ${diffStart} dias`, severity: 'medium' };
      }

      return null;
  };

  const upcomingAuctions = auctions.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date + 'T00:00:00');
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      return d >= today;
  });

  const nextAuction = upcomingAuctions.sort((a, b) => {
      const dateA = new Date(a.date + 'T00:00:00').getTime();
      const dateB = new Date(b.date + 'T00:00:00').getTime();
      return dateA - dateB;
  })[0];

  return (
    <div className="space-y-12 animate-fade-in">
        
        {/* Stats Cards - Apenas mostrados na dashboard principal, não na view de histórico */}
        {!isArchiveView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* ... (Cards mantidos igual ao original, omitidos para brevidade se não mudaram, mas aqui incluo o bloco completo para garantir integridade) ... */}
                {/* Card 1: Próximo Evento */}
                <div className="md:col-span-2 bg-accent p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Timer className="w-32 h-32 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between text-primary">
                         <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Calendar className="w-5 h-5 text-white" />
                         </div>
                         <div>
                             <p className="text-primary/70 text-xs font-bold uppercase tracking-widest mb-1">Próximo Leilão</p>
                             {nextAuction ? (
                                 <>
                                    <p className="text-3xl font-serif italic text-white leading-tight truncate drop-shadow-sm">
                                        {formatDate(nextAuction.date)}
                                    </p>
                                    <p className="text-xs text-white/80 mt-1 truncate font-medium">{nextAuction.name}</p>
                                 </>
                             ) : (
                                 <p className="text-3xl font-serif italic text-white/50">
                                    —
                                 </p>
                             )}
                         </div>
                    </div>
                </div>

                {/* Card 2: Lotes Arrematados */}
                <div 
                    onClick={onViewPurchased}
                    className="bg-primary dark:bg-stone-900 p-8 rounded-[2rem] shadow-lg relative overflow-hidden group border border-stone-800 cursor-pointer hover:border-accent transition-colors"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Trophy className="w-32 h-32 text-accent" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 group-hover:border-accent group-hover:bg-accent/10 transition-colors">
                            <Trophy className="w-5 h-5 text-accent" />
                         </div>
                         <div>
                             <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Lotes Arrematados</p>
                             <div className="flex items-end gap-2">
                                <p className="text-5xl font-serif italic text-white">
                                    {purchasedLotsCount}
                                </p>
                                <ArrowRight className="w-5 h-5 text-stone-500 mb-2 group-hover:text-accent transition-colors" />
                             </div>
                         </div>
                    </div>
                </div>

                {/* Card 3: Lotes na Mira */}
                <div 
                    className="bg-stone-100 dark:bg-stone-800 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-700 shadow-sm relative overflow-hidden group cursor-default"
                >
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Crosshair className="w-32 h-32 text-accent" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-900 flex items-center justify-center mb-4 border border-stone-200 dark:border-stone-700">
                            <Crosshair className="w-5 h-5 text-accent" />
                         </div>
                         <div>
                             <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Lotes na Mira</p>
                             <div className="flex items-end gap-2">
                                <p className="text-5xl font-serif italic text-primary dark:text-white">
                                    {targetedLotsCount}
                                </p>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Card 4: Histórico */}
                <div 
                    onClick={onViewArchived}
                    className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-stone-400 dark:hover:border-stone-600 transition-colors"
                >
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Archive className="w-32 h-32 text-stone-500" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center mb-4">
                            <Archive className="w-5 h-5 text-stone-400 dark:text-stone-300" />
                         </div>
                         <div>
                             <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Histórico</p>
                             <div className="flex items-end gap-2">
                                <p className="text-5xl font-serif italic text-primary dark:text-white">
                                    {archivedCount}
                                </p>
                                <ArrowRight className="w-5 h-5 text-stone-300 mb-2 group-hover:text-primary dark:group-hover:text-white transition-colors" />
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Barra de Busca e Filtros --- */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                    type="text" 
                    placeholder="Buscar leilão por nome..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none dark:text-white"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative min-w-[140px]">
                     <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                     <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="w-full pl-10 pr-8 py-2 bg-stone-50 dark:bg-stone-800 border-none rounded-xl text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-accent outline-none dark:text-white"
                     >
                        <option value="Todos">Todos os Tipos</option>
                        <option value="Detran">Detran</option>
                        <option value="Prefeitura">Prefeitura</option>
                        <option value="Financeira">Financeira</option>
                        <option value="Judicial">Judicial</option>
                        <option value="Outros">Outros</option>
                     </select>
                </div>
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="py-2 px-3 bg-stone-50 dark:bg-stone-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent outline-none dark:text-white"
                />
                 {/* Botão Novo Leilão (Mobile/Desktop friendly) */}
                <button 
                    onClick={onCreateAuction}
                    className="bg-primary dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-stone-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Novo</span>
                </button>
            </div>
        </div>

        {/* Lista Filtrada */}
        {filteredAuctions.length === 0 ? (
           /* Estado Vazio */
          <div className="text-center py-24 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 shadow-sm flex flex-col items-center max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center mb-8">
                <Gavel className="w-8 h-8 text-stone-300 dark:text-stone-600" />
            </div>
            <h3 className="text-4xl font-serif italic text-primary dark:text-white mb-4">
                {searchTerm || filterType !== 'Todos' ? 'Nenhum resultado encontrado' : (isArchiveView ? 'Nenhum leilão arquivado' : 'Comece a organizar')}
            </h3>
            {!isArchiveView && !searchTerm && filterType === 'Todos' && (
                <>
                    <p className="text-stone-500 max-w-md mx-auto mb-10 text-lg font-light leading-relaxed">
                        Cadastre o primeiro leilão para começar a organizar seus lotes e controlar seu teto de lances.
                    </p>
                    <button 
                        onClick={onCreateAuction}
                        className="bg-primary dark:bg-black hover:bg-black dark:hover:bg-stone-900 text-white px-10 py-4 rounded-full shadow-lg transition-all flex items-center gap-3 text-sm font-medium tracking-wide uppercase"
                    >
                        <Plus className="w-4 h-4 text-accent" />
                        Novo Leilão
                    </button>
                </>
            )}
          </div>
        ) : (
             /* Grid de Cards */
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredAuctions.map((auction) => {
                const urgency = getUrgencyStatus(auction.date);
                const visitation = formatVisitationRange(auction.visitationStart, auction.visitationEnd);
                const visitationAlert = getVisitationAlert(auction);
                
                return (
                <div
                    key={auction.id}
                    className="group relative flex flex-col bg-white dark:bg-stone-900 rounded-[2rem] p-3 shadow-sm border border-stone-100 dark:border-stone-800 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2"
                    onClick={() => onSelectAuction(auction)}
                >
                    {/* Imagem Container */}
                    <div className="h-64 relative w-full rounded-[1.5rem] overflow-hidden bg-primary dark:bg-black">
                        {auction.bannerImage ? (
                            <>
                                <img 
                                    src={auction.bannerImage} 
                                    alt={auction.name} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Gavel className="w-16 h-16 text-white/10" />
                            </div>
                        )}
                        
                        {/* Tag de Urgência */}
                        {urgency && (
                            <div className={`absolute top-4 left-4 ${urgency.color} px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wider z-10`}>
                                {urgency.icon}
                                {urgency.label}
                            </div>
                        )}
                        
                        {/* Tag de Tipo (NOVO) */}
                        {auction.type && (
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider z-10 border border-white/10">
                                {auction.type}
                            </div>
                        )}

                        {/* Ações Rápidas - Z-Index 30 para garantir clique */}
                        <div className="absolute bottom-4 right-4 flex gap-2 z-30">
                            {/* Botão Arquivar */}
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onArchiveAuction(auction.id); }}
                                className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer ${isArchiveView ? 'hover:bg-green-500' : 'hover:bg-stone-500'}`}
                                title={isArchiveView ? "Desarquivar" : "Finalizar/Arquivar"}
                            >
                                {isArchiveView ? <ArrowUpRight className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditAuction(auction); }}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all cursor-pointer"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAuction(auction.id); }}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Conteúdo Abaixo da Imagem */}
                    <div className="px-4 py-6 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold text-accent uppercase tracking-widest">{formatDate(auction.date)}</span>
                             {auction.siteUrl && <ExternalLink className="w-4 h-4 text-stone-300 dark:text-stone-600" />}
                        </div>
                        
                        <h3 className="font-serif italic text-2xl text-primary dark:text-stone-100 leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">
                            {auction.name}
                        </h3>

                        {/* Alerta de Visitação */}
                        {visitationAlert ? (
                             <div className={`flex items-center justify-between gap-2 text-xs font-bold mb-4 py-2 px-3 rounded-xl animate-pulse ${visitationAlert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800'}`} onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{visitationAlert.label}</span>
                                </div>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        onUpdateAuction({ ...auction, visited: true }); 
                                    }}
                                    className="text-[10px] underline hover:text-black dark:hover:text-white whitespace-nowrap"
                                    title="Marcar como visitado"
                                >
                                    Já fui
                                </button>
                            </div>
                        ) : visitation ? (
                            /* Visitação Normal - Agora com mais destaque em Azul/Indigo */
                            <div className="flex items-center justify-between mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 py-2 px-3 rounded-xl w-full">
                                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide">
                                    <Eye className="w-4 h-4" />
                                    <span>Visitação: {visitation}</span>
                                </div>
                                {auction.visited && (
                                    <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-md shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" /> Visitado
                                    </span>
                                )}
                            </div>
                        ) : null}

                        {/* Info Técnica Minimalista */}
                        <div className="mt-auto pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-[10px] uppercase text-stone-400 dark:text-stone-500 font-bold tracking-wider">Comissão</p>
                                    <p className="text-stone-800 dark:text-stone-300 font-medium">{auction.defaultFeePercent}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase text-stone-400 dark:text-stone-500 font-bold tracking-wider">Taxa Adm.</p>
                                    <p className="text-stone-800 dark:text-stone-300 font-medium">{auction.defaultPatioFeePercent ?? 0}%</p>
                                </div>
                            </div>
                            
                            <div className="w-12 h-12 rounded-full border border-stone-100 dark:border-stone-800 flex items-center justify-center group-hover:bg-primary dark:group-hover:bg-stone-700 group-hover:border-primary dark:group-hover:border-stone-700 transition-all">
                                <ArrowUpRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-accent" />
                            </div>
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        )}
    </div>
  );
};