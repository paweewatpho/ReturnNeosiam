
import React from 'react';
import { FileText, Inbox, MapPin, User, CheckCircle } from 'lucide-react';
import { ReturnRecord } from '../../../types';
import { DispositionBadge } from './DispositionBadge';

interface Step5CompleteProps {
    documentedItems: ReturnRecord[];
    completedItems: ReturnRecord[];
    handleCompleteJob: (id: string) => void;
}

export const Step5Complete: React.FC<Step5CompleteProps> = ({ documentedItems, completedItems, handleCompleteJob }) => {
    return (
        <div className="h-full overflow-auto p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" /> รายการรอปิดงาน (Pending Completion)
            </h3>

            {documentedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-slate-200">
                    <Inbox className="w-12 h-12 mb-2 opacity-50" />
                    <p>ไม่มีรายการที่รอปิดงาน</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {documentedItems.map(item => (
                        <div
                            key={item.id}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-purple-50 p-3 rounded-lg text-purple-600 font-bold font-mono text-xs">
                                    {item.id}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{item.productName}</h4>
                                    <div className="text-sm text-slate-500 flex gap-3 mt-1">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {item.branch}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" /> {item.customerName}
                                        </span>
                                        <DispositionBadge disposition={item.disposition} />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleCompleteJob(item.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" /> ปิดงาน
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <h3 className="text-lg font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" /> รายการที่จบงานแล้ว (Completed)
            </h3>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {completedItems.slice(0, 10).map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-slate-400">{item.id}</span>
                            <div>
                                <span className="font-medium text-slate-700">{item.productName}</span>
                                <span className="text-xs text-slate-500 ml-2">({item.branch})</span>
                            </div>
                        </div>
                        <div className="text-xs flex items-center gap-2 text-slate-500">
                            <span>ปิดงาน: {item.dateCompleted}</span>
                            <DispositionBadge disposition={item.disposition} />
                        </div>
                    </div>
                ))}

                {completedItems.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-sm italic">
                        ยังไม่มีรายการที่จบงาน
                    </div>
                )}
            </div>
        </div>
    );
};
