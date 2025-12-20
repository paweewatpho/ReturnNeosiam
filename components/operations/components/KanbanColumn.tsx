import React, { useMemo, useState } from 'react';
import { Printer, GitFork, Link, PlusSquare, MinusSquare, Layers } from 'lucide-react';
import { ReturnRecord, DispositionAction } from '../../../types';

interface KanbanColumnProps {
    title: string;
    status: DispositionAction;
    icon: any;
    color: string;
    items: ReturnRecord[];
    onPrintClick: (status: DispositionAction, list: ReturnRecord[]) => void;
    onItemClick?: (item: ReturnRecord) => void;
    onSplitClick?: (item: ReturnRecord) => void;
    overrideFilter?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, status, icon: Icon, color, items, onPrintClick, onItemClick, onSplitClick, overrideFilter }) => {
    // 1. Filter items first
    const columnItems = useMemo(() => {
        if (overrideFilter) return items;
        return items.filter(i => i.disposition === status && (status === 'RTV' ? !i.documentNo : true));
    }, [items, status, overrideFilter]);

    // 2. Group items
    const groupedItems = useMemo(() => {
        const groups: Record<string, ReturnRecord[]> = {};

        columnItems.forEach(item => {
            // Grouping Priority: DocNo -> COL -> NCR -> ID
            const normalize = (str?: string) => str ? str.trim().replace(/\s+/g, '').toLowerCase() : '';

            const doc = normalize(item.documentNo);
            const col = normalize(item.collectionOrderId);
            const ncr = normalize(item.ncrNumber);

            const key = doc || col || ncr || item.id;

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        // Convert to array and sort by latest date
        return Object.entries(groups).map(([key, groupItems]) => ({
            key,
            items: groupItems,
            rep: groupItems[0] // Representative item
        })).sort((a, b) => (b.rep.date || '').localeCompare(a.rep.date || ''));
    }, [columnItems]);

    // 3. Expand State
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const toggleExpand = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const borderColorClass = color.replace('bg-', 'border-').replace('500', '200');

    // Helper to render an item card
    const renderCard = (item: ReturnRecord, isSubItem: boolean = false) => (
        <div
            key={item.id}
            onClick={() => onItemClick && onItemClick(item)}
            draggable={!isSubItem}
            className={`bg-white p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group relative
                ${isSubItem ? 'border-l-4 border-l-slate-300 ml-4 mt-2' : 'shadow-sm border-slate-200 hover:ring-2 hover:ring-blue-400'}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 mr-2">
                    <span className="font-bold text-slate-700 text-sm line-clamp-1">
                        {item.productName}
                    </span>
                    {item.parentId && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                <Link className="w-3 h-3 mr-1" />
                                แยกมา
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {onSplitClick && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSplitClick(item);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                            aria-label={`แยกรายการ (Split Item) - ${item.quantity} ${item.unit}`}
                            title={`แยกรายการ (Split Item) - ${item.quantity} ${item.unit}`}
                        >
                            <GitFork className="w-3 h-3" />
                        </button>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.condition === 'New' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>{item.condition}</span>
                </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 mt-2 border-t pt-2 border-slate-100">
                <div className="grid grid-cols-2 gap-1">
                    <div className="flex flex-col"><span className="text-[10px] text-slate-400">สาขาต้นทาง</span><span className="font-bold text-slate-700 truncate">{item.branch}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-slate-400">วันที่แจ้ง</span><span className="font-bold text-slate-700 truncate">{item.date}</span></div>
                </div>

                {(item.neoRefNo || item.ncrNumber || item.collectionOrderId || item.documentNo) && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                        {item.documentNo && <div className="flex flex-col"><span className="text-[10px] text-emerald-600 font-bold">R No.</span><span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-1 rounded w-fit truncate" title={item.documentNo}>{item.documentNo}</span></div>}
                        {item.collectionOrderId && <div className="flex flex-col"><span className="text-[10px] text-indigo-600 font-bold">COL No.</span><span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-1 rounded w-fit truncate" title={item.collectionOrderId}>{item.collectionOrderId}</span></div>}

                        {item.neoRefNo && !item.documentNo && <div className="flex flex-col"><span className="text-[10px] text-slate-400">Ref Neo</span><span className="font-medium text-slate-700 truncate" title={item.neoRefNo}>{item.neoRefNo}</span></div>}
                        {item.ncrNumber && <div className="flex flex-col"><span className="text-[10px] text-red-500">NCR No</span><span className="font-bold text-red-600 truncate" title={item.ncrNumber}>{item.ncrNumber}</span></div>}
                    </div>
                )}

                <div className="flex flex-col"><span className="text-[10px] text-slate-400">ชื่อลูกค้า</span><span className="font-medium text-slate-700 truncate" title={item.customerName}>{item.customerName || '-'}</span></div>
                <div className="flex flex-col"><span className="text-[10px] text-slate-400">สถานที่ส่ง (ปลายทาง)</span><span className="font-medium text-slate-700 truncate" title={item.destinationCustomer}>{item.destinationCustomer || '-'}</span></div>

                <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded mt-1">
                    <span className="text-slate-500">จำนวน:</span>
                    <span className="font-bold text-slate-800 text-sm">{item.quantity} {item.unit}</span>
                </div>

                {status === 'RTV' && item.destinationCustomer && (
                    <div className="text-[10px] text-amber-600 bg-amber-50 p-1 rounded mt-1">Route: {item.destinationCustomer}</div>
                )}

                {item.preliminaryDecision && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold">ตัดสินใจ:</span>
                            {item.preliminaryRoute && (
                                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                                    {item.preliminaryRoute}
                                </span>
                            )}
                        </div>
                        <span className={`px-2 py-1 rounded text-center font-bold text-[10px] text-white shadow-sm border ${item.preliminaryDecision === 'Return' ? 'bg-blue-600 border-blue-700' :
                            item.preliminaryDecision === 'Sell' ? 'bg-green-600 border-green-700' :
                                item.preliminaryDecision === 'Scrap' ? 'bg-red-600 border-red-700' :
                                    item.preliminaryDecision === 'Internal' ? 'bg-amber-500 border-amber-600' :
                                        item.preliminaryDecision === 'Claim' ? 'bg-orange-500 border-orange-600' :
                                            'bg-slate-500 border-slate-600'
                            }`}>
                            {item.preliminaryDecision === 'Return' ? '🚚 คืนสินค้า' :
                                item.preliminaryDecision === 'Sell' ? '💵 ขาย' :
                                    item.preliminaryDecision === 'Scrap' ? '🗑️ ทำลาย' :
                                        item.preliminaryDecision === 'Internal' ? '🏠 ใช้ภายใน' :
                                            item.preliminaryDecision === 'Claim' ? '📄 เคลม' :
                                                item.preliminaryDecision}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-w-[300px] bg-slate-100 rounded-xl p-4 flex flex-col h-full border border-slate-200">
            <div className={`font-bold text-slate-700 mb-4 flex justify-between items-center pb-2 border-b-2 ${borderColorClass}`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${color} text-white`}><Icon className="w-4 h-4" /></div>
                    <span>{title}</span>
                </div>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs border shadow-sm">{columnItems.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
                {groupedItems.map(group => {
                    const isExpanded = expandedGroups.has(group.key);
                    const hasMultiple = group.items.length > 1;

                    // If simple item (no group or single item), just render
                    if (!hasMultiple) {
                        return renderCard(group.rep);
                    }

                    // If grouped, render wrapper
                    return (
                        <div key={group.key} className="bg-slate-200/50 p-1.5 rounded-xl border border-slate-300">
                            {/* Group Header Info */}
                            <div className="px-2 mb-1.5 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[70%]">
                                    {group.items.length} รายการ: {group.rep.productName}
                                </span>
                                {group.items.some(i => i.productCode !== group.rep.productCode) && (
                                    <span className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">คละสินค้า</span>
                                )}
                            </div>

                            {/* Header / Main Item */}
                            {renderCard(group.rep)}

                            {/* Expand Toggle */}
                            <button
                                onClick={() => toggleExpand(group.key)}
                                className={`flex items-center justify-center gap-2 w-full py-2 mt-1 rounded-lg text-xs font-bold transition-all
                                    ${isExpanded ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}
                                `}
                            >
                                {isExpanded ? <MinusSquare className="w-4 h-4" /> : <PlusSquare className="w-4 h-4" />}
                                {isExpanded ? 'ซ่อนรายการอื่น' : `ดูรายการอื่นในกลุ่ม (${group.items.length - 1})`}
                            </button>

                            {/* Sub Items */}
                            {isExpanded && (
                                <div className="mt-2 space-y-2 pl-2 border-l-2 border-slate-300 animate-slide-down">
                                    {group.items.slice(1).map(subItem => renderCard(subItem, true))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {columnItems.length > 0 && (
                <button onClick={() => (onPrintClick as any)(status, columnItems)} aria-label={`ออกเอกสาร (${columnItems.length})`} className="mt-4 w-full py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                    <Printer className="w-4 h-4" /> ออกเอกสาร ({columnItems.length})
                </button>
            )}
        </div>
    );
};
