import React, { useState, useEffect } from 'react';
import { Calculator as CalcIcon, AlertCircle, CheckCircle, ArrowDown } from 'lucide-react';

interface CalculatorProps {
  baseFeePercent: number;
  basePatioFeePercent: number;
  maxLimit: number;
  initialBid?: number;
  onClose?: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ baseFeePercent, basePatioFeePercent, maxLimit, initialBid = 0 }) => {
  // bidInput armazenará apenas os dígitos (ex: "500000" para 5.000,00)
  const [bidRaw, setBidRaw] = useState<string>(initialBid > 0 ? (initialBid * 100).toFixed(0) : '');
  const [feePercent, setFeePercent] = useState<number>(baseFeePercent);
  const [patioFeePercent, setPatioFeePercent] = useState<number>(basePatioFeePercent);

  // Formata o valor visualmente para o usuário
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setBidRaw(raw);
  };

  // Cálculos
  const bidAmount = bidRaw ? parseInt(bidRaw) / 100 : 0;
  const feeAmount = bidAmount * (feePercent / 100);
  const patioAmount = bidAmount * (patioFeePercent / 100);
  const total = bidAmount + feeAmount + patioAmount;
  const isOver = maxLimit > 0 && total > maxLimit;

  // Função para calcular o lance máximo permitido dado o teto (Engenharia reversa)
  // Total = Bid * (1 + fee + patio)  =>  Bid = Total / (1 + fee + patio)
  const calculateMaxBidForLimit = () => {
    if (maxLimit <= 0) return;
    const totalRate = 1 + (feePercent / 100) + (patioFeePercent / 100);
    const maxBid = maxLimit / totalRate;
    // Arredonda para baixo para garantir que não passe 1 centavo
    setBidRaw((Math.floor(maxBid * 100)).toString());
  };

  return (
    <div className="bg-slate-50 dark:bg-stone-900 p-4 rounded-lg border border-slate-200 dark:border-stone-700 mt-4 shadow-inner animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-stone-300 font-semibold text-sm">
            <CalcIcon className="w-4 h-4" />
            <span>Simulador de Custos</span>
        </div>
        {maxLimit > 0 && (
            <button 
                onClick={calculateMaxBidForLimit}
                className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
                title="Calcular lance máximo para não estourar o teto"
            >
                <ArrowDown className="w-3 h-3" />
                Ajustar ao Teto
            </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-stone-400 mb-1">Valor do Lance (Arremate)</label>
          <input
            type="text"
            inputMode="numeric"
            value={bidRaw ? (parseInt(bidRaw)/100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
            onChange={handleBidChange}
            className="w-full p-2 border border-slate-300 dark:border-stone-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent outline-none font-mono text-slate-800 dark:text-white bg-white dark:bg-stone-800 text-lg font-bold placeholder:text-slate-300"
            placeholder="R$ 0,00"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-stone-400 mb-1">Taxa Leiloeiro (%)</label>
            <input
                type="number"
                value={feePercent}
                onChange={(e) => setFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 dark:border-stone-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-center bg-white dark:bg-stone-800 dark:text-white"
            />
            </div>
            <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-stone-400 mb-1">Taxa Pátio (%)</label>
            <input
                type="number"
                value={patioFeePercent}
                onChange={(e) => setPatioFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 dark:border-stone-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent outline-none text-center bg-white dark:bg-stone-800 dark:text-white"
            />
            </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-stone-700 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-stone-400">Leiloeiro ({feePercent}%):</span>
          <span className="font-medium text-slate-700 dark:text-stone-200">
            {formatCurrency(feeAmount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-stone-400">Pátio ({patioFeePercent}%):</span>
          <span className="font-medium text-slate-700 dark:text-stone-200">
            {formatCurrency(patioAmount)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-slate-200 dark:border-stone-700 pt-2 mt-2">
          <span className="text-slate-800 dark:text-white">Custo Total:</span>
          <span className={`transition-colors ${isOver ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-stone-100'}`}>
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {maxLimit > 0 && (
        <div className={`mt-3 flex items-start gap-2 text-xs p-2 rounded transition-colors ${isOver ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
          {isOver ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold">{isOver ? 'ACIMA DO SEU TETO' : 'DENTRO DO ORÇAMENTO'}</p>
            <p>Seu limite é {formatCurrency(maxLimit)}.</p>
          </div>
        </div>
      )}
    </div>
  );
};