import React from 'react';
import { FileInput, PlusCircle, AlertTriangle, Box, ImageIcon, Trash2, Save, Search, Wrench, ClipboardList } from 'lucide-react';
import { AutocompleteInput } from './AutocompleteInput';
import { ReturnRecord } from '../../../types';
import { BRANCH_LIST } from '../../../constants';
import { RESPONSIBLE_MAPPING } from '../utils';

interface Step1RequestProps {
    formData: Partial<ReturnRecord>;
    requestItems: Partial<ReturnRecord>[];
    isCustomBranch: boolean;
    uniqueCustomers: string[];
    uniqueDestinations: string[];
    uniqueProductCodes: string[];
    uniqueProductNames: string[];
    initialData?: Partial<ReturnRecord> | null;

    setFormData: React.Dispatch<React.SetStateAction<Partial<ReturnRecord>>>;
    setIsCustomBranch: (val: boolean) => void;
    setRequestItems: React.Dispatch<React.SetStateAction<Partial<ReturnRecord>[]>>;

    handleAddItem: (e: React.FormEvent) => void;
    handleRemoveItem: (index: number) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveImage: (index: number) => void;
    handleRequestSubmit: () => void;
}

export const Step1Request: React.FC<Step1RequestProps> = ({
    formData, requestItems, isCustomBranch,
    uniqueCustomers, uniqueDestinations, uniqueProductCodes, uniqueProductNames,
    initialData,
    setFormData, setIsCustomBranch, setRequestItems,
    handleAddItem, handleRemoveItem, handleImageUpload, handleRemoveImage, handleRequestSubmit
}) => {
    const handleCauseSelection = (field: keyof ReturnRecord) => {
        setFormData(prev => {
            const isCurrentlyChecked = prev[field] as boolean;
            const newValue = !isCurrentlyChecked;
            if (newValue) {
                return { ...prev, causePackaging: false, causeTransport: false, causeOperation: false, causeEnv: false, [field]: true };
            } else {
                return { ...prev, [field]: false };
            }
        });
    };

    const handleProblemSelection = (field: keyof ReturnRecord) => {
        setFormData(prev => {
            const isCurrentlyChecked = prev[field] as boolean;
            const newValue = !isCurrentlyChecked;
            if (newValue) {
                // Must uncheck ALL other problem fields
                return {
                    ...prev,
                    problemDamaged: false,
                    problemDamagedInBox: false,
                    problemLost: false,
                    problemMixed: false,
                    problemWrongInv: false,
                    problemLate: false,
                    problemDuplicate: false,
                    problemWrong: false,
                    problemIncomplete: false,
                    problemOver: false,
                    problemWrongInfo: false,
                    problemShortExpiry: false,
                    problemTransportDamage: false,
                    problemAccident: false,
                    problemPOExpired: false,
                    problemNoBarcode: false,
                    problemNotOrdered: false,
                    problemOther: false,
                    [field]: true
                };
            } else {
                return { ...prev, [field]: false };
            }
        });
    };

    const handleActionSelection = (field: keyof ReturnRecord) => {
        setFormData(prev => {
            const isCurrentlyChecked = prev[field] as boolean;
            const newValue = !isCurrentlyChecked;
            if (newValue) {
                return {
                    ...prev,
                    actionReject: false,
                    actionRejectSort: false,
                    actionRework: false,
                    actionSpecialAcceptance: false,
                    actionScrap: false,
                    actionScrapReplace: false, // In Step1Request it is actionScrapReplace
                    [field]: true
                };
            } else {
                return { ...prev, [field]: false };
            }
        });
    };

    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><FileInput className="w-6 h-6" /></div>
                    <div><h3 className="text-xl font-bold text-slate-800">1. แจ้งคืนสินค้า (Return Request)</h3><p className="text-sm text-slate-500">สำหรับสาขา: กรอกข้อมูลสินค้าที่ต้องการส่งคืนเพื่อสร้างคำขอเข้าระบบ</p></div>
                    {initialData?.ncrNumber && <div className="ml-auto bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Auto-filled from NCR: {initialData.ncrNumber}</div>}
                </div>

                {/* Item List Summary */}
                {requestItems.length > 0 && (
                    <div className="mb-6 border rounded-lg overflow-hidden">
                        <div className="bg-slate-100 px-4 py-2 border-b font-bold text-sm text-slate-700 flex justify-between items-center">
                            <span>รายการที่รอส่ง ({requestItems.length})</span>
                            <button onClick={() => setRequestItems([])} className="text-xs text-red-500 hover:underline">ล้างทั้งหมด</button>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 text-xs">
                                <tr>
                                    <th className="px-4 py-2 text-left">รหัส</th>
                                    <th className="px-4 py-2 text-left">ชื่อสินค้า</th>
                                    <th className="px-4 py-2 text-center">จำนวน</th>
                                    <th className="px-4 py-2 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requestItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 font-mono text-xs">{item.productCode}</td>
                                        <td className="px-4 py-2">{item.productName}</td>
                                        <td className="px-4 py-2 text-center">{item.quantity} {item.unit}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <form onSubmit={handleAddItem} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">ผู้พบปัญหา (Founder) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="ระบุชื่อผู้พบปัญหา..."
                                value={formData.founder || ''}
                                onChange={e => setFormData({ ...formData, founder: e.target.value })}
                                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm mb-4"
                            />

                            <label className="block text-sm font-medium text-slate-700 mb-1">สาขาต้นทาง</label>
                            <select required value={isCustomBranch ? 'Other' : formData.branch} onChange={e => {
                                const val = e.target.value;
                                if (val === 'Other') { setIsCustomBranch(true); setFormData({ ...formData, branch: '' }); }
                                else { setIsCustomBranch(false); setFormData({ ...formData, branch: val }); }
                            }} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm">
                                {BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                                <option value="Other">อื่นๆ</option>
                            </select>
                            {isCustomBranch && <input type="text" placeholder="ระบุชื่อสาขา..." value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })} className="w-full mt-2 p-2 border rounded-lg text-sm" />}
                        </div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">วันที่แจ้ง</label><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">เลขที่เอกสาร Neo Siam</label><input type="text" value={formData.neoRefNo} onChange={e => setFormData({ ...formData, neoRefNo: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" /></div>
                        <div className="">
                            <AutocompleteInput
                                label="ชื่อลูกค้า"
                                required
                                value={formData.customerName || ''}
                                onChange={(val) => setFormData({ ...formData, customerName: val })}
                                options={uniqueCustomers}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <AutocompleteInput
                                label="สถานที่ส่ง (ลูกค้าปลายทาง)"
                                value={formData.destinationCustomer || ''}
                                onChange={(val) => setFormData({ ...formData, destinationCustomer: val })}
                                options={uniqueDestinations}
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                        <h4 className="text-sm font-bold text-slate-600 flex items-center gap-2"><Box className="w-4 h-4" /> ข้อมูลสินค้า</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className="text-xs text-slate-500 block mb-1">เลขที่เอกสารอ้างอิง</label><input type="text" required value={formData.refNo} onChange={e => setFormData({ ...formData, refNo: e.target.value })} className="w-full p-2 border rounded text-sm" /></div>
                            <div>
                                <AutocompleteInput
                                    label="รหัสสินค้า"
                                    required
                                    value={formData.productCode || ''}
                                    onChange={(val) => setFormData({ ...formData, productCode: val })}
                                    options={uniqueProductCodes}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <AutocompleteInput
                                    label="ชื่อสินค้า"
                                    required
                                    value={formData.productName || ''}
                                    onChange={(val) => setFormData({ ...formData, productName: val })}
                                    options={uniqueProductNames}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="text-xs text-slate-500 block mb-1">จำนวน</label><input type="number" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} className="w-full p-2 border rounded text-sm" /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">หน่วย</label><input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full p-2 border rounded text-sm" /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">วันหมดอายุ</label><input type="date" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} className="w-full p-2 border rounded text-sm" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div><label className="text-xs text-slate-500 block mb-1">ราคาหน้าบิล</label><input type="number" value={formData.priceBill} onChange={e => setFormData({ ...formData, priceBill: parseFloat(e.target.value) })} className="w-full p-2 border rounded text-sm" /></div>
                            <div><label className="text-xs text-slate-500 block mb-1">ราคาขาย</label><input type="number" value={formData.priceSell} onChange={e => setFormData({ ...formData, priceSell: parseFloat(e.target.value) })} className="w-full p-2 border rounded text-sm" /></div>
                            <div>
                                <button type="submit" className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm flex items-center justify-center gap-2 h-[38px]">
                                    <PlusCircle className="w-4 h-4" /> เพิ่มรายการ (Add)
                                </button>
                            </div>
                        </div>

                        {/* PROBLEM DETAILS SECTION */}
                        <div className="border-2 border-slate-300 rounded-xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> รายละเอียดของปัญหาที่พบ (ผู้พบปัญหา)
                            </div>
                            <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="border-r border-slate-200 pr-4">
                                    <div className="flex flex-col items-center justify-center text-slate-400 min-h-[200px] border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 transition-colors relative">
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                        <span className="text-sm font-bold">คลิกเพื่ออัพโหลดรูปภาพ</span>
                                        <span className="text-xs text-slate-400 mt-1">หรือลากไฟล์มาวางที่นี่</span>
                                    </div>
                                    {formData.images && formData.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-4">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="relative group aspect-square bg-slate-100 rounded overflow-hidden border border-slate-200">
                                                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                                    <button onClick={() => handleRemoveImage(idx)} type="button" className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <div className="mb-2 font-bold underline text-slate-800 text-sm">พบปัญหาที่กระบวนการ <span className="text-red-500">*</span></div>
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-slate-700 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemDamaged} onChange={() => handleProblemSelection('problemDamaged')} /> ชำรุด</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemDamagedInBox} onChange={() => handleProblemSelection('problemDamagedInBox')} /> ชำรุดในกล่อง</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemLost} onChange={() => handleProblemSelection('problemLost')} /> สูญหาย</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemMixed} onChange={() => handleProblemSelection('problemMixed')} /> สินค้าสลับ</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemWrongInv} onChange={() => handleProblemSelection('problemWrongInv')} /> สินค้าไม่ตรง INV.</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemLate} onChange={() => handleProblemSelection('problemLate')} /> ส่งช้า</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemDuplicate} onChange={() => handleProblemSelection('problemDuplicate')} /> ส่งซ้ำ</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemWrong} onChange={() => handleProblemSelection('problemWrong')} /> ส่งผิด</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemIncomplete} onChange={() => handleProblemSelection('problemIncomplete')} /> ส่งของไม่ครบ</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemOver} onChange={() => handleProblemSelection('problemOver')} /> ส่งของเกิน</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemWrongInfo} onChange={() => handleProblemSelection('problemWrongInfo')} /> ข้อมูลผิด</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemShortExpiry} onChange={() => handleProblemSelection('problemShortExpiry')} /> สินค้าอายุสั้น</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemTransportDamage} onChange={() => handleProblemSelection('problemTransportDamage')} /> สินค้าเสียหายบนรถขนส่ง</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemAccident} onChange={() => handleProblemSelection('problemAccident')} /> อุบัติเหตุ</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemPOExpired} onChange={() => handleProblemSelection('problemPOExpired')} /> PO. หมดอายุ</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemNoBarcode} onChange={() => handleProblemSelection('problemNoBarcode')} /> บาร์โค๊ตไม่ขึ้น</label>
                                        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"><input type="checkbox" checked={formData.problemNotOrdered} onChange={() => handleProblemSelection('problemNotOrdered')} /> ลูกค้าไม่ได้สั่งสินค้า</label>
                                        <div className="flex items-center gap-2 p-1 col-span-2"><input type="checkbox" checked={formData.problemOther} onChange={() => handleProblemSelection('problemOther')} /> <span>อื่นๆ</span><input type="text" className="border-b border-dotted border-slate-400 bg-transparent outline-none flex-1 text-slate-700" value={formData.problemOtherText || ''} onChange={e => setFormData({ ...formData, problemOtherText: e.target.value })} /></div>
                                    </div>
                                    <div>
                                        <label className="font-bold underline text-sm text-slate-800">รายละเอียด:</label>
                                        <textarea value={formData.problemDetail || ''} onChange={e => setFormData({ ...formData, problemDetail: e.target.value })} className="w-full mt-1 p-2 bg-slate-50 border rounded text-sm min-h-[80px]" placeholder="รายละเอียดเพิ่มเติม..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACTION SECTION */}
                        <div className="border-2 border-slate-300 rounded-xl overflow-hidden mt-6">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-700 flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-500" /> การดำเนินการ
                            </div>
                            <div className="p-4 bg-white space-y-3 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={formData.actionReject} onChange={() => handleActionSelection('actionReject')} className="w-4 h-4" />
                                        <span className="font-bold w-32">ส่งคืน (Reject)</span>
                                        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionRejectQty} onChange={e => setFormData({ ...formData, actionRejectQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={formData.actionRejectSort} onChange={() => handleActionSelection('actionRejectSort')} className="w-4 h-4" />
                                        <span className="font-bold w-40">คัดแยกของเสียเพื่อส่งคืน</span>
                                        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionRejectSortQty} onChange={e => setFormData({ ...formData, actionRejectSortQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-3">
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={formData.actionRework} onChange={() => handleActionSelection('actionRework')} className="w-4 h-4 mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="font-bold w-32">แก้ไข (Rework)</span>
                                                <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionReworkQty} onChange={e => setFormData({ ...formData, actionReworkQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                            </div>
                                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-600">วิธีการแก้ไข:</span><input type="text" value={formData.actionReworkMethod} onChange={e => setFormData({ ...formData, actionReworkMethod: e.target.value })} className="flex-1 border-b border-dotted border-slate-400 outline-none px-1" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 border-b border-slate-100 pb-3">
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={formData.actionSpecialAcceptance} onChange={() => handleActionSelection('actionSpecialAcceptance')} className="w-4 h-4 mt-1" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="font-bold w-32">ยอมรับกรณีพิเศษ</span>
                                                <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionSpecialAcceptanceQty} onChange={e => setFormData({ ...formData, actionSpecialAcceptanceQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                            </div>
                                            <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-600">เหตุผลในการยอมรับ:</span><input type="text" value={formData.actionSpecialAcceptanceReason} onChange={e => setFormData({ ...formData, actionSpecialAcceptanceReason: e.target.value })} className="flex-1 border-b border-dotted border-slate-400 outline-none px-1" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={formData.actionScrap} onChange={() => handleActionSelection('actionScrap')} className="w-4 h-4" />
                                        <span className="font-bold w-32">ทำลาย (Scrap)</span>
                                        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionScrapQty} onChange={e => setFormData({ ...formData, actionScrapQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={formData.actionScrapReplace} onChange={() => handleActionSelection('actionScrapReplace')} className="w-4 h-4" />
                                        <span className="font-bold w-32">เปลี่ยนสินค้าใหม่</span>
                                        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">จำนวน:</span><input type="number" value={formData.actionScrapReplaceQty} onChange={e => setFormData({ ...formData, actionScrapReplaceQty: Number(e.target.value) })} className="w-20 border rounded px-2 py-1" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ROOT CAUSE SECTION */}
                        <div className="border-2 border-slate-300 rounded-xl overflow-hidden mt-6">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-700 flex items-center gap-2">
                                <Search className="w-4 h-4 text-purple-500" /> สาเหตุ-การป้องกัน (ผู้รับผิดชอบปัญหา)
                            </div>
                            <div className="p-4 bg-white text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold underline text-slate-800">สาเหตุเกิดจาก:</span>
                                    <label className="flex items-center gap-1 cursor-pointer ml-4"><input type="checkbox" checked={formData.causePackaging} onChange={() => handleCauseSelection('causePackaging')} /> บรรจุภัณฑ์</label>
                                    <label className="flex items-center gap-1 cursor-pointer ml-4"><input type="checkbox" checked={formData.causeTransport} onChange={() => handleCauseSelection('causeTransport')} /> การขนส่ง</label>
                                    <label className="flex items-center gap-1 cursor-pointer ml-4"><input type="checkbox" checked={formData.causeOperation} onChange={() => handleCauseSelection('causeOperation')} /> ปฏิบัติงาน</label>
                                    <label className="flex items-center gap-1 cursor-pointer ml-4"><input type="checkbox" checked={formData.causeEnv} onChange={() => handleCauseSelection('causeEnv')} /> สิ่งแวดล้อม</label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">รายละเอียดสาเหตุ:</label>
                                        <textarea value={formData.causeDetail || ''} onChange={e => setFormData({ ...formData, causeDetail: e.target.value })} className="w-full p-2 bg-slate-50 border rounded min-h-[60px]" placeholder="ระบุสาเหตุ..."></textarea>
                                    </div>
                                    <div>
                                        <label className="font-bold text-slate-700 block mb-1">แนวทางป้องกัน:</label>
                                        <textarea value={formData.preventionDetail || ''} onChange={e => setFormData({ ...formData, preventionDetail: e.target.value })} className="w-full p-2 bg-slate-50 border rounded min-h-[60px]" placeholder="ระบุแนวทางป้องกัน..."></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COST TRACKING SECTION */}
                        <div className="border-2 border-slate-300 rounded-xl overflow-hidden mt-6">
                            <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> การติดตามค่าใช้จ่าย (Cost Tracking)
                            </div>
                            <div className="p-4 bg-white">
                                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.hasCost || false}
                                        onChange={e => setFormData({ ...formData, hasCost: e.target.checked })}
                                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500 border-slate-300"
                                    />
                                    <span className="font-bold text-red-600">⚠ มีค่าใช้จ่าย (Has Cost)</span>
                                </label>

                                {formData.hasCost && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in bg-red-50 p-4 rounded-lg border border-red-100">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">สาเหตุความเสียหาย (Problem Source)</label>
                                            <select
                                                value={formData.problemSource || ''}
                                                onChange={e => setFormData({ ...formData, problemSource: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">-- ระบุสาเหตุ --</option>
                                                {Object.keys(RESPONSIBLE_MAPPING).map(source => (
                                                    <option key={source} value={source}>{source}</option>
                                                ))}
                                                <option value="Other">อื่นๆ (Other)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ค่าใช้จ่าย (บาท)</label>
                                            <input
                                                type="number"
                                                value={formData.costAmount || ''}
                                                onChange={e => setFormData({ ...formData, costAmount: Number(e.target.value) })}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ผู้รับผิดชอบ (Responsible)</label>
                                            <input
                                                type="text"
                                                value={formData.costResponsible || ''}
                                                onChange={e => setFormData({ ...formData, costResponsible: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold"
                                                placeholder="ระบบจะระบุให้อัตโนมัติ หรือกรอกเอง"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* PROBLEM ANALYSIS SECTION */}
                    <div className="border-2 border-slate-300 rounded-xl overflow-hidden mt-6">
                        <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 font-bold text-slate-700 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-indigo-500" /> วิเคราะห์ปัญหาเกิดจาก (Problem Analysis)
                        </div>
                        <div className="p-4 bg-white space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Customer'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Customer', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">ลูกค้า (Customer)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Accounting'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Accounting', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">บัญชี (Accounting)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Keying'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Keying', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">พนักงานคีย์ข้อมูลผิด (Keying)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Warehouse'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Warehouse', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">ภายในคลังสินค้า (Warehouse)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Transport'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Transport', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">ระหว่างขนส่ง (Transport)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                                    <input type="radio" name="problemAnalysis"
                                        checked={formData.problemAnalysis === 'Other'}
                                        onChange={() => setFormData({ ...formData, problemAnalysis: 'Other', problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: '' })}
                                        className="w-4 h-4 text-indigo-600" />
                                    <span className="font-bold text-slate-700">อื่นๆ (Other)</span>
                                </label>
                            </div>

                            {/* Conditional Sub-Options */}
                            {formData.problemAnalysis === 'Warehouse' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in mt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">เลือกสาขา/หน่วยงาน</label>
                                            <select
                                                value={formData.problemAnalysisSub || ''}
                                                onChange={e => setFormData({ ...formData, problemAnalysisSub: e.target.value })}
                                                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                <option value="">-- เลือกสาขา --</option>
                                                {BRANCH_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">ระบุสาเหตุ (Cause)</label>
                                            <div className="flex items-center gap-4 mt-2">
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="whCause" checked={formData.problemAnalysisCause === 'Checker'} onChange={() => setFormData({ ...formData, problemAnalysisCause: 'Checker' })} /> เช็คเกอร์</label>
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="whCause" checked={formData.problemAnalysisCause === 'Unloader'} onChange={() => setFormData({ ...formData, problemAnalysisCause: 'Unloader' })} /> พนักงานลงสินค้า</label>
                                                <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="whCause" checked={formData.problemAnalysisCause === 'Other'} onChange={() => setFormData({ ...formData, problemAnalysisCause: 'Other' })} /> อื่นๆ</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formData.problemAnalysis === 'Transport' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in mt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ประเภทการขนส่ง</label>
                                    <div className="flex items-center gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="transType" checked={formData.problemAnalysisSub === 'CompanyDriver'} onChange={() => setFormData({ ...formData, problemAnalysisSub: 'CompanyDriver' })} /> พนักงานขับรถบริษัท</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="transType" checked={formData.problemAnalysisSub === 'JointTransport'} onChange={() => setFormData({ ...formData, problemAnalysisSub: 'JointTransport' })} /> รถขนส่งร่วม</label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="transType" checked={formData.problemAnalysisSub === 'Other'} onChange={() => setFormData({ ...formData, problemAnalysisSub: 'Other' })} /> อื่นๆ</label>
                                    </div>
                                </div>
                            )}

                            {formData.problemAnalysis === 'Other' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-fade-in mt-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-1">ระบุรายละเอียดเพิ่มเติม</label>
                                    <input
                                        type="text"
                                        value={formData.problemAnalysisDetail || ''}
                                        onChange={e => setFormData({ ...formData, problemAnalysisDetail: e.target.value })}
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                        placeholder="รายละเอียด..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end items-center pt-4 border-t border-slate-100 mt-6">
                        <button type="button" onClick={handleRequestSubmit} className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md flex items-center gap-2"> <Save className="w-4 h-4" /> ยืนยันข้อมูลทั้งหมด ({requestItems.length + (formData.productName ? 1 : 0)}) รายการ </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
