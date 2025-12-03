

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  role: string;
  duties: string;
  branches?: string[];
  isBranchParent?: boolean;
}

export interface ReturnStat {
  name: string;
  value: number;
  color: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  OPERATIONS = 'OPERATIONS',
  NCR = 'NCR',
  NCR_REPORT = 'NCR_REPORT',
  INVENTORY = 'INVENTORY',
  STOCK_SUMMARY = 'STOCK_SUMMARY'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export type ReturnStatus = 'Pending' | 'Requested' | 'Received' | 'Approved' | 'Graded' | 'Documented' | 'Completed' | 'Rejected' | 'Canceled';

export type ItemCondition = 
  | 'New' 
  | 'OpenBox' 
  | 'Damaged' 
  | 'Defective' 
  | 'Expired'
  | 'Unknown' 
  | 'BoxDamage'
  | 'WetBox'
  | 'LabelDefect'
  | string;

export type DispositionAction = 'Restock' | 'RTV' | 'InternalUse' | 'Recycle' | 'Claim' | 'Pending';
export type BranchName = 'พิษณุโลก' | 'กำแพงเพชร' | 'แม่สอด' | 'เชียงใหม่' | 'EKP ลำปาง' | 'นครสวรรค์';

export interface ReturnRecord {
  id: string;
  refNo: string;
  branch: BranchName | string;
  customerName: string;
  productCode: string;
  productName: string;
  category: string;
  date: string;
  amount: number;
  neoRefNo?: string;
  destinationCustomer?: string;
  dateRequested?: string;
  dateReceived?: string;
  dateGraded?: string;
  dateDocumented?: string;
  dateCompleted?: string;
  quantity: number;
  unit: string;
  priceBill: number;
  priceSell: number;
  expiryDate?: string;
  status: ReturnStatus;
  reason: string;
  condition?: ItemCondition;
  disposition?: DispositionAction;
  notes?: string;
  problemType?: string;
  rootCause?: string;
  ncrNumber?: string;
  actionReject?: boolean;
  actionRejectQty?: number;
  actionRejectSort?: boolean;
  actionRejectSortQty?: number;
  actionRework?: boolean;
  actionReworkQty?: number;
  actionReworkMethod?: string;
  actionSpecialAcceptance?: boolean;
  actionSpecialAcceptanceQty?: number;
  actionSpecialAcceptanceReason?: string;
  actionScrap?: boolean;
  actionScrapQty?: number;
  actionScrapReplace?: boolean;
  actionScrapReplaceQty?: number;
  dispositionRoute?: string;
  sellerName?: string;
  contactPhone?: string;
  internalUseDetail?: string;
  claimCompany?: string;
  claimCoordinator?: string;
  claimPhone?: string;
}

// Fix: Add and export NCRItem interface for use throughout the application.
export interface NCRItem {
  id: string;
  branch: string;
  refNo: string;
  neoRefNo: string;
  productCode: string;
  productName: string;
  customerName: string;
  destinationCustomer: string;
  quantity: number;
  unit: string;
  priceBill: number;
  expiryDate: string;
  hasCost: boolean;
  costAmount: number;
  costResponsible: string;
  problemSource: string;
}

// Fix: Add and export NCRRecord interface for use throughout the application.
export interface NCRRecord {
  id: string;
  ncrNo: string;
  date: string;
  status: 'Open' | 'Closed' | 'Canceled';
  toDept: string;
  copyTo: string;
  founder: string;
  poNo: string;
  items: Record<string, NCRItem>;
  problemDetail: string;
  problemDamaged?: boolean;
  problemLost?: boolean;
  problemMixed?: boolean;
  problemWrongInv?: boolean;
  problemLate?: boolean;
  problemDuplicate?: boolean;
  problemWrong?: boolean;
  problemIncomplete?: boolean;
  problemOver?: boolean;
  problemWrongInfo?: boolean;
  problemShortExpiry?: boolean;
  problemTransportDamage?: boolean;
  problemAccident?: boolean;
  problemOther?: boolean;
  problemOtherText?: string;
  actionReject?: boolean;
  actionRejectQty?: number;
  actionRejectSort?: boolean;
  actionRejectSortQty?: number;
  actionRework?: boolean;
  actionReworkQty?: number;
  actionReworkMethod?: string;
  actionSpecialAccept?: boolean;
  actionSpecialAcceptQty?: number;
  actionSpecialAcceptReason?: string;
  actionScrap?: boolean;
  actionScrapQty?: number;
  actionReplace?: boolean;
  actionReplaceQty?: number;
  dueDate?: string;
  approver?: string;
  approverPosition?: string;
  approverDate?: string;
  causePackaging?: boolean;
  causeTransport?: boolean;
  causeOperation?: boolean;
  causeEnv?: boolean;
  causeDetail?: string;
  preventionDetail?: string;
  preventionDueDate?: string;
  responsiblePerson?: string;
  responsiblePosition?: string;
  qaAccept?: boolean;
  qaReject?: boolean;
  qaReason?: string;
}

export interface SearchFilters {
  startDate: string;
  endDate: string;
  status: ReturnStatus | 'All';
  category: string;
  query: string;
}