
import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import { DispositionAction, ReturnRecord } from '../types';
import { Box, RotateCcw, ShieldCheck, Home, Trash2, ArrowUpCircle, ArrowDownCircle, History, Search, Download, Truck } from 'lucide-react';

interface LedgerEntry extends ReturnRecord {
    movementType: 'IN' | 'OUT';
    movementDate?: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Ledger' | DispositionAction>('Ledger');
  const { items, loading } = useData();
  const [filters, setFilters] = useState({ query: '', startDate: '', endDate: '', movementType: 'All' });

  const inventoryData = useMemo(() => {
	    const fullLedger: LedgerEntry[] = [];
	    const activeItems = items.filter(item => item.status !== 'Canceled');
	    activeItems.forEach(item => {
	      // IN movement: when the item is graded (QC done)
	      if (item.dateGraded && item.disposition) { fullLedger.push({ ...item, movementType: 'IN', movementDate: item.dateGraded }); }
	      // OUT movement: when the item is documented (execution done)
	      if (item.dateDocumented && item.disposition) { fullLedger.push({ ...item, movementType: 'OUT', movementDate: item.dateDocumented }); }
	    });
	    fullLedger.sort((a, b) => { const dateA = a.movementDate || '0'; const dateB = b.movementDate || '0'; const dateComparison = dateB.localeCompare(dateA); if (dateComparison !== 0) return dateComparison; if (a.movementType === 'IN' && b.movementType === 'OUT') return -1; if (a.movementType === 'OUT' && b.movementType === 'IN') return 1; return 0; });
	    const calculateStats = (disposition: DispositionAction) => { const relevant = fullLedger.filter(e => e.disposition === disposition); const totalIn = relevant.filter(e => e.movementType === 'IN').reduce((s, e) => s + e.quantity, 0); const totalOut = relevant.filter(e => e.movementType === 'OUT').reduce((s, e) => s + e.quantity, 0); return { totalIn, totalOut, onHand: totalIn - totalOut }; };
	    return { fullLedger, sellableStock: { stats: calculateStats('Restock') }, rtvStock: { stats: calculateStats('RTV') }, claimStock: { stats: calculateStats('Claim') }, internalStock: { stats: calculateStats('InternalUse') }, scrapStock: { stats: calculateStats('Recycle') } };
	  }, [items]);  
  const filteredLedgerList = useMemo(() => {
    let baseList = activeTab === 'Ledger' ? inventoryData.fullLedger : inventoryData.fullLedger.filter(item => item.disposition === activeTab);
    return baseList.filter(item => {
      const q = filters.query.toLowerCase();
      if (q && !item.productName?.toLowerCase().includes(q) && !item.productCode?.toLowerCase().includes(q) && !item.customerName?.toLowerCase().includes(q) && !String(item.branch)?.toLowerCase().includes(q)) return false;
      if (filters.startDate && (item.movementDate || '0') < filters.startDate) return false;
      if (filters.endDate && (item.movementDate || '0') > filters.endDate) return false;
      if (filters.movementType !== 'All' && item.movementType !== filters.movementType) return false;
      return true;
    });
  }, [activeTab, inventoryData.fullLedger, filters]);

  const handleExportExcel = () => { /* ... export logic ... */ };

  const tabs = [
    { id: 'Ledger', label: '1. ประวัติทั้งหมด', icon: History, stats: null },
    { id: 'Restock', label: '2. สินค้าสำหรับขาย', icon: RotateCcw, stats: inventoryData.sellableStock.stats },
    { id: 'RTV', label: '3. สินค้าสำหรับคืน', icon: Truck, stats: inventoryData.rtvStock.stats },
    { id: 'Claim', label: '4. สินค้าสำหรับเคลม', icon: ShieldCheck, stats: inventoryData.claimStock.stats },
    { id: 'InternalUse', label: '5. สินค้าใช้ภายใน', icon: Home, stats: inventoryData.internalStock.stats },
    { id: 'Recycle', label: '6. สินค้าสำหรับทำลาย', icon: Trash2, stats: inventoryData.scrapStock.stats },
  ];

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h2 className="text-2xl font-bold">คลังสินค้า (Inventory)</h2>
      <div className="border-b"><nav className="-mb-px flex space-x-6">{tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500'}`}><tab.icon size={16}/>{tab.label}</button>)}</nav></div>
	      <div className="bg-white p-4 rounded-xl border flex gap-4">
	        <input type="text" placeholder="ค้นหา..." value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} className="w-full p-2 border rounded"/>
	        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="p-2 border rounded"/>
	        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="p-2 border rounded"/>
	        <select value={filters.movementType} onChange={e => setFilters({...filters, movementType: e.target.value})} className="p-2 border rounded">
	          <option value="All">ทุกการเคลื่อนไหว</option>
	          <option value="IN">รับเข้า (IN)</option>
	          <option value="OUT">ส่งออก (OUT)</option>
	        </select>
	      </div>
      <div className="bg-white rounded-xl border flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0"><tr><th className="p-3">วันที่/ประเภท</th><th className="p-3">สินค้า</th><th className="p-3">อ้างอิง</th><th className="p-3">จำนวน</th><th className="p-3">การตัดสินใจ (Decision)</th></tr></thead>
          <tbody>{filteredLedgerList.map(item => (<tr key={item.id + '-' + item.movementType} className="border-t"><td className="p-3">{item.movementDate}<div>{item.movementType}</div></td><td className="p-3">{item.productName}</td><td className="p-3">{item.refNo}</td><td className="p-3">{item.quantity}</td><td className="p-3">{item.disposition}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;
