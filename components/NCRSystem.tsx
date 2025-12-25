
import React, { useState, useEffect, useMemo } from 'react';
import { useData, NCRRecord, NCRItem } from '../DataContext';
import { ReturnRecord } from '../types';
import { Save, Printer, Image as ImageIcon, AlertTriangle, Plus, Trash2, X, Loader, CheckCircle, XCircle, HelpCircle, Download, Lock, PenTool, Truck, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { RESPONSIBLE_MAPPING } from './operations/utils';
import { LineAutocomplete } from './LineAutocomplete';
import { exportNCRToExcel } from './NCRExcelExport';

// --- Constants ---
const RETURN_ROUTES = ['นครสวรรค์', 'สาย 3', 'Sino Pacific Trading', 'NEO CORPORATE'];

const NCRSystem: React.FC = () => {
    const { addNCRReport, getNextNCRNumber, addReturnRecord, ncrReports } = useData();

    // --- State: Main Form Data ---
    // Note: We keep global problem/action flags in formData for backward compatibility or summary views,
    // but the PRIMARY source of truth for Operations Hub sync will be the individual items.
    const initialFormData = {
        toDept: 'แผนกควบคุมคุณภาพ', date: new Date().toISOString().split('T')[0], copyTo: '',
        founder: '', poNo: '',
        // Global Flags (Optional usage now, as items carry specific flags)
        problemDamaged: false, problemDamagedInBox: false, problemLost: false, problemMixed: false, problemWrongInv: false, problemLate: false, problemDuplicate: false, problemWrong: false, problemIncomplete: false, problemOver: false, problemWrongInfo: false, problemShortExpiry: false, problemTransportDamage: false, problemAccident: false, problemPOExpired: false, problemNoBarcode: false, problemNotOrdered: false, problemOther: false, problemOtherText: '', problemDetail: '',
        actionReject: false, actionRejectQty: 0, actionRejectSort: false, actionRejectSortQty: 0, actionRework: false, actionReworkQty: 0, actionReworkMethod: '', actionSpecialAcceptance: false, actionSpecialAcceptanceQty: 0, actionSpecialAcceptanceReason: '', actionScrap: false, actionScrapQty: 0, actionReplace: false, actionReplaceQty: 0,
        causePackaging: false, causeTransport: false, causeOperation: false, causeEnv: false, causeDetail: '', preventionDetail: '', preventionDueDate: '',
        dueDate: '', approver: '', approverPosition: '', approverDate: '', responsiblePerson: '', responsiblePosition: '',
        qaAccept: false, qaReject: false, qaReason: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    // --- State: Items & Modal ---
    const [ncrItems, setNcrItems] = useState<NCRItem[]>([]);
    const [showItemModal, setShowItemModal] = useState(false);

    // Expanded newItem state to match ReturnRecord structure perfectly
    const [newItem, setNewItem] = useState<Partial<NCRItem>>({
        branch: '', refNo: '', neoRefNo: '', productCode: '', productName: '',
        customerName: '', destinationCustomer: '', quantity: 0, unit: '',
        pricePerUnit: 0, priceBill: 0, priceSell: 0, expiryDate: '', hasCost: false,
        costAmount: 0, costResponsible: '', problemSource: '',
        preliminaryDecision: 'Return', preliminaryRoute: '',
        isFieldSettled: false, fieldSettlementAmount: 0,
        fieldSettlementEvidence: '', fieldSettlementName: '', fieldSettlementPosition: '',

        // Problem Analysis (Deep Dive)
        problemAnalysis: 'Customer', // Default
        problemAnalysisSub: '',
        problemAnalysisCause: '',
        problemAnalysisDetail: '',
        images: [], // For item-specific images

        // Problem Flags (Item Specific)
        problemDamaged: false, problemDamagedInBox: false, problemLost: false, problemMixed: false, problemWrongInv: false,
        problemLate: false, problemDuplicate: false, problemWrong: false, problemIncomplete: false, problemOver: false,
        problemWrongInfo: false, problemShortExpiry: false, problemTransportDamage: false, problemAccident: false,
        problemPOExpired: false, problemNoBarcode: false, problemNotOrdered: false, problemOther: false, problemOtherText: '',
        problemDetail: '',
        // Action Flags (Item Specific)
        actionReject: false, actionRejectQty: 0, actionRejectSort: false, actionRejectSortQty: 0,
        actionRework: false, actionReworkQty: 0, actionReworkMethod: '',
        actionSpecialAcceptance: false, actionSpecialAcceptanceQty: 0, actionSpecialAcceptanceReason: '',
        actionScrap: false, actionScrapQty: 0, actionReplace: false, actionReplaceQty: 0,
        // Cause (Item Specific - Optional, but good for completeness)
        causePackaging: false, causeTransport: false, causeOperation: false, causeEnv: false,
        causeDetail: '', preventionDetail: '', preventionDueDate: ''
    });

    const [sourceSelection, setSourceSelection] = useState({ category: '', whBranch: '', whCause: '', whOtherText: '', transType: '', transName: '', transPlate: '', transVehicleType: '', transAffiliation: '', transCompany: '', otherText: '', problemScenario: '' });

    // --- State: UI Control ---
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string; ncrNo?: string } | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [generatedNCRNumber, setGeneratedNCRNumber] = useState('');

    // --- State: Auth ---
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authAction, setAuthAction] = useState<'EDIT' | 'DELETE' | null>(null);
    const [authTargetId, setAuthTargetId] = useState<string | null>(null);
    const [authPassword, setAuthPassword] = useState('');

    // --- Derived State ---
    const uniqueFounders = useMemo(() => {
        const founders = new Set(ncrReports.map(r => r.founder).filter(Boolean));
        return Array.from(founders).sort();
    }, [ncrReports]);

    // --- Effects ---
    useEffect(() => {
        if (showItemModal) {
            // Reset complex selection states when opening modal
            setSourceSelection({ category: '', whBranch: '', whCause: '', whOtherText: '', transType: '', transName: '', transPlate: '', transVehicleType: '', transAffiliation: '', transCompany: '', otherText: '', problemScenario: '' });
        }
    }, [showItemModal]);

    // Auto-map responsible person based on problem source dropdown
    useEffect(() => {
        if (newItem.hasCost && newItem.problemSource) {
            const responsible = RESPONSIBLE_MAPPING[newItem.problemSource as keyof typeof RESPONSIBLE_MAPPING];
            if (responsible) {
                setNewItem(prev => ({ ...prev, costResponsible: responsible }));
            }
        }
    }, [newItem.hasCost, newItem.problemSource]);

    // --- Handlers ---

    // 1. Auth Handling
    const handleAuthSubmit = () => {
        if (authPassword !== '1234') {
            Swal.fire({ icon: 'error', title: 'รหัสผ่านไม่ถูกต้อง', timer: 1500, showConfirmButton: false });
            return;
        }
        if (authAction === 'DELETE' && authTargetId) {
            setNcrItems(ncrItems.filter(i => i.id !== authTargetId));
        } else if (authAction === 'EDIT' && authTargetId) {
            const item = ncrItems.find(i => i.id === authTargetId);
            if (item) {
                setNewItem(item);
                const remaining = ncrItems.filter(i => i.id !== authTargetId);
                setNcrItems(remaining);
                setShowItemModal(true);
            }
        }
        setShowAuthModal(false); setAuthPassword(''); setAuthAction(null); setAuthTargetId(null);
    };

    const confirmDelete = (id: string) => { setAuthAction('DELETE'); setAuthTargetId(id); setShowAuthModal(true); };
    const confirmEdit = (id: string) => { setAuthAction('EDIT'); setAuthTargetId(id); setShowAuthModal(true); };

    // 2. Main Form Checkbox Handlers (Global - kept for backward compat if needed, but UI hidden)
    const handleProblemSelection = (field: keyof NCRRecord) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleActionSelection = (field: keyof NCRRecord) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // 3. Item Modal Checkbox Handlers (Item Specific - CRITICAL for Data Sync)
    const handleItemProblemSelection = (field: keyof NCRItem) => {
        setNewItem(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleItemActionSelection = (field: keyof NCRItem) => {
        setNewItem(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setNewItem(prev => ({ ...prev, images: [...(prev.images || []), base64] }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleItemRemoveImage = (index: number) => {
        setNewItem(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }));
    };

    // 4. Item Logic
    const handleAddItem = (closeModal: boolean = true) => {
        if (!newItem.productCode || !newItem.branch) {
            Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'ระบุรหัสสินค้า และสาขา' });
            return;
        }

        const item: NCRItem = {
            ...newItem as NCRItem,
            id: Date.now().toString(),
            quantity: Number(newItem.quantity) || 0,
            pricePerUnit: Number(newItem.pricePerUnit) || 0,
            priceBill: Number(newItem.priceBill) || 0,
            priceSell: Number(newItem.priceSell) || 0,
            costAmount: Number(newItem.costAmount) || 0,
            problemDetail: newItem.problemDetail || '',
            problemOtherText: newItem.problemOtherText || '',
            actionReworkMethod: newItem.actionReworkMethod || '',
            actionSpecialAcceptanceReason: newItem.actionSpecialAcceptanceReason || '',
            preliminaryDecision: newItem.isFieldSettled ? 'FieldSettlement' : 'Return',
            preliminaryRoute: newItem.preliminaryRoute === 'Other' ? ((newItem as any).preliminaryRouteOther || 'Other') : newItem.preliminaryRoute
        };

        setNcrItems([...ncrItems, item]);

        // Reset
        setNewItem({
            branch: '', refNo: '', neoRefNo: '', productCode: '', productName: '',
            customerName: '', destinationCustomer: '', quantity: 0, unit: '',
            pricePerUnit: 0, priceBill: 0, priceSell: 0, expiryDate: '', hasCost: false,
            costAmount: 0, costResponsible: '', problemSource: '',
            preliminaryDecision: 'Return', preliminaryRoute: '',
            isFieldSettled: false, fieldSettlementAmount: 0, fieldSettlementEvidence: '', fieldSettlementName: '', fieldSettlementPosition: '',
            problemDamaged: false, problemDamagedInBox: false, problemLost: false, problemMixed: false, problemWrongInv: false,
            problemLate: false, problemDuplicate: false, problemWrong: false, problemIncomplete: false,
            problemOver: false, problemWrongInfo: false, problemShortExpiry: false, problemTransportDamage: false,
            problemAccident: false, problemPOExpired: false, problemNoBarcode: false, problemNotOrdered: false, problemOther: false, problemOtherText: '',
            problemDetail: '',
            actionReject: false, actionRejectQty: 0, actionRejectSort: false, actionRejectSortQty: 0,
            actionRework: false, actionReworkQty: 0, actionReworkMethod: '',
            actionSpecialAcceptance: false, actionSpecialAcceptanceQty: 0, actionSpecialAcceptanceReason: '',
            actionScrap: false, actionScrapQty: 0, actionReplace: false, actionReplaceQty: 0,
            causePackaging: false, causeTransport: false, causeOperation: false, causeEnv: false,
            causeDetail: '', preventionDetail: '', preventionDueDate: ''
        });

        if (closeModal) setShowItemModal(false);
        else Swal.fire({ icon: 'success', title: 'เพิ่มรายการสำเร็จ', toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 });
    };

    // 5. Validation & Save
    const validateForm = () => {
        const errors = [];
        if (!formData.founder.trim()) errors.push("ผู้พบปัญหา");
        // Check items
        if (ncrItems.length === 0) errors.push("รายการสินค้า (กรุณากดปุ่ม '+ เพิ่มรายการ')");
        // Cause
        const isCauseChecked = formData.causePackaging || formData.causeTransport || formData.causeOperation || formData.causeEnv;
        if (!isCauseChecked) errors.push("สาเหตุเกิดจาก (กรุณาเลือกอย่างน้อย 1 หัวข้อ)");
        return errors;
    };

    const executeSave = async () => {
        setShowConfirmModal(false);
        setIsSaving(true);

        const newNcrNo = await getNextNCRNumber();
        if (newNcrNo.includes('ERR')) {
            setSaveResult({ success: false, message: "สร้างเลขที่ NCR ไม่สำเร็จ" });
            setShowResultModal(true); setIsSaving(false); return;
        }

        let successCount = 0;
        for (const item of ncrItems) {
            const record: NCRRecord = {
                ...formData,
                id: `${newNcrNo}-${item.id}`,
                ncrNo: newNcrNo,
                item: item,
                status: item.isFieldSettled ? 'Settled_OnField' : (formData.qaAccept ? 'Closed' : 'Open'),
            };

            const success = await addNCRReport(record);
            if (success) {
                // SYNC TO OPERATIONS HUB (ReturnRecord)
                const returnRecord: ReturnRecord = {
                    id: `RT-${new Date().getFullYear()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    refNo: item.refNo || '-',
                    date: formData.date,
                    dateRequested: formData.date,
                    productName: item.productName || 'Unknown',
                    productCode: item.productCode || 'N/A',
                    quantity: item.quantity,
                    unit: item.unit || 'Unit',
                    customerName: item.customerName || 'Unknown',
                    destinationCustomer: item.destinationCustomer || '',
                    branch: item.branch || 'Head Office',
                    category: 'General',
                    ncrNumber: newNcrNo,
                    documentType: 'NCR',
                    founder: formData.founder,
                    status: item.isFieldSettled ? 'Settled_OnField' : 'COL_JobAccepted',
                    isFieldSettled: item.isFieldSettled,
                    fieldSettlementAmount: item.fieldSettlementAmount,
                    fieldSettlementEvidence: item.fieldSettlementEvidence,
                    fieldSettlementName: item.fieldSettlementName,
                    fieldSettlementPosition: item.fieldSettlementPosition,
                    preliminaryRoute: item.preliminaryRoute || 'Other',
                    disposition: 'Pending',
                    reason: `NCR: ${item.problemDetail || formData.problemDetail || '-'}`,
                    amount: item.priceBill || 0,
                    priceBill: item.priceBill || 0,
                    pricePerUnit: item.pricePerUnit || 0,
                    priceSell: item.priceSell || 0,
                    neoRefNo: item.neoRefNo || '-',

                    // Flags
                    problemDamaged: item.problemDamaged,
                    problemDamagedInBox: item.problemDamagedInBox,
                    problemLost: item.problemLost,
                    problemMixed: item.problemMixed,
                    problemWrongInv: item.problemWrongInv,
                    problemLate: item.problemLate,
                    problemDuplicate: item.problemDuplicate,
                    problemWrong: item.problemWrong,
                    problemIncomplete: item.problemIncomplete,
                    problemOver: item.problemOver,
                    problemWrongInfo: item.problemWrongInfo,
                    problemShortExpiry: item.problemShortExpiry,
                    problemTransportDamage: item.problemTransportDamage,
                    problemAccident: item.problemAccident,
                    problemPOExpired: item.problemPOExpired,
                    problemNoBarcode: item.problemNoBarcode,
                    problemNotOrdered: item.problemNotOrdered,
                    problemOther: item.problemOther,
                    problemOtherText: item.problemOtherText,
                    problemDetail: item.problemDetail,

                    // Actions
                    actionReject: item.actionReject,
                    actionRejectQty: item.actionRejectQty,
                    actionRejectSort: item.actionRejectSort,
                    actionRejectSortQty: item.actionRejectSortQty,
                    actionRework: item.actionRework,
                    actionReworkQty: item.actionReworkQty,
                    actionReworkMethod: item.actionReworkMethod,
                    actionSpecialAcceptance: item.actionSpecialAcceptance,
                    actionSpecialAcceptanceQty: item.actionSpecialAcceptanceQty,
                    actionSpecialAcceptanceReason: item.actionSpecialAcceptanceReason,
                    actionScrap: item.actionScrap,
                    actionScrapQty: item.actionScrapQty,
                    actionReplace: item.actionReplace,
                    actionReplaceQty: item.actionReplaceQty,

                    // Cost & Source & Analysis
                    rootCause: item.problemSource || 'NCR',
                    problemSource: item.problemSource,
                    problemAnalysis: item.problemAnalysis, // NEW
                    problemAnalysisSub: item.problemAnalysisSub, // NEW
                    problemAnalysisCause: item.problemAnalysisCause, // NEW
                    problemAnalysisDetail: item.problemAnalysisDetail, // NEW
                    images: item.images, // NEW

                    hasCost: item.hasCost,
                    costAmount: item.costAmount,
                    costResponsible: item.costResponsible,

                    // Inherit from Main Form
                    causePackaging: formData.causePackaging,
                    causeTransport: formData.causeTransport,
                    causeOperation: formData.causeOperation,
                    causeEnv: formData.causeEnv,
                    causeDetail: formData.causeDetail,
                    preventionDetail: formData.preventionDetail,
                    preventionDueDate: formData.preventionDueDate,
                    responsiblePerson: formData.responsiblePerson,
                    responsiblePosition: formData.responsiblePosition,
                    dueDate: formData.dueDate,
                    approver: formData.approver,
                    approverPosition: formData.approverPosition,
                    approverDate: formData.approverDate
                };

                await addReturnRecord(returnRecord);
                successCount++;
            }
        }

        setIsSaving(false);
        if (successCount === ncrItems.length) {
            setGeneratedNCRNumber(newNcrNo);
            setSaveResult({ success: true, message: "บันทึกข้อมูลสำเร็จ", ncrNo: newNcrNo });
            setShowResultModal(true);
            if (isPrinting) setTimeout(() => window.print(), 500);
        } else {
            setSaveResult({ success: false, message: "บันทึกข้อมูลล้มเหลวบางส่วน" });
            setShowResultModal(true);
        }
    };

    const handlePrint = () => {
        const err = validateForm();
        if (err.length > 0) { Swal.fire({ icon: 'warning', html: err.join('<br>') }); return; }
        setIsPrinting(true); setShowConfirmModal(true);
    };

    const handleSaveRecord = () => {
        const err = validateForm();
        if (err.length > 0) { Swal.fire({ icon: 'warning', html: err.join('<br>') }); return; }
        setIsPrinting(false); setShowConfirmModal(true);
    };

    return (
        <div className="p-8 h-full overflow-auto bg-slate-50 flex flex-col items-center print:p-0 print:m-0 print:bg-white print:h-auto print:overflow-visible print:block">
            {/* Styles for print/screen */}
            <style>{`
                @media screen { 
                    .a4-paper { width: 210mm; min-height: 297mm; margin: 40px auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.15); padding: 20mm; border: 1px solid #e2e8f0; } 
                }
                @media print { 
                    @page { margin: 10mm; size: A4; } 
                    .a4-paper { width: 100%; margin: 0; padding: 0; box-shadow: none; border: none; }
                    .no-print { display: none !important; }
                    .print-border { border: 1px solid #000 !important; }
                    .print-border-2 { border: 2px solid #000 !important; }
                    input, textarea, select { border: none !important; background: transparent !important; padding: 0 !important; }
                    input[type="checkbox"] { border: 1px solid #000 !important; }
                }
                .input-line { border-bottom: 1px dotted #999; width: 100%; }
            `}</style>

            {/* Top Actions */}
            <div className="w-full max-w-5xl flex justify-end gap-2 mb-6 print:hidden">
                <button onClick={() => exportNCRToExcel(formData, ncrItems, generatedNCRNumber || "Draft")} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-green-700" title="Export Excel"><Download className="w-4 h-4" /> Export Excel</button>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-700" title="Print Form"><Printer className="w-4 h-4" /> Print Form</button>
                <button onClick={handleSaveRecord} disabled={isSaving} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50" title="Save Record"><Save className="w-4 h-4" /> Save Record</button>
            </div>

            {/* A4 Paper Form */}
            <div className="a4-paper text-sm">

                {/* Header */}
                <div className="flex border-2 border-black mb-4 print-border-2">
                    <div className="w-[30%] border-r-2 border-black print-border p-4 flex items-center justify-center"><img src="https://img2.pic.in.th/pic/logo-neo.png" alt="Neo" className="max-h-20" /></div>
                    <div className="w-[70%] p-4 pl-6 flex flex-col justify-center">
                        <h2 className="text-lg font-bold">บริษัท นีโอสยาม โลจิสติกส์ แอนด์ ทรานสปอร์ต จำกัด</h2>
                        <h3 className="text-xs font-bold text-slate-700">NEOSIAM LOGISTICS & TRANSPORT CO., LTD.</h3>
                        <p className="text-xs text-slate-600 mt-1">Tax ID: 0105552087673 | Tel: 056-275-841</p>
                    </div>
                </div>

                <h1 className="text-lg font-bold text-center border-2 border-black py-2 mb-4 bg-slate-200 print:bg-transparent print-border-2">ใบแจ้งปัญหาระบบ (NCR) / ใบแจ้งปัญหารับสินค้าคืน</h1>

                {/* Form Header Info */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6">
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0">ถึงหน่วยงาน:</label>
                        <input type="text" className="input-line" value={formData.toDept} onChange={e => setFormData({ ...formData, toDept: e.target.value })} title="หน่วยงาน" />
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0">เลขที่ NCR:</label>
                        <div className="input-line bg-slate-100 px-2 font-mono font-bold text-center">{generatedNCRNumber || "Auto-Generated"}</div>
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0">วันที่:</label>
                        <input type="date" className="input-line" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} title="วันที่" />
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0">ผู้พบปัญหา:</label>
                        <div className="w-full border-b border-dotted border-slate-400">
                            <LineAutocomplete className="w-full" value={formData.founder} onChange={val => setFormData({ ...formData, founder: val })} options={uniqueFounders} />
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0">สำเนา:</label>
                        <input type="text" className="input-line" value={formData.copyTo} onChange={e => setFormData({ ...formData, copyTo: e.target.value })} title="สำเนาถึง" />
                    </div>
                    <div className="flex items-end gap-2">
                        <label className="font-bold w-24 shrink-0 whitespace-nowrap">เลขที่ PO/ผลิต:</label>
                        <input type="text" className="input-line" value={formData.poNo} onChange={e => setFormData({ ...formData, poNo: e.target.value })} title="เลขที่ใบสั่งซื้อ" />
                    </div>
                </div>

                {/* Section 1: Non-Conforming Items */}
                <div className="border-2 border-black mb-4 print-border-2">
                    <div className="bg-slate-200 print:bg-transparent border-b-2 border-black p-2 font-bold flex justify-between items-center print-border">
                        <span>1. รายการสินค้าที่พบปัญหา (Non-Conforming Items) *</span>
                        <button onClick={() => setShowItemModal(true)} className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs flex items-center gap-1 hover:bg-blue-700 no-print" title="เพิ่มรายการ"><Plus className="w-3 h-3" /> เพิ่มรายการ</button>
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-black text-center">
                                <th className="p-1 border-r border-black w-10">No.</th>
                                <th className="p-1 border-r border-black w-24">สาขาต้นทาง</th>
                                <th className="p-1 border-r border-black w-24">Ref/Neo Ref</th>
                                <th className="p-1 border-r border-black">สินค้า/ลูกค้า</th>
                                <th className="p-1 border-r border-black w-16">จำนวน</th>
                                <th className="p-1 border-r border-black w-20">ราคา/Exp</th>
                                <th className="p-1 border-r border-black w-32">วิเคราะห์ปัญหา</th>
                                <th className="p-1 w-8 no-print">ลบ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ncrItems.length === 0 ? (
                                <tr><td colSpan={8} className="py-4 text-center text-slate-400 italic">ยังไม่มีรายการสินค้า (กดปุ่ม '+ เพิ่มรายการ')</td></tr>
                            ) : (
                                ncrItems.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-black last:border-0 hover:bg-slate-50">
                                        <td className="p-1 text-center border-r border-black">{idx + 1}</td>
                                        <td className="p-1 text-center border-r border-black">{item.branch}</td>
                                        <td className="p-1 text-center border-r border-black">{item.refNo || '-'}<br /><span className="text-[10px] text-slate-500">{item.neoRefNo}</span></td>
                                        <td className="p-1 border-r border-black">
                                            <div className="font-bold">{item.productCode}</div>
                                            <div className="truncate max-w-[150px]">{item.productName}</div>
                                            <div className="text-[10px] text-slate-500">{item.customerName}</div>
                                        </td>
                                        <td className="p-1 text-center border-r border-black font-bold">{item.quantity} {item.unit}</td>
                                        <td className="p-1 text-center border-r border-black">{item.pricePerUnit}<br /><span className="text-[10px]">{item.expiryDate}</span></td>
                                        <td className="p-1 border-r border-black text-[10px]">
                                            {[
                                                item.problemDamaged && 'ชำรุด', item.problemDamagedInBox && 'ชำรุดในกล่อง', item.problemLost && 'สูญหาย', item.problemMixed && 'ปะปน',
                                                item.problemWrongInv && 'ผิด INV', item.problemLate && 'ส่งช้า', item.problemDuplicate && 'ส่งซ้ำ', item.problemWrong && 'ส่งผิด',
                                                item.problemIncomplete && 'ไม่ครบ', item.problemOver && 'เกิน', item.problemWrongInfo && 'ข้อมูลผิด', item.problemShortExpiry && 'อายุสั้น',
                                                item.problemTransportDamage && 'ขนส่งทำเสียหาย', item.problemAccident && 'อุบัติเหตุ', item.problemPOExpired && 'PO หมด',
                                                item.problemNoBarcode && 'No Barcode', item.problemNotOrdered && 'ไม่ได้สั่ง', item.problemOther && 'อื่นๆ'
                                            ].filter(Boolean).join(', ')}
                                            {item.hasCost && <div className="text-red-500 font-bold mt-1">Cost: {item.costAmount}</div>}
                                        </td>
                                        <td className="p-1 text-center no-print">
                                            <button onClick={() => confirmDelete(item.id)} className="text-red-500 hover:text-red-700" title="ลบ"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Problem Details & Attachments */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="border-2 border-black p-2 min-h-[100px] print-border-2">
                        <div className="font-bold mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> รูปภาพ / เอกสาร</div>
                        <div className="text-center text-slate-400 text-xs py-4 border-2 border-dashed border-slate-300 rounded mb-2 no-print">
                            รูปภาพ / เอกสาร
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" disabled checked={false} title="ตามแนบ" /> <span className="text-xs">ตามแนบ</span>
                        </div>
                    </div>
                    <div className="border-2 border-black p-2 min-h-[100px] print-border-2">
                        <div className="font-bold mb-2">รายละเอียดของปัญหาที่พบ (ผู้พบปัญหา)</div>
                        <textarea className="w-full h-20 text-xs resize-none outline-none border-0 bg-transparent" placeholder="รายละเอียด..." value={formData.problemDetail} onChange={e => setFormData({ ...formData, problemDetail: e.target.value })} title="รายละเอียดปัญหา"></textarea>
                    </div>
                </div>

                {/* Section 2: Problem Checklist & Actions (Standardized Layout) */}
                <div className="border-2 border-black mb-4 flex print-border-2">

                    {/* Left: Problems Checklist */}
                    <div className="w-1/2 border-r-2 border-black p-2 print-border">
                        <div className="font-bold mb-2 bg-slate-200 -mx-2 -mt-2 p-2 border-b-2 border-black print:bg-transparent print-border">พบปัญหาที่กระบวนการ *</div>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemDamaged} onChange={() => handleProblemSelection('problemDamaged')} title="ชำรุด" /> ชำรุด</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemDamagedInBox} onChange={() => handleProblemSelection('problemDamagedInBox')} title="ชำรุดในกล่อง" /> ชำรุดในกล่อง</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemLost} onChange={() => handleProblemSelection('problemLost')} title="สูญหาย" /> สูญหาย</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemMixed} onChange={() => handleProblemSelection('problemMixed')} title="สินค้าสลับ" /> สินค้าสลับ</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemWrongInv} onChange={() => handleProblemSelection('problemWrongInv')} title="สินค้าไม่ตรง INV." /> สินค้าไม่ตรง INV.</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemLate} onChange={() => handleProblemSelection('problemLate')} title="ส่งช้า" /> ส่งช้า</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemDuplicate} onChange={() => handleProblemSelection('problemDuplicate')} title="ส่งซ้ำ" /> ส่งซ้ำ</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemWrong} onChange={() => handleProblemSelection('problemWrong')} title="ส่งผิด" /> ส่งผิด</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemIncomplete} onChange={() => handleProblemSelection('problemIncomplete')} title="ส่งของไม่ครบ" /> ส่งของไม่ครบ</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemOver} onChange={() => handleProblemSelection('problemOver')} title="ส่งของเกิน" /> ส่งของเกิน</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemWrongInfo} onChange={() => handleProblemSelection('problemWrongInfo')} title="ข้อมูลผิด" /> ข้อมูลผิด</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemShortExpiry} onChange={() => handleProblemSelection('problemShortExpiry')} title="สินค้าอายุสั้น" /> สินค้าอายุสั้น</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemTransportDamage} onChange={() => handleProblemSelection('problemTransportDamage')} title="สินค้าเสียหายบนรถขนส่ง" /> สินค้าเสียหายบนรถขนส่ง</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemAccident} onChange={() => handleProblemSelection('problemAccident')} title="อุบัติเหตุ" /> อุบัติเหตุ</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemPOExpired} onChange={() => handleProblemSelection('problemPOExpired')} title="PO. หมดอายุ" /> PO. หมดอายุ</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemNoBarcode} onChange={() => handleProblemSelection('problemNoBarcode')} title="บาร์โค๊ตไม่ขึ้น" /> บาร์โค๊ตไม่ขึ้น</label>
                            <label className="flex gap-2"><input type="checkbox" checked={formData.problemNotOrdered} onChange={() => handleProblemSelection('problemNotOrdered')} title="ไม่ได้สั่งสินค้า" /> ไม่ได้สั่งสินค้า</label>
                            <div className="col-span-2 flex items-center gap-2 mt-1">
                                <label className="flex gap-2 whitespace-nowrap"><input type="checkbox" checked={formData.problemOther} onChange={() => handleProblemSelection('problemOther')} title="อื่นๆ" /> อื่นๆ</label>
                                <input type="text" className="input-line text-xs" placeholder="รายละเอียด" value={formData.problemOtherText} onChange={e => setFormData({ ...formData, problemOtherText: e.target.value })} title="ระบุปัญหาอื่นๆ" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-1/2 p-2">
                        <div className="font-bold mb-2 bg-slate-200 -mx-2 -mt-2 p-2 border-b-2 border-black print:bg-transparent print-border">การดำเนินการ</div>
                        <div className="text-xs space-y-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.actionReject} onChange={() => handleActionSelection('actionReject')} title="ส่งคืน" /> <span className="font-bold w-24">ส่งคืน (Reject)</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionRejectQty || ''} onChange={e => setFormData({ ...formData, actionRejectQty: parseInt(e.target.value) || 0 })} title="จำนวนส่งคืน" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.actionRejectSort} onChange={() => handleActionSelection('actionRejectSort')} title="คัดแยก" /> <span className="font-bold w-24">คัดแยกของเสียเพื่อส่งคืน</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionRejectSortQty || ''} onChange={e => setFormData({ ...formData, actionRejectSortQty: parseInt(e.target.value) || 0 })} title="จำนวนคัดแยก" />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="checkbox" checked={formData.actionRework} onChange={() => handleActionSelection('actionRework')} title="แก้ไข" /> <span className="font-bold w-24">แก้ไข (Rework)</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionReworkQty || ''} onChange={e => setFormData({ ...formData, actionReworkQty: parseInt(e.target.value) || 0 })} title="จำนวนแก้ไข" />
                                <div className="w-full flex items-center gap-2 pl-6">
                                    <span className="whitespace-nowrap">วิธีการแก้ไข</span>
                                    <input type="text" className="input-line" value={formData.actionReworkMethod} onChange={e => setFormData({ ...formData, actionReworkMethod: e.target.value })} title="วิธ๊การแก้ไข" />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <input type="checkbox" checked={formData.actionSpecialAcceptance} onChange={() => handleActionSelection('actionSpecialAcceptance')} title="ยอมรับพิเศษ" /> <span className="font-bold w-24">ยอมรับกรณีพิเศษ</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionSpecialAcceptanceQty || ''} onChange={e => setFormData({ ...formData, actionSpecialAcceptanceQty: parseInt(e.target.value) || 0 })} title="จำนวนยอมรับพิเศษ" />
                                <div className="w-full flex items-center gap-2 pl-6">
                                    <span className="whitespace-nowrap">เหตุผลในการยอมรับ</span>
                                    <input type="text" className="input-line" value={formData.actionSpecialAcceptanceReason} onChange={e => setFormData({ ...formData, actionSpecialAcceptanceReason: e.target.value })} title="เหตุผล" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.actionScrap} onChange={() => handleActionSelection('actionScrap')} title="ทำลาย" /> <span className="font-bold w-24">ทำลาย (Scrap)</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionScrapQty || ''} onChange={e => setFormData({ ...formData, actionScrapQty: parseInt(e.target.value) || 0 })} title="จำนวนทำลาย" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.actionReplace} onChange={() => handleActionSelection('actionReplace')} title="เปลี่ยนสินค้าใหม่" /> <span className="font-bold w-24">เปลี่ยนสินค้าใหม่</span>
                                <span className="whitespace-nowrap">จำนวน:</span>
                                <input type="number" className="input-line w-16 text-center" value={formData.actionReplaceQty || ''} onChange={e => setFormData({ ...formData, actionReplaceQty: parseInt(e.target.value) || 0 })} title="จำนวนเปลี่ยนสินค้า" />
                            </div>
                            <div className="flex items-end gap-2 mt-2 pt-2 border-t border-dotted border-slate-400">
                                <span className="font-bold">กำหนดแล้วเสร็จ</span>
                                <input type="date" className="input-line w-32" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} title="กำหนดแล้วเสร็จ" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 4: Cause & Prevention */}
                <div className="border-2 border-black mb-4 print-border-2">
                    <div className="bg-slate-200 print:bg-transparent border-b-2 border-black p-2 font-bold print-border">สาเหตุ-การป้องกัน (ผู้รับผิดชอบปัญหา)</div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="border-r border-black pr-4">
                            <div className="font-bold mb-2 text-xs">สาเหตุเกิดจาก *</div>
                            <div className="flex flex-wrap gap-4 text-xs mb-3">
                                <label className="flex gap-2"><input type="checkbox" checked={formData.causePackaging} onChange={() => setFormData({ ...formData, causePackaging: !formData.causePackaging })} title="บรรจุภัณฑ์" /> บรรจุภัณฑ์</label>
                                <label className="flex gap-2"><input type="checkbox" checked={formData.causeTransport} onChange={() => setFormData({ ...formData, causeTransport: !formData.causeTransport })} title="การขนส่ง" /> การขนส่ง</label>
                                <label className="flex gap-2"><input type="checkbox" checked={formData.causeOperation} onChange={() => setFormData({ ...formData, causeOperation: !formData.causeOperation })} title="ปฏิบัติงาน" /> ปฏิบัติงาน</label>
                                <label className="flex gap-2"><input type="checkbox" checked={formData.causeEnv} onChange={() => setFormData({ ...formData, causeEnv: !formData.causeEnv })} title="สิ่งแวดล้อม" /> สิ่งแวดล้อม</label>
                            </div>
                            <div className="text-xs">
                                <div className="font-bold mb-1">รายละเอียดสาเหตุ :</div>
                                <textarea className="w-full h-16 resize-none input-line bg-transparent" value={formData.causeDetail} onChange={e => setFormData({ ...formData, causeDetail: e.target.value })} title="รายละเอียดสาเหตุ"></textarea>
                            </div>
                        </div>
                        <div>
                            <div className="text-xs h-full flex flex-col">
                                <div className="font-bold mb-1">แนวทางป้องกัน :</div>
                                <textarea className="w-full flex-1 resize-none input-line bg-transparent mb-2" value={formData.preventionDetail} onChange={e => setFormData({ ...formData, preventionDetail: e.target.value })} title="แนวทางป้องกัน"></textarea>
                                <div className="flex items-end gap-2">
                                    <span className="font-bold">กำหนดการป้องกันแล้วเสร็จ</span>
                                    <input type="date" className="input-line w-32" value={formData.preventionDueDate} onChange={e => setFormData({ ...formData, preventionDueDate: e.target.value })} title="กำหนดป้องกันแล้วเสร็จ" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures Row */}
                <div className="flex border-2 border-black h-32 mb-4 print-border-2">
                    <div className="w-1/4 border-r-2 border-black p-2 flex flex-col justify-between items-center print-border">
                        <div className="text-xs font-bold text-center w-full">ผู้อนุมัติ (Approver)</div>
                        <div className="text-center w-full">
                            <input type="text" className="input-line text-center mb-1" placeholder="(ลงชื่อ)" value={formData.approver} onChange={e => setFormData({ ...formData, approver: e.target.value })} title="ลงชื่อผู้อนุมัติ" />
                            <input type="text" className="input-line text-center text-xs mb-1" placeholder="ตำแหน่ง" value={formData.approverPosition} onChange={e => setFormData({ ...formData, approverPosition: e.target.value })} title="ตำแหน่ง" />
                            <div className="flex justify-center items-center gap-1 text-xs">
                                <span>วันที่</span>
                                <input type="date" className="input-line w-24 text-center" value={formData.approverDate} onChange={e => setFormData({ ...formData, approverDate: e.target.value })} title="วันที่อนุมัติ" />
                            </div>
                        </div>
                    </div>
                    <div className="w-1/4 border-r-2 border-black p-2 flex flex-col justify-between items-center print-border">
                        <div className="text-xs font-bold text-center w-full">ผู้รับผิดชอบ (Responsible)</div>
                        <div className="text-center w-full">
                            <input type="text" className="input-line text-center mb-1" placeholder="(ลงชื่อ)" value={formData.responsiblePerson} onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })} title="ลงชื่อผู้รับผิดชอบ" />
                            <input type="text" className="input-line text-center text-xs mb-1" placeholder="ตำแหน่ง" value={formData.responsiblePosition} onChange={e => setFormData({ ...formData, responsiblePosition: e.target.value })} title="ตำแหน่ง" />
                            <div className="flex justify-center items-center gap-1 text-xs">
                                <span>วันที่</span>
                                <input type="date" className="input-line w-24 text-center" title="วันที่รับผิดชอบ" />
                            </div>
                        </div>
                    </div>
                    <div className="w-2/4 p-2 text-[10px] italic">
                        หมายเหตุ : เมื่อทาง Supplier/Out source หรือหน่วยงานผู้รับผิดชอบปัญหา ได้รับเอกสารใบ NCR กรุณาระบุสาเหตุ-การป้องกัน และตอบกลับมายังแผนกประกันคุณภาพ ภายใน 1 สัปดาห์
                    </div>
                </div>

                {/* Tracking & Closure */}
                <div className="border-2 border-black print-border-2">
                    <div className="bg-slate-200 print:bg-transparent border-b-2 border-black p-2 font-bold text-center print-border">การตรวจติดตามและการปิด NCR</div>
                    <div className="flex h-32 divide-x-2 divide-black">
                        <div className="w-1/3 p-2 flex flex-col justify-center">
                            <label className="flex gap-2 items-center mb-2"><input type="checkbox" checked={formData.qaAccept} onChange={() => setFormData({ ...formData, qaAccept: true, qaReject: false })} title="ยอมรับ" /> ยอมรับแนวทางการป้องกัน</label>
                            <label className="flex gap-2 items-center mb-2"><input type="checkbox" checked={formData.qaReject} onChange={() => setFormData({ ...formData, qaAccept: false, qaReject: true })} title="ไม่ยอมรับ" /> ไม่ยอมรับแนวทางการป้องกัน</label>
                            <input type="text" className="input-line text-xs" placeholder="ระบุเหตุผล (ถ้ามี)" value={formData.qaReason} onChange={e => setFormData({ ...formData, qaReason: e.target.value })} title="เหตุผล" />
                        </div>
                        <div className="w-1/3 p-2 flex flex-col justify-between items-center">
                            <div className="text-xs font-bold text-center w-full">ผู้ตรวจติดตาม</div>
                            <div className="text-center w-full mt-auto">
                                <div className="border-b border-dotted border-black w-3/4 mx-auto mb-1 h-6"></div>
                                <div className="text-xs font-bold">แผนกประกันคุณภาพ</div>
                                <div className="text-[10px]">วันที่ ...../...../..........</div>
                            </div>
                        </div>
                        <div className="w-1/3 p-2 flex flex-col justify-between items-center">
                            <div className="text-xs font-bold text-center w-full">ผู้อนุมัติปิดการตรวจติดตาม</div>
                            <div className="text-center w-full mt-auto">
                                <div className="border-b border-dotted border-black w-3/4 mx-auto mb-1 h-6"></div>
                                <div className="text-xs font-bold">กรรมการผู้จัดการ</div>
                                <div className="text-[10px]">วันที่ ...../...../..........</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ITEM MODAL - Same as before but consistent style */}
            {showItemModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" /> เพิ่มรายการสินค้า</h3>
                            <button onClick={() => setShowItemModal(false)} title="ปิด"><X className="w-6 h-6 text-slate-400 hover:text-red-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* 1. Basic Info */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h4 className="font-bold text-slate-700">ข้อมูลสินค้า (Item Details - NCR)</h4>
                                    <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">รายการที่ {ncrItems.length + 1}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1">เลขที่อ้างอิง (Ref No.) <span className="text-red-500">*</span></label>
                                        <input type="text" className="w-full p-2 border rounded text-xs" placeholder="ระบุเลขที่บิล..." value={newItem.refNo} onChange={e => setNewItem({ ...newItem, refNo: e.target.value })} title="เลขที่อ้างอิง" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">Neo Ref No. (Optional)</label>
                                        <input type="text" className="w-full p-2 border rounded text-xs" placeholder="เลขที่ Neo..." value={newItem.neoRefNo} onChange={e => setNewItem({ ...newItem, neoRefNo: e.target.value })} title="Neo Ref No" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-1">รหัสสินค้า (Product Code)</label>
                                        <input type="text" className="w-full p-2 border rounded text-xs" value={newItem.productCode} onChange={e => setNewItem({ ...newItem, productCode: e.target.value })} title="รหัสสินค้า" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">ชื่อสินค้า (Product Name)</label>
                                        <input type="text" className="w-full p-2 border rounded text-xs" value={newItem.productName} onChange={e => setNewItem({ ...newItem, productName: e.target.value })} title="ชื่อสินค้า" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1">จำนวน <span className="text-red-500">*</span></label>
                                            <input type="number" className="w-full p-2 border rounded text-xs" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })} title="จำนวน" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">หน่วย</label>
                                            <input type="text" className="w-full p-2 border rounded text-xs" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} title="หน่วย" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1">ราคา/หน่วย (Price/Unit)</label>
                                            <input type="number" className="w-full p-2 border rounded text-xs" value={newItem.pricePerUnit} onChange={e => setNewItem({ ...newItem, pricePerUnit: parseFloat(e.target.value) })} title="ราคาต่อหน่วย" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1">วันหมดอายุ</label>
                                            <input type="date" className="w-full p-2 border rounded text-xs" value={newItem.expiryDate} onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })} title="วันหมดอายุ" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold mb-1">ราคาหน้าบิลรวม (Total Price Bill)</label>
                                        <input type="number" className="w-full p-2 border rounded text-xs bg-slate-50" value={newItem.priceBill} onChange={e => setNewItem({ ...newItem, priceBill: parseFloat(e.target.value) })} title="ราคาหน้าบิลรวม" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1">ราคาขาย (Price Sell)</label>
                                        <input type="number" className="w-full p-2 border rounded text-xs bg-slate-50" value={newItem.priceSell} onChange={e => setNewItem({ ...newItem, priceSell: parseFloat(e.target.value) })} title="ราคาขาย" />
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold mb-1">สาขา</label>
                                        <input type="text" className="w-full p-2 border rounded text-xs" value={newItem.branch} onChange={e => setNewItem({ ...newItem, branch: e.target.value })} title="สาขา" />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Return Route */}
                            <div className="p-4 bg-slate-50 border rounded-lg">
                                <label className="block text-sm font-bold mb-3 text-slate-700">เลือกเส้นทางส่งคืน (Select Route) <span className="text-red-500">*</span></label>
                                <div className="space-y-2">
                                    {RETURN_ROUTES.map(r => (
                                        <label key={r} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-all hover:shadow-sm">
                                            <input type="radio" name="route" className="w-4 h-4 text-indigo-600" checked={newItem.preliminaryRoute === r} onChange={() => setNewItem({ ...newItem, preliminaryRoute: r })} title={r} />
                                            <span className="font-medium text-slate-700">{r}</span>
                                        </label>
                                    ))}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition-all hover:shadow-sm">
                                            <input type="radio" name="route" className="w-4 h-4 text-indigo-600" checked={newItem.preliminaryRoute === 'Other'} onChange={() => setNewItem({ ...newItem, preliminaryRoute: 'Other' })} title="อื่นๆ (Other)" />
                                            <span className="font-medium text-slate-700">อื่นๆ (Other)</span>
                                        </label>
                                        {newItem.preliminaryRoute === 'Other' && (
                                            <input
                                                type="text"
                                                className="w-full p-2 ml-8 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500 animate-fade-in"
                                                placeholder="โปรดระบุเส้นทางอื่นๆ..."
                                                // We might need a separate state for the custom text or just assume preliminaryRoute holds the value.
                                                // However, maintaining 'Other' as the flag is cleaner for UI logic.
                                                // Let's use a temporary property or append it?
                                                // Actually, best practice in this form pattern is usually:
                                                // maintaining 'Other' in preliminaryRoute state variable, and maybe concatenating on save, OR
                                                // having a separate `preliminaryRouteDetail` field.
                                                // For now, let's keep it simple: assume user types here and we might need to handle it.
                                                // BUT WAIT, ReturnRequest usually handles this by just letting the user type.
                                                // Let's check how ReturnRequest does it -> It usually has a separate state or overrides the value.
                                                // Given the constraint, I'll add a simple input that updates `problemOtherText` or similar, BUT
                                                // since `preliminaryRoute` is a string, let's allow it to be 'Other' and maybe save the detail elsewhere?
                                                // Better approach for THIS specific form: Let's assume the user wants to type the actual route NAME if it's other.
                                                // So if they type "Kerry", the route becomes "Kerry"? No, that breaks the radio button logic.
                                                // Let's stick to the visual first: Input box appears.
                                                // We will reuse `problemOtherText` temporarily or add a specific field if strictly needed,
                                                // BUT `ReturnRecord` has `preliminaryRoute` as string.
                                                // Let's update a new specific field `newItem.preliminaryRouteDetail` (which I might need to add to state if not exists)
                                                // OR, just use the `preliminaryRoute` to store 'Other: [Detail]'?
                                                // Let's add a specific input that updates the `preliminaryRoute` to "Other: [Value]"?
                                                // No, that makes edits hard.
                                                // I will add a `preliminaryRouteOther` field to the state locally to capture this.
                                                value={(newItem as any).preliminaryRouteOther || ''}
                                                onChange={(e) => setNewItem({ ...newItem, preliminaryRoute: 'Other', ['preliminaryRouteOther' as any]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Problem Analysis & Details (Exact Match to Return Request) */}
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-white border-slate-200">
                                <div className="bg-slate-100 px-4 py-2 border-b font-bold text-slate-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" /> รายละเอียดของปัญหา (Problem Details)
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Image Upload */}
                                    <div className="border-r border-slate-200 pr-4">
                                        <div className="flex flex-col items-center justify-center text-slate-400 min-h-[150px] border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors relative">
                                            <input type="file" title="อัพโหลดรูป" multiple accept="image/*" onChange={handleItemImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                            <span className="text-xs font-bold">อัพโหลดรูปภาพ</span>
                                        </div>
                                        {newItem.images && newItem.images.length > 0 && (
                                            <div className="grid grid-cols-3 gap-2 mt-4">
                                                {newItem.images.map((img, idx) => (
                                                    <div key={idx} className="relative group aspect-square bg-slate-100 rounded overflow-hidden border border-slate-200">
                                                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                                        <button onClick={() => handleItemRemoveImage(idx)} type="button" className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl hover:bg-red-600" title="ลบ"><X className="w-3 h-3" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Analysis Source */}
                                    <div className="md:col-span-2 space-y-4">
                                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                            <div className="mb-2 font-bold text-slate-800 text-sm border-b pb-1">วิเคราะห์ปัญหาเกิดจาก (Problem Source) <span className="text-red-500">*</span></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                {['Customer', 'DestinationCustomer', 'Accounting', 'Keying'].map(opt => (
                                                    <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                                        <input type="radio" name="problemAnalysis" checked={newItem.problemAnalysis === opt} onChange={() => setNewItem({ ...newItem, problemAnalysis: opt as any, problemSource: opt })} className="w-4 h-4 text-blue-600" title={opt} />
                                                        {opt}
                                                    </label>
                                                ))}

                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                                        <input type="radio" name="problemAnalysis" checked={newItem.problemAnalysis === 'Warehouse'} onChange={() => setNewItem({ ...newItem, problemAnalysis: 'Warehouse', problemSource: 'Warehouse' })} className="w-4 h-4 text-blue-600" title="Warehouse" />
                                                        ภายในคลังสินค้า (Warehouse)
                                                    </label>
                                                    {newItem.problemAnalysis === 'Warehouse' && (
                                                        <div className="ml-6 mt-1 p-2 bg-white border rounded grid grid-cols-2 gap-2 animate-fade-in">
                                                            <select className="border rounded p-1" value={newItem.branch} onChange={e => setNewItem({ ...newItem, branch: e.target.value })} title="สาขา"><option value="">-- สาขา --</option>{['พิษณุโลก', 'กำแพงเพชร', 'แม่สอด', 'เชียงใหม่', 'EKP ลำปาง', 'นครสวรรค์', 'สาย 3', 'คลอง 13', 'ซีโน่', 'ประดู่'].map(b => <option key={b} value={b}>{b}</option>)}</select>
                                                            <div className="flex flex-col">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {['เช็คเกอร์', 'พนักงานลงสินค้า', 'อื่นๆ'].map(c => <label key={c} className="flex gap-1"><input type="radio" name="whCause" checked={newItem.problemAnalysisCause === c} onChange={() => setNewItem({ ...newItem, problemAnalysisCause: c })} /> {c}</label>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="col-span-1 md:col-span-2">
                                                    <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                                        <input type="radio" name="problemAnalysis" checked={newItem.problemAnalysis === 'Transport'} onChange={() => setNewItem({ ...newItem, problemAnalysis: 'Transport', problemSource: 'Transport' })} className="w-4 h-4 text-blue-600" title="Transport" />
                                                        ระหว่างขนส่ง (Transport)
                                                    </label>
                                                    {newItem.problemAnalysis === 'Transport' && (
                                                        <div className="ml-6 mt-1 p-2 bg-white border rounded flex gap-4 animate-fade-in">
                                                            {['CompanyDriver', 'JointTransport', 'Other'].map(t => <label key={t} className="flex gap-1"><input type="radio" name="transType" checked={newItem.problemAnalysisSub === t} onChange={() => setNewItem({ ...newItem, problemAnalysisSub: t })} /> {t}</label>)}
                                                        </div>
                                                    )}
                                                </div>

                                                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded md:col-span-2">
                                                    <input type="radio" name="problemAnalysis" checked={newItem.problemAnalysis === 'Other'} onChange={() => setNewItem({ ...newItem, problemAnalysis: 'Other', problemSource: 'Other' })} className="w-4 h-4 text-blue-600" title="Other" />
                                                    อื่นๆ (Other)
                                                </label>
                                                {newItem.problemAnalysis === 'Other' && (
                                                    <input
                                                        type="text"
                                                        className="md:col-span-2 w-full p-2 ml-6 border border-slate-300 rounded text-xs outline-none focus:ring-2 focus:ring-blue-500 animate-fade-in"
                                                        placeholder="ระบุรายละเอียดสาเหตุอื่นๆ..."
                                                        value={newItem.problemAnalysisDetail || ''}
                                                        onChange={e => setNewItem({ ...newItem, problemAnalysisDetail: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div className="col-span-2 font-bold mb-1 underline">พบปัญหาที่กระบวนการ (Found Problems)</div>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemDamaged} onChange={() => handleItemProblemSelection('problemDamaged')} title="ชำรุด" /> ชำรุด</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemDamagedInBox} onChange={() => handleItemProblemSelection('problemDamagedInBox')} title="ชำรุดในกล่อง" /> ชำรุดในกล่อง</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemLost} onChange={() => handleItemProblemSelection('problemLost')} title="สูญหาย" /> สูญหาย</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemMixed} onChange={() => handleItemProblemSelection('problemMixed')} title="สินค้าสลับ" /> สินค้าสลับ</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemWrongInv} onChange={() => handleItemProblemSelection('problemWrongInv')} title="สินค้าไม่ตรง INV" /> สินค้าไม่ตรง INV</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemLate} onChange={() => handleItemProblemSelection('problemLate')} title="ส่งช้า" /> ส่งช้า</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemDuplicate} onChange={() => handleItemProblemSelection('problemDuplicate')} title="ส่งซ้ำ" /> ส่งซ้ำ</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemWrong} onChange={() => handleItemProblemSelection('problemWrong')} title="ส่งผิด" /> ส่งผิด</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemIncomplete} onChange={() => handleItemProblemSelection('problemIncomplete')} title="ส่งของไม่ครบ" /> ส่งของไม่ครบ</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemOver} onChange={() => handleItemProblemSelection('problemOver')} title="ส่งของเกิน" /> ส่งของเกิน</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemWrongInfo} onChange={() => handleItemProblemSelection('problemWrongInfo')} title="ข้อมูลผิด" /> ข้อมูลผิด</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemShortExpiry} onChange={() => handleItemProblemSelection('problemShortExpiry')} title="สินค้าอายุสั้น" /> สินค้าอายุสั้น</label>
                                            <label className="flex gap-2"><input type="checkbox" checked={newItem.problemTransportDamage} onChange={() => handleItemProblemSelection('problemTransportDamage')} title="เสียหายบนรถ" /> เสียหายบนรถ</label>
                                            <div className="flex gap-2 col-span-2 items-center">
                                                <label className="flex gap-2 whitespace-nowrap"><input type="checkbox" checked={newItem.problemOther} onChange={() => handleItemProblemSelection('problemOther')} title="อื่นๆ" /> อื่นๆ</label>
                                                {newItem.problemOther && (
                                                    <input
                                                        type="text"
                                                        className="w-full border-b border-dotted border-slate-400 bg-transparent outline-none text-slate-700 animate-fade-in"
                                                        placeholder="ระบุปัญหา..."
                                                        value={newItem.problemOtherText || ''}
                                                        onChange={e => setNewItem({ ...newItem, problemOtherText: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-1 md:col-span-3">
                                        <textarea className="w-full p-2 border rounded text-xs" rows={2} placeholder="รายละเอียดปัญหาเพิ่มเติม..." value={newItem.problemDetail} onChange={e => setNewItem({ ...newItem, problemDetail: e.target.value })} title="รายละเอียดปัญหา"></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Action Selection (Match Return Request Layout) */}
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-white border-indigo-100">
                                <div className="bg-indigo-50 px-4 py-2 border-b font-bold text-indigo-700 flex items-center gap-2">
                                    <PenTool className="w-4 h-4" /> การดำเนินการ (Action)
                                </div>
                                <div className="p-4 space-y-3 text-xs">
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionReject} onChange={() => handleItemActionSelection('actionReject')} title="Reject" />
                                            <span className="font-bold">ส่งคืน (Reject)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionRejectQty || ''} onChange={e => setNewItem({ ...newItem, actionRejectQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionRejectSort} onChange={() => handleItemActionSelection('actionRejectSort')} title="Sort" />
                                            <span className="font-bold">คัดแยกของเสีย</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionRejectSortQty || ''} onChange={e => setNewItem({ ...newItem, actionRejectSortQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionRework} onChange={() => handleItemActionSelection('actionRework')} title="Rework" />
                                            <span className="font-bold">แก้ไข (Rework)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionReworkQty || ''} onChange={e => setNewItem({ ...newItem, actionReworkQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                        <input type="text" className="flex-1 p-1 border-b border-dotted" placeholder="วิธีการแก้ไข..." value={newItem.actionReworkMethod} onChange={e => setNewItem({ ...newItem, actionReworkMethod: e.target.value })} title="วิธีแก้ไข" />
                                    </div>
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionSpecialAcceptance} onChange={() => handleItemActionSelection('actionSpecialAcceptance')} title="Special" />
                                            <span className="font-bold">ยอมรับกรณีพิเศษ</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionSpecialAcceptanceQty || ''} onChange={e => setNewItem({ ...newItem, actionSpecialAcceptanceQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                        <input type="text" className="flex-1 p-1 border-b border-dotted" placeholder="เหตุผล..." value={newItem.actionSpecialAcceptanceReason} onChange={e => setNewItem({ ...newItem, actionSpecialAcceptanceReason: e.target.value })} title="เหตุผล" />
                                    </div>
                                    <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionScrap} onChange={() => handleItemActionSelection('actionScrap')} title="Scrap" />
                                            <span className="font-bold">ทำลาย (Scrap)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionScrapQty || ''} onChange={e => setNewItem({ ...newItem, actionScrapQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 w-1/3">
                                            <input type="checkbox" checked={newItem.actionReplace} onChange={() => handleItemActionSelection('actionReplace')} title="Replace" />
                                            <span className="font-bold">เปลี่ยนสินค้าใหม่</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">จำนวน:</span>
                                            <input type="number" className="w-20 p-1 border rounded text-center" value={newItem.actionReplaceQty || ''} onChange={e => setNewItem({ ...newItem, actionReplaceQty: parseInt(e.target.value) })} title="Qty" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 5. Cost Tracking & Responsible (Auto-Mapped) */}
                            <div className="border rounded-xl overflow-hidden shadow-sm bg-white border-red-100">
                                <div className="bg-red-50 px-4 py-2 border-b font-bold text-red-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> ค่าใช้จ่ายและการชดเชย (Cost & Settlement)
                                </div>
                                <div className="p-4 space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={newItem.hasCost} onChange={e => setNewItem({ ...newItem, hasCost: e.target.checked })} className="w-4 h-4" title="มีค่าใช้จ่าย" />
                                        <span className="font-bold text-red-600">มีค่าใช้จ่าย (Has Cost)</span>
                                    </label>

                                    {newItem.hasCost && (
                                        <div className="grid grid-cols-2 gap-4 animate-fade-in pl-6 bg-red-50/50 p-2 rounded">
                                            <div>
                                                <label className="block text-xs font-bold mb-1">สาเหตุ (Source)</label>
                                                <input type="text" className="w-full p-2 border rounded text-xs bg-slate-100" value={newItem.problemAnalysis || '-'} readOnly title="Source" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">ผู้รับผิดชอบ (Responsible)</label>
                                                <input type="text" className="w-full p-2 border rounded text-xs bg-slate-100 font-bold text-blue-700" value={newItem.costResponsible || '-'} readOnly title="Responsible" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1">จำนวนเงิน (บาท)</label>
                                                <input type="number" className="w-full p-2 border rounded text-xs" value={newItem.costAmount} onChange={e => setNewItem({ ...newItem, costAmount: parseFloat(e.target.value) })} title="Cost Amount" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={newItem.isFieldSettled} onChange={e => setNewItem({ ...newItem, isFieldSettled: e.target.checked })} className="w-4 h-4" />
                                            <span className="font-bold text-sm">จบงานหน้างาน / พนักงานชดเชยเงิน (Field Settlement)</span>
                                        </label>

                                        {newItem.isFieldSettled && (
                                            <div className="mt-3 pl-6 grid grid-cols-2 gap-4 animate-fade-in text-xs">
                                                <div>
                                                    <label className="block font-bold mb-1">จำนวนเงิน (Amount)</label>
                                                    <input type="number" className="w-full p-2 border rounded" value={newItem.fieldSettlementAmount} onChange={e => setNewItem({ ...newItem, fieldSettlementAmount: parseFloat(e.target.value) })} title="Amount" />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">หลักฐานโอนเงิน</label>
                                                    <input type="text" className="w-full p-2 border rounded" placeholder="URL/Note..." value={newItem.fieldSettlementEvidence} onChange={e => setNewItem({ ...newItem, fieldSettlementEvidence: e.target.value })} title="Evidence" />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">ชื่อพนักงาน</label>
                                                    <input type="text" className="w-full p-2 border rounded" value={newItem.fieldSettlementName} onChange={e => setNewItem({ ...newItem, fieldSettlementName: e.target.value })} title="Name" />
                                                </div>
                                                <div>
                                                    <label className="block font-bold mb-1">ตำแหน่ง</label>
                                                    <input type="text" className="w-full p-2 border rounded" value={newItem.fieldSettlementPosition} onChange={e => setNewItem({ ...newItem, fieldSettlementPosition: e.target.value })} title="Position" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                            <button onClick={() => setShowItemModal(false)} className="px-4 py-2 border rounded text-slate-600 font-bold hover:bg-slate-200" title="ยกเลิก">ยกเลิก</button>
                            <button onClick={() => handleAddItem(true)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow-lg" title="บันทึกรายการ">บันทึกรายการ</button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Confirmation Modals */}
            {
                showConfirmModal && (
                    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                            <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">ยืนยันการบันทึก</h3>
                            <p className="text-sm text-slate-500 mb-6">ต้องการบันทึกข้อมูลเข้าระบบหรือไม่?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-slate-50" title="ยกเลิก">ยกเลิก</button>
                                <button onClick={executeSave} disabled={isSaving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2" title="ยืนยัน">
                                    {isSaving && <Loader className="w-4 h-4 animate-spin" />} ยืนยัน
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showResultModal && saveResult && (
                    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                            {saveResult.success ? <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" /> : <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />}
                            <h3 className="text-lg font-bold mb-2">{saveResult.success ? 'สำเร็จ!' : 'ผิดพลาด'}</h3>
                            <p className="text-sm text-slate-500 mb-4 whitespace-pre-line">{saveResult.message}</p>
                            <button onClick={() => { setShowResultModal(false); if (saveResult.success) { setNcrItems([]); setFormData(initialFormData); setGeneratedNCRNumber(''); } }} className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700" title="ตกลง">ตกลง</button>
                        </div>
                    </div>
                )
            }

            {
                showAuthModal && (
                    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs text-center animate-fade-in-up">
                            <Lock className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-4">Admin Authentication</h3>
                            <input type="password" autoFocus className="w-full p-2 text-center text-xl border rounded mb-4 tracking-widest" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()} title="Password" />
                            <div className="flex gap-2">
                                <button onClick={() => setShowAuthModal(false)} className="flex-1 py-2 border rounded hover:bg-slate-50" title="Cancel">Cancel</button>
                                <button onClick={handleAuthSubmit} className="flex-1 py-2 bg-slate-800 text-white rounded hover:bg-slate-900" title="Confirm">Confirm</button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default NCRSystem;
