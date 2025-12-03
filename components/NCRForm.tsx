import React from 'react';
// Fix: Changed import source from DataContext to the centralized types file.
import { NCRRecord, NCRItem } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface NCRFormProps {
  formData: Partial<NCRRecord>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<NCRRecord>>>;
  isEditMode: boolean;
  ncrItems: NCRItem[];
  setNcrItems?: React.Dispatch<React.SetStateAction<NCRItem[]>>;
  setShowItemModal?: (show: boolean) => void;
}

const NCRForm: React.FC<NCRFormProps> = ({ formData, setFormData, isEditMode, ncrItems, setNcrItems, setShowItemModal }) => {
  
  const handleInputChange = (field: keyof NCRRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteItem = (id: string) => {
    if (setNcrItems) {
      setNcrItems(prevItems => prevItems.filter(i => i.id !== id));
    }
  };

  const getProblemStrings = (record: Partial<NCRRecord> | null) => {
    if (!record) return [];
    const problems = [];
    if (record.problemDamaged) problems.push("ชำรุด");
    if (record.problemLost) problems.push("สูญหาย");
    if (record.problemMixed) problems.push("สินค้าสลับ");
    if (record.problemWrongInv) problems.push("สินค้าไม่ตรง INV.");
    if (record.problemLate) problems.push("ส่งช้า");
    if (record.problemDuplicate) problems.push("ส่งซ้ำ");
    if (record.problemWrong) problems.push("ส่งผิด");
    if (record.problemIncomplete) problems.push("ส่งของไม่ครบ");
    if (record.problemOver) problems.push("ส่งของเกิน");
    if (record.problemWrongInfo) problems.push("ข้อมูลผิด");
    if (record.problemShortExpiry) problems.push("สินค้าอายุสั้น");
    if (record.problemTransportDamage) problems.push("สินค้าเสียหายบนรถขนส่ง");
    if (record.problemAccident) problems.push("อุบัติเหตุ");
    if (record.problemOther && record.problemOtherText) problems.push(`อื่นๆ: ${record.problemOtherText}`);
    return problems;
}

  return (
    <div className="w-full border-2 border-black p-6 relative">
      {/* HEADER */}
      <div className="flex border-2 border-black mb-6">
          <div className="w-[30%] border-r-2 border-black p-4 flex items-center justify-center"><img src="https://img2.pic.in.th/pic/logo-neo.png" alt="Neo Logistics" className="w-full h-auto object-contain max-h-24" /></div>
          {/* Fix: Corrected corrupted address line and removed extraneous error text. */}
          <div className="w-[70%] p-4 flex flex-col justify-center pl-6"><h2 className="text-xl font-bold text-slate-900 leading-none mb-2">บริษัท นีโอสยาม โลจิสติกส์ แอนด์ ทรานสปอร์ต จำกัด</h2><h3 className="text-sm font-bold text-slate-700 mb-3">NEOSIAM LOGISTICS & TRANSPORT CO., LTD.</h3><p className="text-sm text-slate-600 mb-1">159/9-10 หมู่ 7 ต.บางม่วง อ.เมืองนครสวรรค์, นครสวรรค์ 60000</p></div>
      </div>
      <h1 className="text-3xl font-black text-center border-y-2 border-black py-2 mb-2">ใบแจ้งปัญหาคุณภาพสินค้า (NON-CONFORMANCE REPORT - NCR)</h1>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-y-2 border-black py-2 mb-2">
        {/* ... form fields ... */}
      </div>
    </div>
  );
};

// Fix: Added default export.
export default NCRForm;
