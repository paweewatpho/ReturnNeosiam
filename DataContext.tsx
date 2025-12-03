
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { ref, onValue, set, update, remove, runTransaction, query, orderByChild, equalTo, get } from 'firebase/database';
import { ReturnRecord, NCRItem, NCRRecord } from './types';

// This is the FLATTENED type used by the UI components for easier rendering.
export type FlatNCRRecord = Omit<NCRRecord, 'items'> & { item: NCRItem; id: string; };

interface DataContextType {
  items: ReturnRecord[];
  ncrReports: FlatNCRRecord[]; // UI uses the flattened version
  loading: boolean;
  addReturnRecord: (item: ReturnRecord) => Promise<boolean>;
  updateReturnRecord: (id: string, data: Partial<ReturnRecord>) => Promise<boolean>;
  deleteReturnRecord: (id: string) => Promise<boolean>;
  addNCRReport: (item: NCRRecord) => Promise<boolean>;
  updateNCRReport: (id: string, data: Partial<NCRRecord>) => Promise<boolean>;
  deleteNCRReport: (ncrNo: string) => Promise<boolean>; // Takes ncrNo
  getNextNCRNumber: () => Promise<string>;
}

const DataContext = createContext<DataContextType>({
  items: [], ncrReports: [], loading: true,
  addReturnRecord: async () => false, updateReturnRecord: async () => false, deleteReturnRecord: async () => false,
  addNCRReport: async () => false, updateNCRReport: async () => false, deleteNCRReport: async () => false,
  getNextNCRNumber: async () => 'NCR-ERROR-0000',
});

export const useData = () => useContext(DataContext);

// --- Data Sanitization and Normalization ---

const sanitizeReturnRecord = (item: any): ReturnRecord | null => {
    if (!item || typeof item !== 'object' || !item.id || !item.date) { 
        console.warn("Filtering invalid ReturnRecord:", item);
        return null; 
    }
    return {
        ...item,
        status: ['Requested', 'Received', 'Graded', 'Documented', 'Completed', 'Canceled'].includes(item.status) ? item.status : 'Pending',
        branch: String(item.branch || 'N/A'),
        customerName: String(item.customerName || 'N/A'),
        productName: String(item.productName || 'N/A'),
        productCode: String(item.productCode || 'N/A'),
        quantity: Number(item.quantity) || 0,
        priceBill: Number(item.priceBill) || 0,
        priceSell: Number(item.priceSell) || 0,
        amount: (Number(item.quantity) || 0) * (Number(item.priceBill) || 0),
        reason: String(item.reason || ''),
    };
}

const sanitizeNCRItem = (item: any): NCRItem => {
    const id = item?.id || `item-${Date.now()}-${Math.random()}`;
    return {
        id: String(id),
        branch: String(item?.branch || 'Unknown'),
        refNo: String(item?.refNo || ''),
        neoRefNo: String(item?.neoRefNo || ''),
        productCode: String(item?.productCode || 'N/A'),
        productName: String(item?.productName || 'Unknown Product'),
        customerName: String(item?.customerName || 'Unknown Customer'),
        destinationCustomer: String(item?.destinationCustomer || ''),
        quantity: Number(item?.quantity) || 0,
        unit: String(item?.unit || 'ชิ้น'),
        priceBill: Number(item?.priceBill) || 0,
        expiryDate: String(item?.expiryDate || ''),
        hasCost: !!item?.hasCost,
        costAmount: Number(item?.costAmount) || 0,
        costResponsible: String(item?.costResponsible || ''),
        problemSource: String(item?.problemSource || 'Unknown'),
    };
};

