import React from 'react';
import { User } from 'lucide-react';
import { AutocompleteInput } from '../AutocompleteInput';
import { ReturnRecord } from '../../../../types';

interface FounderInfoSectionProps {
    formData: Partial<ReturnRecord>;
    updateField: (field: keyof ReturnRecord, value: any) => void;
    uniqueCustomers: string[];
    uniqueDestinations: string[];
}

export const FounderInfoSection: React.FC<FounderInfoSectionProps> = ({
    formData,
    updateField,
    uniqueCustomers,
    uniqueDestinations
}) => {
    return (
        <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                <User className="w-5 h-5 text-blue-500" /> ข้อมูลเบื้องต้น (Header Info)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ผู้พบปัญหา (Founder) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        value={formData.founder || ''}
                        onChange={e => updateField('founder', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                        placeholder="ระบุชื่อผู้แจ้ง..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ลูกค้า (Customer Name)</label>
                    <AutocompleteInput
                        label=""
                        value={formData.customerName || ''}
                        onChange={(val) => updateField('customerName', val)}
                        options={uniqueCustomers}
                        placeholder="ค้นหาชื่อลูกค้า..."
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">สถานที่ส่ง (Destination / Site) <span className="text-red-500">*</span></label>
                    <AutocompleteInput
                        label=""
                        required
                        value={formData.destinationCustomer || ''}
                        onChange={(val) => updateField('destinationCustomer', val)}
                        options={uniqueDestinations}
                        placeholder="ระบุสถานที่ส่ง..."
                    />
                </div>
            </div>
        </div>
    );
};
