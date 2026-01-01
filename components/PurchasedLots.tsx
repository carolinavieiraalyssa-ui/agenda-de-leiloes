import React, { useMemo } from 'react';
import { Auction, Lot } from '../types';
import { ArrowLeft, TrendingUp, DollarSign, Calendar, ExternalLink, ArrowUpRight, ArrowDownRight, Package, AlertCircle } from 'lucide-react';

interface PurchasedLotsProps {
  lots: Lot[];
  auctions: Auction[];
  onBack: () => void;
}

export const PurchasedLots: React.FC<PurchasedLotsProps> = ({ lots, auctions, onBack }) => {
  
  // Filtra apenas arrematados
  const purchasedLots = useMemo(() => lots.filter(l => l.status === 'purchased'), [lots]);

  // Função de cálculo financeiro por lote
  const calculateFinancials = (lot: Lot) => {
      const auction = auctions.find(a => a.id === lot.auctionId);
      const feePercent = lot.overrideFeePercent ?? auction?.defaultFeePercent ?? 5;
      const patioPercent = lot.overridePatioFeePercent ?? auction?.defaultPatioFeePercent ?? 0;
      
      const winningBid = lot.winningBid || 0;
      const feesCost = winningBid * ((feePercent + patioPercent) / 100);
      const itemsCost = (lot.items || []).reduce((acc, item) => acc + item.cost, 0);
      
      const totalCost = winningBid + feesCost + itemsCost;
      const sellingPrice = lot.sellingPrice || 0;
      const profit = sellingPrice - totalCost;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return {
          auctionName: auction?.name || 'Leilão Desconhecido',
          auctionDate: auction?.date,
          winningBid,
          totalCost,
          sellingPrice,
          profit,
          roi,
          hasSale: sellingPrice > 0
      };
  };

  // Totais Globais
  const totals = purchasedLots.reduce((acc, lot) => {
      const fin = calculateFinancials(lot);
      return {
          invested: acc.invested + fin.totalCost,
          revenue: acc.revenue + fin.sellingPrice,
          profit: acc.profit + (fin.hasSale ? fin.profit : 0), // Lucro apenas sobre o que foi vendido
          countSold: acc.countSold + (fin.hasSale ? 1 : 0)
      };
  }, { invested: 0, revenue: 0, profit: 0, countSold: 0 });

  const globalRoi = totals.revenue > 0 // ROI global considera custo dos vendidos vs receita dos vendidos (aproximação para dashboard)
    ? (totals.profit / (totals.revenue - totals.profit)) * 100 
    : 0; 

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <div className="animate-fade-in space-y-8">
      
      {/* Header e Navegação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
          <div>
            <button 
                onClick={onBack} 
                className="group flex items-center gap-2 text-sm font-bold text-stone-400 hover:text-primary dark:hover:text-white transition-colors uppercase tracking-widest mb-4"
            >
                <div className="p-1 rounded-full border border-stone-200 dark:border-stone-700 group-hover:border-primary dark:group-hover:border-white transition-colors">
                    <ArrowLeft className="w-3 h-3" />
                </div>
                Voltar para Leilões
            </button>
            <h1 className="text-4xl font-serif italic text-primary dark:text-white">Carteira de Arremates</h1>
          </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign className="w-24 h-24" /></div>
              <div className="relative z-10">
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Total Investido (Custo)</p>
                  <p className="text-3xl font-serif italic">{formatCurrency(totals.invested)}</p>
                  <p className="text-xs text-stone-500 mt-2">{purchasedLots.length} lotes adquiridos</p>
              </div>
          </div>

          <div className="bg-white dark:bg-stone-800 p-6 rounded-[2rem] border border-stone-200 dark:border-stone-700 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5"><TrendingUp className="w-24 h-24 text-green-600" /></div>
              <div className="relative z-10">
                  <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Receita Realizada</p>
                  <p className="text-3xl font-serif italic text-primary dark:text-white">{formatCurrency(totals.revenue)}</p>
                  <p className="text-xs text-stone-400 mt-2">{totals.countSold} lotes vendidos</p>
              </div>
          </div>

          <div className={`p-6 rounded-[2rem] border shadow-sm relative overflow-hidden ${totals.profit >= 0 ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'}`}>
              <div className="relative z-10">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${totals.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Lucro Líquido</p>
                  <p className={`text-3xl font-serif italic ${totals.profit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(totals.profit)}</p>
                  {totals.revenue > 0 && (
                      <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full mt-2 ${totals.profit >= 0 ? 'bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300'}`}>
                          {totals.profit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          ROI Médio: {globalRoi.toFixed(1)}%
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Lista de Lotes */}
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
          {purchasedLots.length === 0 ? (
              <div className="text-center py-20">
                  <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 font-serif italic text-lg">Nenhum lote arrematado ainda.</p>
              </div>
          ) : (
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="border-b border-stone-100 dark:border-stone-800 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">
                              <th className="p-6 font-bold">Lote / Veículo</th>
                              <th className="p-6 font-bold">Leilão de Origem</th>
                              <th className="p-6 font-bold text-right">Custo Total</th>
                              <th className="p-6 font-bold text-right">Venda</th>
                              <th className="p-6 font-bold text-right">Resultado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                          {purchasedLots.map((lot) => {
                              const fin = calculateFinancials(lot);
                              return (
                                  <tr key={lot.id} className="group hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                      <td className="p-6">
                                          <div className="flex items-center gap-4">
                                              {lot.images && lot.images.length > 0 ? (
                                                  <img src={lot.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                                              ) : (
                                                  <div className="w-12 h-12 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                                                      <Package className="w-5 h-5 text-stone-300" />
                                                  </div>
                                              )}
                                              <div>
                                                  <p className="font-bold text-stone-800 dark:text-stone-200">{lot.name}</p>
                                                  <div className="flex gap-2 text-xs text-stone-400 mt-0.5">
                                                      <span>Arremate: {formatCurrency(fin.winningBid)}</span>
                                                      {lot.lotUrl && <a href={lot.lotUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3 hover:text-accent" /></a>}
                                                  </div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-6">
                                          <div className="flex flex-col">
                                              <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{fin.auctionName}</span>
                                              <span className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                                  <Calendar className="w-3 h-3" /> {formatDate(fin.auctionDate)}
                                              </span>
                                          </div>
                                      </td>
                                      <td className="p-6 text-right">
                                          <p className="font-mono text-stone-700 dark:text-stone-300 font-medium">{formatCurrency(fin.totalCost)}</p>
                                      </td>
                                      <td className="p-6 text-right">
                                          {fin.hasSale ? (
                                              <p className="font-mono text-stone-700 dark:text-stone-300 font-medium">{formatCurrency(fin.sellingPrice)}</p>
                                          ) : (
                                              <span className="text-xs font-bold text-stone-400 uppercase bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">Em Estoque</span>
                                          )}
                                      </td>
                                      <td className="p-6 text-right">
                                          {fin.hasSale ? (
                                              <div>
                                                  <p className={`font-mono font-bold ${fin.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                      {formatCurrency(fin.profit)}
                                                  </p>
                                                  <p className={`text-[10px] font-bold ${fin.roi >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                                                      ROI: {fin.roi.toFixed(1)}%
                                                  </p>
                                              </div>
                                          ) : (
                                              <span className="text-stone-300 dark:text-stone-700">-</span>
                                          )}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
    </div>
  );
};