


import React, { useState, useEffect } from 'react';
// Fix: Import NCR types from the centralized types file.
import { useData } from '../DataContext';
import { BRANCH_LIST, RETURN_ROUTES } from '../constants';
import { ReturnRecord, ItemCondition, DispositionAction, NCRRecord, NCRItem } from '../types';
import { Scan, Box, Truck, RotateCcw, Trash2, Home, CheckCircle, ArrowRight, ClipboardList, PlusCircle, Save, Clock, Search, AlertCircle, XCircle, Edit3, ShieldCheck, User, Phone, Briefcase, Building2, Printer, FileText, X, PenTool, CheckSquare, Square, AlertTriangle, HelpCircle, Settings, Wrench, Package, Filter, LayoutGrid, FileInput, Check, MapPin, Activity, Inbox, Loader, Plus } from 'lucide-react';
import { getDispositionBadge, ThaiBahtText } from '../utils';

interface OperationsProps {
  initialData?: Partial<ReturnRecord> | null;
  onClearInitialData?: () => void;
}

const Operations: React.FC<OperationsProps> = ({ initialData, onClearInitialData }) => {
  const { items, addReturnRecord, updateReturnRecord, addNCRReport, getNextNCRNumber } = useData();
  
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [requestItems, setRequestItems] = useState<Partial<ReturnRecord>[]>([]);
  const initialItemState: Partial<ReturnRecord> = { productCode: '', productName: '', quantity: 1, unit: 'ชิ้น', priceBill: 0, priceSell: 0, expiryDate: '', notes: '', };
  const [currentItem, setCurrentItem] = useState<Partial<ReturnRecord>>(initialItemState);
  const [headerData, setHeaderData] = useState({ branch: 'พิษณโลก', date: new Date().toISOString().split('T')[0], customerName: '', refNo: '', neoRefNo: '', destinationCustomer: '', autoCreateNCR: false, });
  const [qcSelectedItem, setQcSelectedItem] = useState<ReturnRecord | null>(null);
  const [step4SelectedIds, setStep4SelectedIds] = useState<Set<string>>(new Set());
  
	  useEffect(() => {
	    if (initialData && onClearInitialData) {
	      setHeaderData(prev => ({
	        ...prev,
	        branch: initialData.branch || prev.branch,
	        customerName: initialData.customerName || prev.customerName,
	        refNo: initialData.refNo || prev.refNo,
	        neoRefNo: initialData.neoRefNo || prev.neoRefNo,
	        destinationCustomer: initialData.destinationCustomer || prev.destinationCustomer,
	      }));
	      setRequestItems(initialData.productCode ? [{ ...initialItemState, ...initialData }] : []);
	      setActiveStep(1);
	      onClearInitialData();
	    }
	  }, [initialData, onClearInitialData]);
	  
	  // ... other states and handlers from the original file ...

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestItems.length === 0) { alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"); return; }
    if (!headerData.customerName || !headerData.refNo) { alert("กรุณากรอก ชื่อลูกค้า และ เลขที่อ้างอิง"); return; }
    setIsSaving(true);
    let successCount = 0;
    for (const item of requestItems) {
      const newItem: ReturnRecord = { ...headerData, ...item, id: `RT-${Date.now()}-${Math.random()}`, status: 'Requested', dateRequested: headerData.date } as ReturnRecord;
      const success = await addReturnRecord(newItem);
      if (success) successCount++;
    }
    setIsSaving(false);
    if (successCount === requestItems.length) {
      alert(`บันทึกคำขอคืน ${successCount} รายการ สำเร็จ!`);
      setHeaderData({ branch: 'พิษณโลก', date: new Date().toISOString().split('T')[0], customerName: '', refNo: '', neoRefNo: '', destinationCustomer: '', autoCreateNCR: false, });
      setRequestItems([]);
    } else {
      alert(`บันทึกสำเร็จ ${successCount} จาก ${requestItems.length} รายการ`);
    }
  };

  const handleIntakeReceive = async (id: string) => { await updateReturnRecord(id, { status: 'Received', dateReceived: new Date().toISOString().split('T')[0] }); };
	  const handleQCSubmit = async () => { if(qcSelectedItem && qcSelectedItem.condition && qcSelectedItem.disposition) { await updateReturnRecord(qcSelectedItem.id, { condition: qcSelectedItem.condition, disposition: qcSelectedItem.disposition, qcNotes: qcSelectedItem.qcNotes, status: 'Graded', dateGraded: new Date().toISOString().split('T')[0] }); setQcSelectedItem(null); } };
  const handleConfirmStep4Items = async () => { if (step4SelectedIds.size === 0) return; for (const id of step4SelectedIds) { await updateReturnRecord(id, { status: 'Documented', dateDocumented: new Date().toISOString().split('T')[0] }); } setStep4SelectedIds(new Set()); setActiveStep(5); };
  const handleCompleteJob = async (id: string) => { await updateReturnRecord(id, { status: 'Completed', dateCompleted: new Date().toISOString().split('T')[0] }); };
  const toggleStep4Selection = (id: string) => { const newSet = new Set(step4SelectedIds); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); setStep4SelectedIds(newSet); };
  
  const requestedItems = items.filter(i => i.status === 'Requested');
  const receivedItems = items.filter(i => i.status === 'Received');
  const gradedItems = items.filter(i => i.status === 'Graded'); 
  const documentedItems = items.filter(i => i.status === 'Documented');
  const completedItems = items.filter(i => i.status === 'Completed');

  return (
    <div className="h-full flex flex-col bg-white relative">
      <div className="border-b px-6 pt-4 bg-white shadow-sm z-10">
        <div className="flex gap-2 overflow-x-auto">
          {['แจ้งคืน (Request)', 'รับสินค้าเข้า (Intake)', 'ตรวจสอบคุณภาพ (QC)', 'ดำเนินการ (Execution)', 'ปิดงาน/รับคืนเรียบร้อย'].map((label, index) => (
            <button key={index} onClick={() => setActiveStep(index + 1 as any)} className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 ${activeStep === index + 1 ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeStep === index + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>{index + 1}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-slate-50/50">
	        {activeStep === 1 && (
	            <div className="h-full overflow-auto p-6">
	                <h3 className="text-xl font-bold mb-4">1. แจ้งคืน (Request)</h3>
	                <form onSubmit={handleRequestSubmit} className="space-y-6">
	                    <div className="grid grid-cols-2 gap-4">
	                        <div><label className="block text-sm font-medium">สาขา</label><select value={headerData.branch} onChange={e => setHeaderData({...headerData, branch: e.target.value})} className="w-full p-2 border rounded-lg">{BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
	                        <div><label className="block text-sm font-medium">วันที่</label><input type="date" value={headerData.date} onChange={e => setHeaderData({...headerData, date: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                        <div><label className="block text-sm font-medium">ชื่อลูกค้า</label><input type="text" value={headerData.customerName} onChange={e => setHeaderData({...headerData, customerName: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
	                        <div><label className="block text-sm font-medium">เลขที่อ้างอิง (Ref No.)</label><input type="text" value={headerData.refNo} onChange={e => setHeaderData({...headerData, refNo: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
	                        <div><label className="block text-sm font-medium">เลขที่อ้างอิง Neo (Neo Ref No.)</label><input type="text" value={headerData.neoRefNo} onChange={e => setHeaderData({...headerData, neoRefNo: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                        <div><label className="block text-sm font-medium">ลูกค้าปลายทาง</label><input type="text" value={headerData.destinationCustomer} onChange={e => setHeaderData({...headerData, destinationCustomer: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                    </div>
	                    <div className="flex items-center gap-2"><input type="checkbox" id="autoCreateNCR" checked={headerData.autoCreateNCR} onChange={e => setHeaderData({...headerData, autoCreateNCR: e.target.checked})} className="w-4 h-4"/><label htmlFor="autoCreateNCR" className="text-sm font-medium">สร้าง NCR อัตโนมัติหากมีปัญหา</label></div>
	                    <h4 className="text-lg font-bold mt-6">รายการสินค้า ({requestItems.length})</h4>
	                    <div className="space-y-2">
	                        {requestItems.map((item, index) => (<div key={index} className="p-3 border rounded-lg bg-white flex justify-between items-center"><div className="flex-1"><p className="font-bold">{item.productName || 'No Name'}</p><p className="text-sm text-slate-500">{item.productCode} - {item.quantity} {item.unit}</p></div><button type="button" onClick={() => setRequestItems(requestItems.filter((_, i) => i !== index))} className="text-red-500"><Trash2 size={16}/></button></div>))}
	                    </div>
	                    <button type="button" onClick={() => { setCurrentItem(initialItemState); setShowItemModal(true); }} className="w-full py-2 border border-dashed rounded-lg text-blue-600 flex items-center justify-center gap-2"><PlusCircle size={18}/> เพิ่มรายการสินค้า</button>
	                    <button type="submit" disabled={isSaving || requestItems.length === 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"><Save size={18}/> บันทึกคำขอคืนสินค้า</button>
	                </form>
	            </div>
	        )}
	        {activeStep === 2 && (
	            <div className="h-full overflow-auto p-6">
	                <h3 className="text-xl font-bold mb-4">2. รับสินค้าเข้า (Intake)</h3>
	                <div className="space-y-4">
	                    {requestedItems.map(item => (
	                        <div key={item.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
	                            <div><p className="font-bold">{item.productName}</p><p className="text-sm text-slate-500">{item.id} - {item.customerName}</p></div>
	                            <button onClick={() => handleIntakeReceive(item.id)} className="bg-green-500 text-white px-3 py-1 rounded-lg flex items-center gap-1"><CheckCircle size={16}/> รับเข้า</button>
	                        </div>
	                    ))}
	                </div>
	            </div>
	        )}
	        {activeStep === 3 && (
	            <div className="h-full overflow-auto p-6">
	                <h3 className="text-xl font-bold mb-4">3. ตรวจสอบคุณภาพ (QC)</h3>
	                <div className="space-y-4">
	                    {receivedItems.map(item => (
	                        <div key={item.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
	                            <div><p className="font-bold">{item.productName}</p><p className="text-sm text-slate-500">{item.id} - {item.customerName}</p></div>
	                            <button onClick={() => setQcSelectedItem(item)} className="bg-blue-500 text-white px-3 py-1 rounded-lg flex items-center gap-1"><ShieldCheck size={16}/> ตรวจสอบ</button>
	                        </div>
	                    ))}
	                </div>
	                {qcSelectedItem && (
	                    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
	                        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
	                            <div className="p-4 border-b font-bold text-lg flex justify-between items-center"><span>QC: {qcSelectedItem.productName}</span><button onClick={() => setQcSelectedItem(null)}><X className="w-5 h-5"/></button></div>
	                            <div className="p-6 space-y-4 overflow-auto">
	                                <div><label className="block text-sm font-medium">สภาพสินค้า</label><select value={qcSelectedItem.condition || ''} onChange={e => setQcSelectedItem({...qcSelectedItem, condition: e.target.value as ItemCondition})} className="w-full p-2 border rounded-lg"><option value="">เลือกสภาพ</option><option value="Good">ดี</option><option value="Damaged">เสียหาย</option><option value="Expired">หมดอายุ</option></select></div>
	                                <div><label className="block text-sm font-medium">การตัดสินใจ</label><select value={qcSelectedItem.disposition || ''} onChange={e => setQcSelectedItem({...qcSelectedItem, disposition: e.target.value as DispositionAction})} className="w-full p-2 border rounded-lg"><option value="">เลือกการตัดสินใจ</option><option value="Restock">นำกลับไปขาย</option><option value="RTV">คืนผู้ขาย</option><option value="Claim">เคลม</option><option value="Recycle">ทำลาย</option><option value="InternalUse">ใช้ภายใน</option></select></div>
	                                <div><label className="block text-sm font-medium">หมายเหตุ QC</label><textarea value={qcSelectedItem.qcNotes || ''} onChange={e => setQcSelectedItem({...qcSelectedItem, qcNotes: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                            </div>
	                            <div className="p-4 border-t flex justify-end"><button onClick={handleQCSubmit} disabled={!qcSelectedItem.condition || !qcSelectedItem.disposition} className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50">บันทึก QC</button></div>
	                        </div>
	                    </div>
	                )}
	            </div>
	        )}
	        {activeStep === 4 && (
	             <div className="h-full overflow-x-auto p-4 flex gap-4 relative">
	                 <h3 className="text-xl font-bold mb-4 w-full">4. ดำเนินการ (Execution)</h3>
	                 <div className="w-full space-y-4">
	                    {gradedItems.map(item => (
	                        <div key={item.id} className={`p-4 border rounded-lg bg-white flex justify-between items-center ${step4SelectedIds.has(item.id) ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}>
	                            <div><p className="font-bold">{item.productName}</p><p className="text-sm text-slate-500">{item.id} - {item.disposition}</p></div>
	                            <button onClick={() => toggleStep4Selection(item.id)} className={`px-3 py-1 rounded-lg flex items-center gap-1 ${step4SelectedIds.has(item.id) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'}`}><CheckSquare size={16}/> เลือก</button>
	                        </div>
	                    ))}
	                 </div>
	                 {step4SelectedIds.size > 0 && (
	                    <div className="fixed bottom-6 right-6 z-20">
	                        <button onClick={handleConfirmStep4Items} className="bg-green-600 text-white font-bold px-6 py-4 rounded-full shadow-lg flex items-center gap-3">
	                            <CheckSquare className="w-6 h-6" /> ยืนยันการดำเนินการ ({step4SelectedIds.size} รายการ)
	                        </button>
	                    </div>
	                )}
	             </div>
	        )}
	        {activeStep === 5 && (
	            <div className="h-full overflow-auto p-6">
	                <h3 className="text-xl font-bold mb-4">5. ปิดงาน/รับคืนเรียบร้อย</h3>
	                <div className="space-y-4">
	                    {documentedItems.map(item => (
	                        <div key={item.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
	                            <div><p className="font-bold">{item.productName}</p><p className="text-sm text-slate-500">{item.id} - {item.disposition}</p></div>
	                            <button onClick={() => handleCompleteJob(item.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"><Check size={16}/> ปิดงาน</button>
	                        </div>
	                    ))}
	                </div>
	            </div>
	        )}
	        {/* ... other steps ... */}
	      </div>
	      {showItemModal && (
	        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
	          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
	            <div className="p-4 border-b font-bold text-lg flex justify-between items-center"><span>เพิ่มรายการสินค้า (Add Item)</span><button onClick={() => setShowItemModal(false)}><X className="w-5 h-5"/></button></div>
	            <div className="p-6 space-y-4 overflow-auto">
	              <div><label className="block text-sm font-medium">รหัสสินค้า</label><input type="text" value={currentItem.productCode} onChange={e => setCurrentItem({...currentItem, productCode: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
	              <div><label className="block text-sm font-medium">ชื่อสินค้า</label><input type="text" value={currentItem.productName} onChange={e => setCurrentItem({...currentItem, productName: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
	              <div className="grid grid-cols-3 gap-4">
	                <div><label className="block text-sm font-medium">จำนวน</label><input type="number" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="1" required/></div>
	                <div><label className="block text-sm font-medium">หน่วย</label><input type="text" value={currentItem.unit} onChange={e => setCurrentItem({...currentItem, unit: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">วันหมดอายุ</label><input type="date" value={currentItem.expiryDate} onChange={e => setCurrentItem({...currentItem, expiryDate: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	              </div>
	              <div className="grid grid-cols-2 gap-4">
	                <div><label className="block text-sm font-medium">ราคาตามบิล (ต่อหน่วย)</label><input type="number" value={currentItem.priceBill} onChange={e => setCurrentItem({...currentItem, priceBill: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="0"/></div>
	                <div><label className="block text-sm font-medium">ราคาขาย (ต่อหน่วย)</label><input type="number" value={currentItem.priceSell} onChange={e => setCurrentItem({...currentItem, priceSell: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="0"/></div>
	              </div>
	              <div><label className="block text-sm font-medium">เหตุผลการคืน</label><textarea value={currentItem.reason} onChange={e => setCurrentItem({...currentItem, reason: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	              <div><label className="block text-sm font-medium">หมายเหตุ</label><textarea value={currentItem.notes} onChange={e => setCurrentItem({...currentItem, notes: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	            </div>
	            <div className="p-4 border-t flex justify-end">
	              <button type="button" onClick={() => { if (currentItem.productCode && currentItem.productName && currentItem.quantity) { setRequestItems([...requestItems, currentItem]); setShowItemModal(false); } else { alert('กรุณากรอกข้อมูลสินค้าให้ครบถ้วน'); } }} className="bg-blue-600 text-white px-6 py-2 rounded">บันทึกรายการ</button>
	            </div>
	          </div>
	        </div>
	      )}
	    </div>
	  );
};

export default Operations;