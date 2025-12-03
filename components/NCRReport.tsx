


import React, { useState, useMemo } from 'react';
// Fix: Import NCR types from the centralized types file.
import { useData, FlatNCRRecord } from '../DataContext';
import { ReturnRecord, ReturnStatus, NCRRecord, NCRItem } from '../types';
import { FileText, ArrowRight, CheckCircle, Clock, Eye, Edit, Lock, Trash2, Search, Download, X, Save, XCircle } from 'lucide-react';
// Fix: NCRForm is a default export.
import NCRForm from './NCRForm'; // Import the shared form component

const getReturnStatusBadge = (status?: ReturnStatus) => {
    if (!status) { return <span className="text-slate-400 text-xs">-</span>; }
    const config = { 'Requested': { text: 'รอรับเข้า', color: 'bg-slate-100 text-slate-600' }, 'Received': { text: 'รอ QC', color: 'bg-amber-100 text-amber-700' }, 'Graded': { text: 'รอเอกสาร', color: 'bg-blue-100 text-blue-700' }, 'Documented': { text: 'รอปิดงาน', color: 'bg-purple-100 text-purple-700' }, 'Completed': { text: 'จบงาน', color: 'bg-green-100 text-green-700' }, 'Canceled': { text: 'ยกเลิก', color: 'bg-red-100 text-red-600' }}[status];
    if (!config) { return <span className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100">{status}</span>; }
    return <span className={`px-2 py-1 text-[10px] font-bold rounded ${config.color}`}>{config.text}</span>;
};

interface NCRReportProps {
  onTransfer: (data: Partial<ReturnRecord>) => void;
}

const NCRReport: React.FC<NCRReportProps> = ({ onTransfer }) => {
  const { ncrReports, items, updateNCRReport, deleteNCRReport } = useData();
  
  const [showNCRFormModal, setShowNCRFormModal] = useState(false);
  const [ncrFormState, setNcrFormState] = useState<Partial<NCRRecord>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'delete', ncrNo: string } | null>(null);
  const [filters, setFilters] = useState({ query: '', startDate: '', endDate: '' });

  const filteredNcrReports = useMemo(() => {
    return ncrReports.filter(report => {
      if (filters.startDate && report.date < filters.startDate) return false;
      if (filters.endDate && report.date > filters.endDate) return false;
      const queryLower = filters.query.toLowerCase();
      if (queryLower && !report.ncrNo?.toLowerCase().includes(queryLower) && !report.item.productName?.toLowerCase().includes(queryLower) && !report.item.customerName?.toLowerCase().includes(queryLower)) { return false; }
      return true;
    });
  }, [ncrReports, filters]);

  const handleExportExcel = () => { /* ... export logic ... */ };
  
  const handleCreateReturn = (ncr: FlatNCRRecord) => {
    const returnData: Partial<ReturnRecord> = { ncrNumber: ncr.ncrNo, branch: ncr.item.branch, date: ncr.date, productName: ncr.item.productName, productCode: ncr.item.productCode, customerName: ncr.item.customerName, quantity: ncr.item.quantity, unit: ncr.item.unit, refNo: ncr.item.refNo, neoRefNo: ncr.item.neoRefNo, destinationCustomer: ncr.item.destinationCustomer, reason: `จาก NCR: ${ncr.problemDetail}`, };
    onTransfer(returnData);
  };
  
  const handleActionClick = (type: 'edit' | 'delete', ncrNo: string) => { setPendingAction({ type, ncrNo }); setPasswordInput(''); setShowPasswordModal(true); };
  
  const handleVerifyPassword = async () => {
    if (passwordInput !== '1234') { alert('รหัสผ่านไม่ถูกต้อง'); return; }
    if (pendingAction) {
      if (pendingAction.type === 'edit') {
	        // The ncrReports state is FLATTENED. We need to find the full, unflattened NCR record.
	        // Since we don't have the unflattened data, we must reconstruct it from the flattened view.
	        const allItemsForNcr = ncrReports.filter(r => r.ncrNo === pendingAction.ncrNo);
	        if (allItemsForNcr.length > 0) {
	            const firstRecord = allItemsForNcr[0];
	            const itemsRecord = allItemsForNcr.reduce((acc, r) => { acc[r.item.id] = r.item; return acc; }, {} as Record<string, NCRItem>);
	            const { item, ...mainData } = firstRecord;
	            setNcrFormState({ ...mainData, items: itemsRecord });
	            setIsEditMode(true);
	            setShowNCRFormModal(true);
	        }
      } else if (pendingAction.type === 'delete') {
        await deleteNCRReport(pendingAction.ncrNo);
        alert(`ยกเลิกเอกสาร NCR ${pendingAction.ncrNo} สำเร็จ`);
      }
    }
    setShowPasswordModal(false);
    setPendingAction(null);
  };

  const handleViewClick = (ncrNo: string) => {
	    // The ncrReports state is FLATTENED. We need to find the full, unflattened NCR record.
	    // Since we don't have the unflattened data, we must reconstruct it from the flattened view.
	    const allItemsForNcr = ncrReports.filter(r => r.ncrNo === ncrNo);
	    if (allItemsForNcr.length > 0) {
	        const firstRecord = allItemsForNcr[0];
	        const itemsRecord = allItemsForNcr.reduce((acc, r) => { acc[r.item.id] = r.item; return acc; }, {} as Record<string, NCRItem>);
	        const { item, ...mainData } = firstRecord;
	        setNcrFormState({ ...mainData, items: itemsRecord });
	        setIsEditMode(false);
	        setShowNCRFormModal(true);
	    }
  };

  const handleSaveChanges = async () => {
    if (!ncrFormState.ncrNo) return;
    const success = await updateNCRReport(ncrFormState.ncrNo, ncrFormState);
    if(success){ alert('บันทึกการแก้ไขเรียบร้อย'); setShowNCRFormModal(false); }
    else { alert('เกิดข้อผิดพลาดในการบันทึก'); }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <h2 className="text-2xl font-bold">รายงาน NCR</h2>
      <div className="bg-white p-4 rounded-xl border flex gap-4">
        <input type="text" placeholder="ค้นหา..." value={filters.query} onChange={e => setFilters({...filters, query: e.target.value})} className="w-full p-2 border rounded"/>
        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="p-2 border rounded"/>
        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="p-2 border rounded"/>
      </div>
      <div className="bg-white rounded-xl border flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0"><tr><th className="p-3">เลขที่ NCR</th><th className="p-3">สินค้า</th><th className="p-3">ลูกค้า</th><th className="p-3">สถานะการคืน</th><th className="p-3">จัดการ</th></tr></thead>
          <tbody>
            {filteredNcrReports.map((report) => {
              const correspondingReturn = items.find(item => item.ncrNumber === report.ncrNo && item.productCode === report.item.productCode);
              const isCanceled = report.status === 'Canceled';
              return (
                <tr key={report.id} className={`border-t ${isCanceled ? 'line-through text-slate-400' : ''}`}>
                  <td className="p-3"><b>{report.ncrNo}</b><br/>{report.date}</td>
                  <td className="p-3">{report.item.productName}<br/><small>{report.item.productCode}</small></td>
                  <td className="p-3">{report.item.customerName}</td>
                  <td className="p-3">{getReturnStatusBadge(correspondingReturn?.status)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleViewClick(report.ncrNo)} disabled={isCanceled} className="p-1 text-slate-500 disabled:opacity-30"><Eye size={16}/></button>
                      <button onClick={() => handleActionClick('edit', report.ncrNo)} disabled={isCanceled} className="p-1 text-amber-500 disabled:opacity-30"><Edit size={16}/></button>
                      <button onClick={() => handleActionClick('delete', report.ncrNo)} disabled={isCanceled} className="p-1 text-red-500 disabled:opacity-30"><Trash2 size={16}/></button>
                      {!isCanceled && !correspondingReturn && (report.actionReject || report.actionRejectSort) && <button onClick={() => handleCreateReturn(report)} className="p-1 bg-orange-500 text-white rounded"><ArrowRight size={16}/></button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {showPasswordModal && ( <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-80"><h3 className="font-bold mb-4">Password Required</h3><input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-2 border rounded mb-4" autoFocus onKeyDown={e => e.key === 'Enter' && handleVerifyPassword()} /><div className="flex justify-end gap-2"><button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 border rounded">Cancel</button><button onClick={handleVerifyPassword} className="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button></div></div></div> )}
      {showNCRFormModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
	            <div className="p-4 border-b flex justify-between items-center">
	              <h3 className="font-bold text-lg">{isEditMode ? 'Edit NCR' : 'View NCR'}: {ncrFormState.ncrNo}</h3>
	              <button onClick={() => setShowNCRFormModal(false)}><X/></button>
	            </div>
	            <div className="overflow-auto flex-1">
	              <NCRForm
	                formData={ncrFormState}
	                setFormData={setNcrFormState}
	                isEditMode={isEditMode}
	                ncrItems={Object.values(ncrFormState.items || {}).filter(Boolean) as NCRItem[]}
	              />
	            </div>
            {isEditMode && <div className="p-4 border-t flex justify-end"><button onClick={handleSaveChanges} className="px-4 py-2 bg-green-600 text-white rounded">Save Changes</button></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NCRReport;