
import React from 'react';
import { FileText, Edit3, Printer, CheckCircle, X } from 'lucide-react';
import { ThaiBahtText, getISODetails, calculateTotal } from '../utils';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    docData: any;
    docConfig: any;
    setDocConfig: (config: any) => void;
    isDocEditable: boolean;
    setIsDocEditable: (val: boolean) => void;
    includeVat: boolean;
    setIncludeVat: (val: boolean) => void;
    vatRate: number;
    setVatRate: (val: number) => void;
    handleConfirmDocGeneration: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
    isOpen, onClose, docData, docConfig, setDocConfig,
    isDocEditable, setIsDocEditable,
    includeVat, setIncludeVat, vatRate, setVatRate,
    handleConfirmDocGeneration
}) => {
    if (!isOpen || !docData) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col animate-fade-in text-slate-900 overflow-hidden">
            {/* Toolbar */}
            <div className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md print:hidden w-full z-10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> ตัวอย่างเอกสาร (Print Preview)
                </h3>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-2 py-1 border border-slate-600">
                        <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                            <input type="checkbox" checked={includeVat} onChange={e => setIncludeVat(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500 bg-slate-600 border-slate-500" />
                            <span className={includeVat ? 'text-white' : 'text-slate-400'}>คิด VAT</span>
                        </label>
                        {includeVat && (
                            <div className="flex items-center gap-1 border-l border-slate-600 pl-2">
                                <input
                                    type="number"
                                    value={vatRate}
                                    onChange={e => setVatRate(Number(e.target.value))}
                                    className="w-12 bg-slate-800 border border-slate-500 rounded px-1 text-center text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    min="0" max="100"
                                />
                                <span className="text-xs text-slate-400">%</span>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsDocEditable(!isDocEditable)} className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1 transition-all ${isDocEditable ? 'bg-amber-500 border-amber-500 text-white' : 'bg-transparent border-slate-600 text-slate-300 hover:border-slate-400'}`}>
                        <Edit3 className="w-3 h-3" /> {isDocEditable ? 'Editing Mode' : 'Edit Header'}
                    </button>
                    <div className="h-6 w-px bg-slate-600 mx-2"></div>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 font-bold text-sm flex items-center gap-2">
                        <Printer className="w-4 h-4" /> พิมพ์ (Print)
                    </button>
                    <button onClick={handleConfirmDocGeneration} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> บันทึกและไประดับถัดไป
                    </button>
                    <button onClick={onClose} className="ml-2 p-2 hover:bg-slate-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible">
                <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-[15mm] print:shadow-none print:w-full print:max-w-none print:p-0 relative">

                    {/* Header */}
                    <div className="flex border-b-2 border-slate-800 pb-4 mb-6">
                        <div className="w-[100px] h-[100px] flex items-center justify-center mr-6">
                            <img src="https://img2.pic.in.th/pic/logo-neo.png" alt="Neo Siam Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex-1">
                            {isDocEditable ? (
                                <div className="space-y-1">
                                    <input value={docConfig.companyNameTH} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocConfig({ ...docConfig, companyNameTH: e.target.value })} className="w-full text-lg font-bold border rounded px-1" />
                                    <input value={docConfig.companyNameEN} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocConfig({ ...docConfig, companyNameEN: e.target.value })} className="w-full text-sm border rounded px-1" />
                                    <input value={docConfig.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocConfig({ ...docConfig, address: e.target.value })} className="w-full text-xs text-slate-600 border rounded px-1" />
                                    <input value={docConfig.contact} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocConfig({ ...docConfig, contact: e.target.value })} className="w-full text-xs text-slate-600 border rounded px-1" />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-xl font-bold text-slate-800">{docConfig.companyNameTH}</h1>
                                    <h2 className="text-sm font-bold text-slate-600">{docConfig.companyNameEN}</h2>
                                    <p className="text-xs text-slate-500 mt-1">{docConfig.address}</p>
                                    <p className="text-xs text-slate-500">{docConfig.contact}</p>
                                </>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="border inline-block px-4 py-2 rounded text-center mb-2">
                                <div className="text-[10px] text-slate-500">Document No.</div>
                                <div className="font-bold font-mono text-lg">{getISODetails(docData.type).code}</div>
                            </div>
                            <div className="text-xs text-slate-500">Date: {new Date().toLocaleDateString('th-TH')}</div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        {isDocEditable ? (
                            <input value={docConfig.titleTH} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocConfig({ ...docConfig, titleTH: e.target.value })} className="text-CENTER text-2xl font-bold border rounded px-2 w-full mb-1" />
                        ) : (
                            <h2 className="text-2xl font-bold uppercase border-b border-black inline-block px-8 pb-1">{docConfig.titleTH || getISODetails(docData.type).th}</h2>
                        )}
                        <p className="text-sm text-slate-500 mt-1 uppercase tracking-wide">{docConfig.titleEN || getISODetails(docData.type).en}</p>
                    </div>

                    {/* Info Block */}
                    <div className="mb-6 text-sm">
                        {/* To / Via Section - Standard Document Format */}
                        <div className="p-4 border rounded-lg print:border-none print:p-0">
                            <div className="grid grid-cols-1 gap-4 leading-loose">
                                <div className="flex items-end border-b border-dotted border-slate-400 pb-1">
                                    <span className="font-bold w-[60px]">เรียน:</span>
                                    <span className="flex-1 px-2 text-slate-800"></span>
                                </div>
                                <div className="flex items-end border-b border-dotted border-slate-400 pb-1">
                                    <span className="font-bold w-[60px]">ผ่าน:</span>
                                    <span className="flex-1 px-2 text-slate-800"></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-slate-800 text-sm mb-6">
                        <thead>
                            <tr className="bg-slate-100 print:bg-slate-200 text-center">
                                <th className="border border-slate-800 p-2 w-10">#</th>
                                <th className="border border-slate-800 p-2 w-[120px]">รหัสสินค้า</th>
                                <th className="border border-slate-800 p-2">รายการสินค้า</th>
                                <th className="border border-slate-800 p-2 w-[80px]">จำนวน</th>
                                <th className="border border-slate-800 p-2 w-[60px]">หน่วย</th>
                                <th className="border border-slate-800 p-2 w-[100px]">สภาพ</th>
                                <th className="border border-slate-800 p-2 w-[100px]">ราคา/หน่วย</th>
                                <th className="border border-slate-800 p-2 w-[100px]">รวมเงิน</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docData.items.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="border border-slate-800 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-slate-800 p-2">{item.productCode}</td>
                                    <td className="border border-slate-800 p-2">
                                        <div>{item.productName}</div>
                                        <div className="text-[10px] text-slate-500">Ref: {item.refNo}</div>
                                    </td>
                                    <td className="border border-slate-800 p-2 text-center font-bold">{item.quantity}</td>
                                    <td className="border border-slate-800 p-2 text-center">{item.unit}</td>
                                    <td className="border border-slate-800 p-2 text-center text-xs">{item.condition}</td>
                                    <td className="border border-slate-800 p-2 text-right">{item.priceBill?.toLocaleString()}</td>
                                    <td className="border border-slate-800 p-2 text-right">{((item.priceBill || 0) * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Summary Rows */}
                            <tr className="font-bold bg-slate-50 print:bg-transparent">
                                <td colSpan={6} rowSpan={3} className="border border-slate-800 p-4 text-center align-middle text-lg italic bg-slate-50 text-slate-600 print:hidden">
                                    ({ThaiBahtText(calculateTotal(docData.items, includeVat, vatRate).net)})
                                </td>
                                <td colSpan={6} rowSpan={includeVat ? 1 : 3} className="border border-slate-800 p-4 text-center align-middle text-lg italic bg-slate-50 text-slate-600 hidden print:table-cell">
                                    ({ThaiBahtText(calculateTotal(docData.items, includeVat, vatRate).net)})
                                </td>
                                <td className="border border-slate-800 p-2 text-right">รวมเป็นเงิน</td>
                                <td className="border border-slate-800 p-2 text-right">{calculateTotal(docData.items, includeVat, vatRate).subtotal.toLocaleString()}</td>
                            </tr>
                            {includeVat && (
                                <>
                                    <tr className="font-bold bg-slate-50 print:bg-transparent">
                                        <td className="border border-slate-800 p-2 text-right">VAT 7%</td>
                                        <td className="border border-slate-800 p-2 text-right">{calculateTotal(docData.items, includeVat, vatRate).vat.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="font-bold bg-slate-100 print:bg-slate-200">
                                        <td className="border border-slate-800 p-2 text-right text-black">ยอดสุทธิ</td>
                                        <td className="border border-slate-800 p-2 text-right text-black">{calculateTotal(docData.items, includeVat, vatRate).net.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>

                    {/* Remarks */}
                    <div className="mb-8 p-4 border border-slate-300 rounded print:border-black">
                        <span className="font-bold underline text-sm">หมายเหตุ:</span>
                        {isDocEditable ? (
                            <textarea value={docConfig.remarks} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDocConfig({ ...docConfig, remarks: e.target.value })} className="w-full mt-1 p-1 border rounded" rows={2} />
                        ) : (
                            <p className="text-sm mt-1 indent-4">{docConfig.remarks}</p>
                        )}
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-8 mt-12 print:break-inside-avoid">
                        <div className="text-center">
                            <div className="border-b border-black border-dotted h-8 w-3/4 mx-auto mb-2"></div>
                            <div className="text-sm font-bold">{docConfig.signatory1}</div>
                            <div className="text-xs text-slate-500">วันที่ ...../...../..........</div>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black border-dotted h-8 w-3/4 mx-auto mb-2"></div>
                            <div className="text-sm font-bold">{docConfig.signatory2}</div>
                            <div className="text-xs text-slate-500">วันที่ ...../...../..........</div>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black border-dotted h-8 w-3/4 mx-auto mb-2"></div>
                            <div className="text-sm font-bold">{docConfig.signatory3}</div>
                            <div className="text-xs text-slate-500">วันที่ ...../...../..........</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
