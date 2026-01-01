export type AuctionType = 'Detran' | 'Prefeitura' | 'Financeira' | 'Judicial' | 'Outros';

export interface Auction {
  id: string;
  userId?: string; // Vinculo com o usuário do Supabase
  name: string;
  date: string;
  budget: number; // Orçamento total/Teto global do leilão
  type?: AuctionType; // Categoria do leilão para filtro
  defaultFeePercent: number; // Taxa padrão do leiloeiro (ex: 5%)
  defaultPatioFeePercent: number; // Taxa padrão de pátio (ex: 2%)
  description?: string;
  color?: string; // Cor de destaque (classe tailwind ou hex)
  bannerImage?: string; // Imagem de capa em base64
  visitationStart?: string; // Data inicio visitação
  visitationEnd?: string; // Data fim visitação
  siteUrl?: string; // Link direto para o site do leilão
  visited?: boolean; // Controle se o usuário já realizou a visitação
  status?: 'active' | 'archived'; // Controle se o leilão está ativo ou finalizado
}

export interface LotItem {
  id: string;
  name: string;
  cost: number;
  checked: boolean;
  observation?: string; // Observações extras (marca, modelo, link, etc)
}

export interface Lot {
  id: string;
  auctionId: string;
  name: string;
  description: string;
  images: string[]; // Lista de imagens em base64
  maxBidLimit: number; // Campo mantido para compatibilidade, mas não será mais usado como input principal
  initialBidValue?: number; // Valor de abertura do lote
  fipeValue?: number; // Valor de mercado / FIPE
  bidIncrement?: number; // Valor mínimo de incremento
  currentEstimatedBid: number; // Valor base para cálculo
  overrideFeePercent?: number; // Taxa específica deste lote se diferente do leilão
  overridePatioFeePercent?: number; // Taxa específica de pátio deste lote
  items?: LotItem[]; // Lista de peças/custos extras
  status?: 'pending' | 'purchased' | 'lost'; // Status do lote
  winningBid?: number; // Valor pelo qual o lote foi efetivamente arrematado
  lotUrl?: string; // Link direto para a página do lote
  sellingPrice?: number; // Valor de venda (previsto ou realizado)
  visited?: boolean; // Controle se o lote específico foi vistoriado
}

export interface CalculationResult {
  bidAmount: number;
  feeAmount: number;
  patioFeeAmount: number;
  totalCost: number;
  isOverLimit: boolean;
}