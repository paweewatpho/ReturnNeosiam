import React from 'react';
import { Activity, Box, CheckSquare, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';
import { useData } from '../../../DataContext';
import { ReturnRecord } from '../../../types';

interface Step3BranchReceiveProps {
    onComplete?: () => void;
}

export const Step3BranchReceive: React.FC<Step3BranchReceiveProps> = ({ onComplete }) => {
    const { items, updateReturnRecord } = useData();

    // Filter Items: Status 'JobAccepted' or 'COL_JobAccepted' ensuring NO NCR items (unless explicitly LOGISTICS)
    const acceptedItems = React.useMemo(() => {
        return items.filter(item => {
            // 1. Check Status
            const isStatusMatch = item.status === 'COL_JobAccepted' || item.status === 'JobAccepted';
            if (!isStatusMatch) return false;

            // 2. Explicitly INCLUDE 'LOGISTICS' type (even if it has an NCR number due to legacy data)
            if (item.documentType === 'LOGISTICS') return true;

            // 3. Exclude actual NCR items (Document Type 'NCR' OR has NCR Number)
            // If it's not explicitly LOGISTICS, we assume presence of NCR Number means it belongs to NCR flow
            if (item.documentType === 'NCR' || !!item.ncrNumber) return false;

            return true;
        });
    }, [items]);

    const handleReceiveItem = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันรับสินค้า?',
            text: "คุณตรวจสอบสินค้าเรียบร้อยแล้วใช่หรือไม่?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5', // indigo-600
            cancelButtonColor: '#d33',
            confirmButtonText: 'ใช่, รับสินค้า',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            await updateReturnRecord(id, {
                status: 'COL_BranchReceived',
                dateReceived: new Date().toISOString().split('T')[0]
            });

            await Swal.fire({
                icon: 'success',
                title: 'รับสินค้าเรียบร้อย',
                timer: 1500,
                showConfirmButton: false
            });

            // Auto-navigate if this was the last item
            if (acceptedItems.length === 1 && onComplete) {
                onComplete();
            }
        }
    };

    const handleReceiveAll = async () => {
        if (acceptedItems.length === 0) return;

        const result = await Swal.fire({
            title: `ยืนยันรับสินค้าทั้งหมด ${acceptedItems.length} รายการ?`,
            text: "คุณต้องการรับสินค้าทั้งหมดในครั้งเดียวหรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#d33',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            for (const item of acceptedItems) {
                await updateReturnRecord(item.id, {
                    status: 'COL_BranchReceived',
                    dateReceived: new Date().toISOString().split('T')[0]
                });
            }

            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'รับสินค้าทั้งหมดเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
            });

            if (onComplete) {
                onComplete();
            }
        }
    };

    return (
        <div className="h-full flex flex-col p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-indigo-600" /> 3. รับสินค้า (Branch Physical Receive)
                </h3>
                {acceptedItems.length > 0 && (
                    <button
                        onClick={handleReceiveAll}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-all"
                    >
                        รับสินค้าทั้งหมด ({acceptedItems.length})
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="p-4 border-b">สาขา (Branch)</th>
                                <th className="p-4 border-b">ใบกำกับ / วันที่ (Inv / Date)</th>
                                <th className="p-4 border-b">เลขที่เอกสาร (Doc Info)</th>
                                <th className="p-4 border-b">ลูกค้าปลายทาง</th>
                                <th className="p-4 border-b">หมายเหตุ</th>
                                <th className="p-4 border-b text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {acceptedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Box className="w-8 h-8 opacity-20" />
                                            <span>ไม่มีรายการที่ต้องรับสินค้า</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                acceptedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="p-4 align-top">
                                            <div className="font-bold text-slate-700">{item.branch}</div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="text-sm font-semibold text-slate-700">{item.invoiceNo || '-'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                <span title="วันที่ใบคุมรถ">{item.controlDate || item.date || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="font-bold text-slate-500 w-8">R:</span>
                                                    <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{item.documentNo || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="font-bold text-slate-500 w-8">TM:</span>
                                                    <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{item.tmNo || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs">
                                                    <span className="font-bold text-indigo-500 w-8">COL:</span>
                                                    <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.collectionOrderId || item.id}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top text-slate-600">
                                            {item.destinationCustomer || '-'}
                                        </td>
                                        <td className="p-4 align-top h-full">
                                            <div className="text-sm text-slate-600 max-w-xs">{item.notes || '-'}</div>
                                        </td>
                                        <td className="p-4 align-top text-center">
                                            <button
                                                onClick={() => handleReceiveItem(item.id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 mx-auto whitespace-nowrap"
                                            >
                                                <CheckSquare className="w-4 h-4" /> ยืนยันรับของ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
