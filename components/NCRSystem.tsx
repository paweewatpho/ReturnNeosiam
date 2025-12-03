


import React, { useState, useEffect } from 'react';
// Fix: Import NCR types from the centralized types file.
import { useData } from '../DataContext';
import { NCRRecord, NCRItem } from '../types';
import { Save, Printer, Plus, Trash2, X, Loader, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
// Fix: NCRForm is a default export.
import NCRForm from './NCRForm';

const WAREHOUSE_BRANCHES = ['สาย 3', 'นครสวรรค์', 'กำแพงเพชร', 'แม่สอด', 'พิษณโลก', 'เชียงใหม่', 'EKP ลำปาง', 'คลอง13', 'ประดู่'];
const WAREHOUSE_CAUSES = ['เช็คเกอร์', 'พนักงานลงสินค้า', 'อื่นๆ'];
const REPORTING_BRANCHES = ['สาย 3', 'นครสวรรค์', 'กำแพงเพชร', 'แม่สอด', 'พิษณโลก', 'เชียงใหม่', 'EKP ลำปาง', 'คลอง13', 'ประดู่'];

const NCRSystem: React.FC = () => {
  const { addNCRReport, getNextNCRNumber } = useData();
  
  const initialFormData: Partial<NCRRecord> = {
    toDept: 'แผนกควบคุมคุณภาพ', date: new Date().toISOString().split('T')[0], copyTo: '',
    founder: 'สมชาย ใจดี', poNo: '',
    problemDetail: '', status: 'Open',
  };

  const [formData, setFormData] = useState<Partial<NCRRecord>>(initialFormData);
  const [ncrItems, setNcrItems] = useState<NCRItem[]>([]);
	  const [showItemModal, setShowItemModal] = useState(false);
	  const [newItem, setNewItem] = useState<Partial<NCRItem>>({ branch: '', refNo: '', neoRefNo: '', productCode: '', productName: '', customerName: '', destinationCustomer: '', quantity: 1, unit: 'ชิ้น', priceBill: 0, expiryDate: '', hasCost: false, costAmount: 0, costResponsible: '', problemSource: '' });
	  const [isCustomReportBranch, setIsCustomReportBranch] = useState(false);
	  const [sourceSelection, setSourceSelection] = useState({ category: '', whBranch: '', whCause: '', whOtherText: '', transType: '', transName: '', transPlate: '', transVehicleType: '', transAffiliation: '', transCompany: '', otherText: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string; ncrNo?: string } | null>(null);

	  const handleAddItem = () => {
	      if (!newItem.productCode || !newItem.branch) { alert("กรุณาระบุรหัสสินค้าและสาขา"); return; }
	      let formattedSource = '';
	      const s = sourceSelection;
	      if (s.category === 'Customer') formattedSource = 'ลูกค้า'; else if (s.category === 'Accounting') formattedSource = 'บัญชี'; else if (s.category === 'Keying') formattedSource = 'พนักงานคีย์ข้อมูลผิด'; else if (s.category === 'Warehouse') { formattedSource = `ภายในคลังสินค้า (${s.whBranch || '-'}) - สาเหตุ: ${s.whCause}${s.whCause === 'อื่นๆ' ? ' ' + s.whOtherText : ''}`; } else if (s.category === 'Transport') { const type = s.transType === 'Company' ? 'พนักงานขับรถบริษัท' : 'รถขนส่งร่วม'; const details = [ s.transName ? `ชื่อ: ${s.transName}` : '', s.transPlate ? `ทะเบียน: ${s.transPlate}` : '', s.transVehicleType ? `ประเภท: ${s.transVehicleType}` : '', s.transAffiliation ? `สังกัด: ${s.transAffiliation}` : '', s.transType === 'Joint' && s.transCompany ? `บ.: ${s.transCompany}` : '' ].filter(Boolean).join(', '); formattedSource = `ระหว่างขนส่ง (${type}) - ${details}`; } else if (s.category === 'Other') { formattedSource = `อื่นๆ: ${s.otherText}`; }
	      const item: NCRItem = { ...newItem as NCRItem, id: Date.now().toString(), problemSource: formattedSource || newItem.problemSource || '-' };
	      setNcrItems([...ncrItems, item]);
	      setNewItem({ branch: '', refNo: '', neoRefNo: '', productCode: '', productName: '', customerName: '', destinationCustomer: '', quantity: 1, unit: 'ชิ้น', priceBill: 0, expiryDate: '', hasCost: false, costAmount: 0, costResponsible: '', problemSource: '' });
	      setShowItemModal(false);
	  };

  const handlePrint = () => { window.print(); };

  const handleSaveRecord = () => {
    if (!formData.founder?.trim()) { alert("กรุณากรอกข้อมูล 'ผู้พบปัญหา'"); return; }
    if (ncrItems.length === 0) { alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ"); return; }
    setShowConfirmModal(true);
  };
  
  const executeSave = async () => {
    setShowConfirmModal(false);
    setIsSaving(true);
    const newNcrNo = await getNextNCRNumber();
    if (newNcrNo.includes('ERR')) {
        setSaveResult({ success: false, message: "ไม่สามารถสร้างเลขที่ NCR อัตโนมัติได้" });
        setShowResultModal(true);
        setIsSaving(false);
        return;
    }
    const itemsRecord: Record<string, NCRItem> = ncrItems.reduce((acc, item) => { acc[item.id] = item; return acc; }, {} as Record<string, NCRItem>);
    const record: NCRRecord = { ...formData as NCRRecord, id: newNcrNo, ncrNo: newNcrNo, items: itemsRecord, status: 'Open' };
    const success = await addNCRReport(record);
    setIsSaving(false);
    if (success) { setSaveResult({ success: true, message: `บันทึกข้อมูลสำเร็จ`, ncrNo: newNcrNo }); }
    else { setSaveResult({ success: false, message: `บันทึกข้อมูลไม่สำเร็จ!` }); }
    setShowResultModal(true);
  };
  
  const handleCloseResultModal = () => {
    setShowResultModal(false);
    if (saveResult?.success) { setNcrItems([]); setFormData(initialFormData); }
    setSaveResult(null);
  };

  return (
    <div className="p-8 h-full overflow-auto bg-slate-100 flex flex-col items-center print:p-0 print:m-0 print:bg-white">
      <div className="w-full max-w-5xl sticky top-0 z-20 bg-slate-100/90 backdrop-blur-sm py-4 print:hidden">
        <div className="flex justify-end gap-2">
          <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-700"><Printer className="w-4 h-4" /> Print Form</button>
          <button onClick={handleSaveRecord} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"><Save className="w-4 h-4" /> Save Record</button>
        </div>
      </div>
      
      <div className="w-full max-w-5xl bg-white shadow-lg p-8 my-8 print:my-0 print:shadow-none">
        <NCRForm 
          formData={formData} 
          setFormData={setFormData}
          isEditMode={true}
          ncrItems={ncrItems}
          setNcrItems={setNcrItems}
          setShowItemModal={setShowItemModal}
        />
      </div>
      
      {/* Modals */}
	      {showItemModal && (
	        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
	          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
	            <div className="p-4 border-b font-bold text-lg flex justify-between items-center"><span>เพิ่มรายการสินค้า (Add Item)</span><button onClick={() => setShowItemModal(false)}><X className="w-5 h-5"/></button></div>
	            <div className="p-6 space-y-4 overflow-auto">
	              <div className="grid grid-cols-2 gap-4">
	                <div><label className="block text-sm font-medium">สาขาที่พบปัญหา</label><select value={newItem.branch} onChange={e => setNewItem({...newItem, branch: e.target.value})} className="w-full p-2 border rounded-lg" required><option value="">เลือกสาขา</option>{REPORTING_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
	                <div><label className="block text-sm font-medium">รหัสสินค้า</label><input type="text" value={newItem.productCode} onChange={e => setNewItem({...newItem, productCode: e.target.value})} className="w-full p-2 border rounded-lg" required/></div>
	                <div><label className="block text-sm font-medium">ชื่อสินค้า</label><input type="text" value={newItem.productName} onChange={e => setNewItem({...newItem, productName: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">จำนวน</label><input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="1" required/></div>
	                <div><label className="block text-sm font-medium">หน่วย</label><input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">เลขที่อ้างอิง (Ref No.)</label><input type="text" value={newItem.refNo} onChange={e => setNewItem({...newItem, refNo: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">เลขที่อ้างอิง Neo (Neo Ref No.)</label><input type="text" value={newItem.neoRefNo} onChange={e => setNewItem({...newItem, neoRefNo: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">ชื่อลูกค้า</label><input type="text" value={newItem.customerName} onChange={e => setNewItem({...newItem, customerName: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">ลูกค้าปลายทาง</label><input type="text" value={newItem.destinationCustomer} onChange={e => setNewItem({...newItem, destinationCustomer: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                <div><label className="block text-sm font-medium">ราคาตามบิล (ต่อหน่วย)</label><input type="number" value={newItem.priceBill} onChange={e => setNewItem({...newItem, priceBill: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="0"/></div>
	                <div><label className="block text-sm font-medium">วันหมดอายุ</label><input type="date" value={newItem.expiryDate} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	              </div>
	              <div className="border-t pt-4 mt-4">
	                <h4 className="font-bold mb-2">แหล่งที่มาของปัญหา (Problem Source)</h4>
	                <select value={sourceSelection.category} onChange={e => setSourceSelection({ ...sourceSelection, category: e.target.value })} className="w-full p-2 border rounded-lg mb-4">
	                  <option value="">เลือกแหล่งที่มา</option>
	                  <option value="Customer">ลูกค้า</option>
	                  <option value="Accounting">บัญชี</option>
	                  <option value="Keying">พนักงานคีย์ข้อมูลผิด</option>
	                  <option value="Warehouse">ภายในคลังสินค้า</option>
	                  <option value="Transport">ระหว่างขนส่ง</option>
	                  <option value="Other">อื่นๆ</option>
	                </select>
	                {sourceSelection.category === 'Warehouse' && (
	                  <div className="grid grid-cols-2 gap-4">
	                    <div><label className="block text-sm font-medium">สาขาคลังสินค้า</label><select value={sourceSelection.whBranch} onChange={e => setSourceSelection({ ...sourceSelection, whBranch: e.target.value })} className="w-full p-2 border rounded-lg"><option value="">เลือกสาขา</option>{WAREHOUSE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
	                    <div><label className="block text-sm font-medium">สาเหตุ</label><select value={sourceSelection.whCause} onChange={e => setSourceSelection({ ...sourceSelection, whCause: e.target.value })} className="w-full p-2 border rounded-lg"><option value="">เลือกสาเหตุ</option>{WAREHOUSE_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
	                    {sourceSelection.whCause === 'อื่นๆ' && <div><label className="block text-sm font-medium">ระบุสาเหตุอื่น</label><input type="text" value={sourceSelection.whOtherText} onChange={e => setSourceSelection({ ...sourceSelection, whOtherText: e.target.value })} className="w-full p-2 border rounded-lg"/></div>}
	                  </div>
	                )}
	                {sourceSelection.category === 'Transport' && (
	                  <div className="grid grid-cols-2 gap-4">
	                    <div><label className="block text-sm font-medium">ประเภทขนส่ง</label><select value={sourceSelection.transType} onChange={e => setSourceSelection({ ...sourceSelection, transType: e.target.value })} className="w-full p-2 border rounded-lg"><option value="">เลือกประเภท</option><option value="Company">พนักงานขับรถบริษัท</option><option value="Joint">รถขนส่งร่วม</option></select></div>
	                    <div><label className="block text-sm font-medium">ชื่อพนักงาน/คนขับ</label><input type="text" value={sourceSelection.transName} onChange={e => setSourceSelection({ ...sourceSelection, transName: e.target.value })} className="w-full p-2 border rounded-lg"/></div>
	                    <div><label className="block text-sm font-medium">ทะเบียนรถ</label><input type="text" value={sourceSelection.transPlate} onChange={e => setSourceSelection({ ...sourceSelection, transPlate: e.target.value })} className="w-full p-2 border rounded-lg"/></div>
	                    <div><label className="block text-sm font-medium">ประเภทรถ</label><input type="text" value={sourceSelection.transVehicleType} onChange={e => setSourceSelection({ ...sourceSelection, transVehicleType: e.target.value })} className="w-full p-2 border rounded-lg"/></div>
	                    <div><label className="block text-sm font-medium">สังกัด</label><input type="text" value={sourceSelection.transAffiliation} onChange={e => setSourceSelection({ ...sourceSelection, transAffiliation: e.target.value })} className="w-full p-2 border rounded-lg"/></div>
	                    {sourceSelection.transType === 'Joint' && <div><label className="block text-sm font-medium">บริษัทขนส่ง</label><input type="text" value={sourceSelection.transCompany} onChange={e => setSourceSelection({ ...sourceSelection, transCompany: e.target.value })} className="w-full p-2 border rounded-lg"/></div>}
	                  </div>
	                )}
	                {sourceSelection.category === 'Other' && <div><label className="block text-sm font-medium">ระบุแหล่งที่มาอื่น</label><input type="text" value={sourceSelection.otherText} onChange={e => setSourceSelection({ ...sourceSelection, otherText: e.target.value })} className="w-full p-2 border rounded-lg"/></div>}
	              </div>
	              <div className="border-t pt-4 mt-4">
	                <h4 className="font-bold mb-2">ค่าใช้จ่ายที่เกี่ยวข้อง (Cost)</h4>
	                <div className="flex items-center gap-2 mb-2"><input type="checkbox" id="hasCost" checked={newItem.hasCost} onChange={e => setNewItem({...newItem, hasCost: e.target.checked})} className="w-4 h-4"/><label htmlFor="hasCost" className="text-sm font-medium">มีค่าใช้จ่าย</label></div>
	                {newItem.hasCost && (
	                  <div className="grid grid-cols-2 gap-4">
	                    <div><label className="block text-sm font-medium">จำนวนเงิน</label><input type="number" value={newItem.costAmount} onChange={e => setNewItem({...newItem, costAmount: Number(e.target.value)})} className="w-full p-2 border rounded-lg" min="0"/></div>
	                    <div><label className="block text-sm font-medium">ผู้รับผิดชอบค่าใช้จ่าย</label><input type="text" value={newItem.costResponsible} onChange={e => setNewItem({...newItem, costResponsible: e.target.value})} className="w-full p-2 border rounded-lg"/></div>
	                  </div>
	                )}
	              </div>
	            </div>
	            <div className="p-4 border-t flex justify-end">
	              <button onClick={handleAddItem} className="bg-blue-600 text-white px-6 py-2 rounded">บันทึกรายการ</button>
	            </div>
	          </div>
	        </div>
	      )}
      {showConfirmModal && ( <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"> <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center"> <HelpCircle className="w-12 h-12 text-blue-500 mx-auto mb-4"/> <h3 className="text-lg font-bold mb-2">ยืนยันการบันทึก</h3> <p className="text-sm text-slate-500 mb-6">คุณต้องการบันทึกข้อมูล NCR นี้เข้าระบบใช่หรือไม่?</p> <div className="flex gap-4"> <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 border rounded-lg">ยกเลิก</button> <button onClick={executeSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">ยืนยัน</button> </div> </div> </div> )}
      {showResultModal && saveResult && ( <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"> <div className="bg-white p-8 rounded-xl max-w-sm w-full text-center"> {saveResult.success ? <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/> : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>} <h3 className="text-xl font-bold mb-2">{saveResult.success ? "บันทึกสำเร็จ!" : "เกิดข้อผิดพลาด"}</h3> {saveResult.ncrNo && <p className="text-sm text-slate-500">เลขที่ NCR คือ: <b className="text-lg text-slate-800">{saveResult.ncrNo}</b></p>} <p className="text-sm text-slate-500 whitespace-pre-line mt-2 mb-6">{saveResult.message}</p> <button onClick={handleCloseResultModal} className={`w-full py-3 rounded-lg text-white font-bold ${saveResult.success ? 'bg-green-600' : 'bg-red-600'}`}>ตกลง</button> </div> </div> )}
    </div>
  );
};

export default NCRSystem;