const normalizeAndSanitizeNCRRecord = (report: any): NCRRecord | null => {
    if (!report || typeof report !== 'object' || (!report.id && !report.ncrNo)) { return null; }
    const ncrNo = report.ncrNo || report.id;
    const sanitized: NCRRecord = {
        id: ncrNo, ncrNo: ncrNo,
        date: typeof report.date === 'string' ? report.date : new Date().toISOString().split('T')[0],
        status: ['Open', 'Closed', 'Canceled'].includes(report.status) ? report.status : 'Open',
        toDept: String(report.toDept || 'แผนกควบคุมคุณภาพ'), founder: String(report.founder || ''),
        copyTo: String(report.copyTo || ''), poNo: String(report.poNo || ''),
        problemDetail: String(report.problemDetail || ''),
        problemDamaged: !!report.problemDamaged, problemLost: !!report.problemLost,
        problemMixed: !!report.problemMixed, problemWrongInv: !!report.problemWrongInv,
        problemLate: !!report.problemLate, problemDuplicate: !!report.problemDuplicate,
        problemWrong: !!report.problemWrong, problemIncomplete: !!report.problemIncomplete,
        problemOver: !!report.problemOver, problemWrongInfo: !!report.problemWrongInfo,
        problemShortExpiry: !!report.problemShortExpiry, problemTransportDamage: !!report.problemTransportDamage,
        problemAccident: !!report.problemAccident, problemOther: !!report.problemOther,
        problemOtherText: String(report.problemOtherText || ''),
        actionReject: !!report.actionReject, actionRejectQty: Number(report.actionRejectQty) || 0,
        actionRejectSort: !!report.actionRejectSort, actionRejectSortQty: Number(report.actionRejectSortQty) || 0,
        actionRework: !!report.actionRework, actionReworkQty: Number(report.actionReworkQty) || 0,
        actionReworkMethod: String(report.actionReworkMethod || ''),
        actionSpecialAccept: !!report.actionSpecialAccept, actionSpecialAcceptQty: Number(report.actionSpecialAcceptQty) || 0,
        actionSpecialAcceptReason: String(report.actionSpecialAcceptReason || ''),
        actionScrap: !!report.actionScrap, actionScrapQty: Number(report.actionScrapQty) || 0,
        actionReplace: !!report.actionReplace, actionReplaceQty: Number(report.actionReplaceQty) || 0,
        dueDate: String(report.dueDate || ''), approver: String(report.approver || ''),
        approverPosition: String(report.approverPosition || ''), approverDate: String(report.approverDate || ''),
        causePackaging: !!report.causePackaging, causeTransport: !!report.causeTransport,
        causeOperation: !!report.causeOperation, causeEnv: !!report.causeEnv,
        causeDetail: String(report.causeDetail || ''), preventionDetail: String(report.preventionDetail || ''),
        preventionDueDate: String(report.preventionDueDate || ''), responsiblePerson: String(report.responsiblePerson || ''),
        responsiblePosition: String(report.responsiblePosition || ''), qaAccept: !!report.qaAccept,
        qaReject: !!report.qaReject, qaReason: String(report.qaReason || ''),
        items: {},
    };

    if (report.items && typeof report.items === 'object' && Object.keys(report.items).length > 0) {
        sanitized.items = Object.entries(report.items).reduce((acc, [key, value]) => {
            if (value && typeof value === 'object') {
                const sanitizedItem = sanitizeNCRItem(value);
                acc[sanitizedItem.id || key] = sanitizedItem;
            }
            return acc;
        }, {} as Record<string, NCRItem>);
    } else if (report.productCode || report.productName) {
        // Backward compatibility: Create `items` from flat structure
        const legacyItem = sanitizeNCRItem(report);
        sanitized.items = { [legacyItem.id]: legacyItem };
    }
    
    // If after all that, there are no valid items, discard the record.
    if (Object.keys(sanitized.items).length === 0) { 
      console.warn("Discarding NCR record with no valid items:", report);
      return null; 
    }
    return sanitized;
}


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ReturnRecord[]>([]);
  const [ncrReports, setNcrReports] = useState<FlatNCRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const returnRef = ref(db, 'return_records');
    const unsubReturn = onValue(returnRef, (snapshot) => {
      const data = snapshot.val();
      const loadedItems = data ? Object.values(data).map(sanitizeReturnRecord).filter(Boolean) as ReturnRecord[] : [];
      setItems(loadedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
      console.log(`✅ RTDB: Synced ${loadedItems.length} return records.`);
    }, (error) => {
      console.warn("RTDB Permission/Connection Error (Returns). App will be in read-only mode.", error.message);
      setItems([]); setLoading(false);
    });

    const ncrRef = ref(db, 'ncr_reports');
    const unsubNCR = onValue(ncrRef, (snapshot) => {
        const data = snapshot.val();
        const rawReports = data ? Object.values(data) : [];
        const normalized = rawReports.map(normalizeAndSanitizeNCRRecord).filter(Boolean) as NCRRecord[];
        
        // Flatten the normalized data for UI consumption
        const flattened = normalized.flatMap(report => 
            Object.values(report.items).map(item => ({
              ...report, 
              item: item, // The specific item for this row
              id: `${report.ncrNo}-${item.id}` // A unique ID for React key
            }))
        );
        setNcrReports(flattened.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        console.log(`✅ RTDB: Synced and normalized ${flattened.length} NCR items.`);
    }, (error) => {
        console.warn("RTDB Permission/Connection Error (NCR). App will be in read-only mode.", error.message);
        setNcrReports([]);
    });

    return () => { unsubReturn(); unsubNCR(); };
  }, []);

  const addReturnRecord = async (item: ReturnRecord): Promise<boolean> => { try { await set(ref(db, 'return_records/' + item.id), item); return true; } catch (e: any) { console.error("RTDB Write Error:", e); alert("Error saving return record: " + e.message); return false; } };
  const updateReturnRecord = async (id: string, data: Partial<ReturnRecord>): Promise<boolean> => { try { await update(ref(db, 'return_records/' + id), data); return true; } catch (e: any) { console.error("RTDB Write Error:", e); alert("Error updating return record: " + e.message); return false; } };
  const deleteReturnRecord = async (id: string): Promise<boolean> => { try { await remove(ref(db, 'return_records/' + id)); return true; } catch (e: any) { console.error("RTDB Write Error:", e); alert("Error deleting return record: " + e.message); return false; } };
  
  const addNCRReport = async (item: NCRRecord): Promise<boolean> => { try { await set(ref(db, `ncr_reports/${item.ncrNo}`), item); return true; } catch (e: any) { console.error("RTDB Write Error:", e); alert("Error saving NCR report: " + e.message); return false; } };
  const updateNCRReport = async (ncrNo: string, data: Partial<NCRRecord>): Promise<boolean> => { try { await update(ref(db, `ncr_reports/${ncrNo}`), data); return true; } catch (e: any) { console.error("RTDB Write Error:", e); alert("Error updating NCR report: " + e.message); return false; } };

  const deleteNCRReport = async (ncrNo: string): Promise<boolean> => {
    try {
	      const updates: { [key: string]: any } = {};
	      updates[`ncr_reports/${ncrNo}/status`] = 'Canceled';
	
	      // 1. Find all ReturnRecords linked to this NCR
	      const returnRecordsQuery = query(ref(db, 'return_records'), orderByChild('ncrNumber'), equalTo(ncrNo));
	      const snapshot = await get(returnRecordsQuery);
	      
	      if (snapshot.exists()) {
	        snapshot.forEach((childSnapshot) => {
	          // 2. Mark the linked ReturnRecord as 'Canceled'
	          updates[`return_records/${childSnapshot.key}/status`] = 'Canceled';
	          // 3. Crucially, remove the disposition and QC dates to ensure it's not counted in Inventory
	          updates[`return_records/${childSnapshot.key}/disposition`] = null;
	          updates[`return_records/${childSnapshot.key}/dateGraded`] = null;
	          updates[`return_records/${childSnapshot.key}/dateDocumented`] = null;
	          updates[`return_records/${childSnapshot.key}/dateCompleted`] = null;
	        });
	      }
      
      await update(ref(db), updates);
      return true;
    } catch (error) {
      console.error("Error canceling NCR report:", error);
      return false;
    }
  };

  const getNextNCRNumber = async (): Promise<string> => {
    const counterRef = ref(db, 'counters/ncr_counter');
    try {
        const result = await runTransaction(counterRef, (currentData) => {
            if (currentData === null) { return { year: new Date().getFullYear(), count: 1 }; }
            const currentYear = new Date().getFullYear();
            if (currentData.year !== currentYear) { return { year: currentYear, count: 1 }; }
            currentData.count = (Number(currentData.count) || 0) + 1;
            return currentData;
        });
        if (result.committed) {
            const data = result.snapshot.val();
            return `NCR-${data.year}-${String(data.count).padStart(4, '0')}`;
        } else { return 'NCR-ERR-TRANSACTION'; }
    } catch (error) { console.error("Transaction failed: ", error); return 'NCR-ERR-DATABASE'; }
  };
  
  return (
    <DataContext.Provider value={{ items, ncrReports, loading, addReturnRecord, updateReturnRecord, deleteReturnRecord, addNCRReport, updateNCRReport, deleteNCRReport, getNextNCRNumber }}>
      {children}
    </DataContext.Provider>
  );
};
