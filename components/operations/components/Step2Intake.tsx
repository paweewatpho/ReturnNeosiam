
import React from 'react';
import { Truck, Inbox, MapPin, CheckCircle } from 'lucide-react';
import { ReturnRecord } from '../../../types';

interface Step2IntakeProps {
    requestedItems: ReturnRecord[];
    handleIntakeReceive: (id: string) => void;
}

export const Step2Intake: React.FC<Step2IntakeProps> = ({ requestedItems, handleIntakeReceive }) => {
    return (
        <div className="h-full overflow-auto p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" /> สินค้าขาเข้า (Incoming Shipments)
            </h3>
            {requestedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-slate-200">
                    <Inbox className="w-12 h-12 mb-2 opacity-50" />
                    <p>ไม่มีรายการที่แจ้งเข้ามาใหม่</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {[...requestedItems].sort((a, b) => {
                        const idA = a.ncrNumber || a.id || '';
                        const idB = b.ncrNumber || b.id || '';
                        return idB.localeCompare(idA);
                    }).map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-sm">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-4 border-b border-slate-100 pb-3">
                                <div><span className="text-slate-500 text-xs block mb-1">สาขาต้นทาง</span><span className="font-bold text-slate-800 flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {item.branch}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">วันที่แจ้ง</span><span className="font-bold text-slate-800">{item.dateRequested || item.date}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">เลขที่ NCR</span><span className="font-mono font-bold text-slate-800">{item.ncrNumber || '-'}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">เลขที่เอกสาร Neo</span><span className="font-mono font-bold text-slate-800">{item.neoRefNo || '-'}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">ชื่อลูกค้า</span><span className="font-bold text-slate-800 line-clamp-1" title={item.customerName}>{item.customerName || '-'}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">ผู้พบปัญหา</span><span className="font-bold text-slate-800 line-clamp-1" title={item.founder}>{item.founder || '-'}</span></div>
                                <div><span className="text-slate-500 text-xs block mb-1">สถานที่ส่ง (ปลายทาง)</span><span className="font-bold text-slate-800 line-clamp-1" title={item.destinationCustomer}>{item.destinationCustomer || '-'}</span></div>
                            </div>

                            {/* Product Info */}
                            <div className="bg-slate-50 p-3 rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-mono font-bold">{item.refNo}</span>
                                        <span className="text-slate-600 font-mono font-bold">{item.productCode}</span>
                                    </div>
                                    <div className="font-bold text-slate-900 text-base mb-1 truncate" title={item.productName}>{item.productName}</div>
                                    <div className="flex gap-4">
                                        {item.expiryDate && <div className="text-red-500 text-xs font-bold bg-white px-2 py-0.5 rounded border border-red-100">Exp: {item.expiryDate}</div>}
                                        <div className="text-slate-500 text-xs italic">เหตุผล: {item.reason}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 px-4 md:border-l border-slate-200">
                                    <div className="text-right">
                                        <span className="text-slate-400 text-[10px] block">ราคาหน้าบิล</span>
                                        <span className="font-bold text-slate-700">{item.priceBill?.toLocaleString()}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-400 text-[10px] block">ราคาขาย</span>
                                        <span className="font-bold text-slate-700">{item.priceSell?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="text-center min-w-[80px] bg-white px-3 py-1 rounded border border-slate-200">
                                    <span className="text-slate-400 text-[10px] block">จำนวน</span>
                                    <span className="font-bold text-lg text-blue-600">{item.quantity}</span> <span className="text-xs text-slate-500">{item.unit}</span>
                                </div>

                                <button onClick={() => handleIntakeReceive(item.id)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors whitespace-nowrap ml-auto self-stretch md:self-auto justify-center">
                                    <CheckCircle className="w-4 h-4" /> รับของ
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
