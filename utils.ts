
import React from 'react';
import { DispositionAction } from './types';
import { Truck, RotateCcw, Trash2, Home, ShieldCheck, AlertTriangle } from 'lucide-react';

export const dispositionLabels: Record<string, string> = {
  RTV: 'ส่งคืน (RTV)',
  Restock: 'ขาย (Restock)',
  Recycle: 'ทำลาย (Scrap)',
  InternalUse: 'ใช้ภายใน (Internal)',
  Claim: 'เคลมประกัน (Claim)',
};

export const getDispositionBadge = (disp?: DispositionAction): React.ReactNode => {
  if (!disp || typeof disp !== 'string' || disp === 'Pending') {
    return React.createElement('span', { className: 'text-slate-400' }, '-');
  }
  const config: any = {
    'RTV': { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Truck, label: dispositionLabels['RTV'] },
    'Restock': { color: 'bg-green-50 text-green-700 border-green-200', icon: RotateCcw, label: dispositionLabels['Restock'] },
    'Recycle': { color: 'bg-red-50 text-red-700 border-red-200', icon: Trash2, label: dispositionLabels['Recycle'] },
    'InternalUse': { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Home, label: dispositionLabels['InternalUse'] },
    'Claim': { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: ShieldCheck, label: dispositionLabels['Claim'] }
  };
  if (!config[disp]) {
    return React.createElement('span', { className: "bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] border border-slate-200 flex items-center gap-1" }, React.createElement(AlertTriangle, { className: "w-3 h-3" }), ' ไม่ทราบค่า');
  }
  const Icon = config[disp].icon;
  return React.createElement('span', { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${config[disp].color}` }, React.createElement(Icon, { className: "w-3 h-3" }), ` ${config[disp].label}`);
};

export const ThaiBahtText = (amount: number): string => {
  const units = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  if (amount === 0) return "ศูนย์บาทถ้วน";
  
  let amountStr = String(Math.abs(amount).toFixed(2));
  let [integerPart, decimalPart] = amountStr.split('.');
  
  let result = "";

  const numberToText = (numStr: string) => {
    let text = "";
    for (let i = 0; i < numStr.length; i++) {
        let digit = parseInt(numStr.charAt(i));
        let pos = numStr.length - i - 1;
        
        if (digit !== 0) {
            if (pos % 6 === 1 && digit === 1 && numStr.length > 1) { /* No "หนึ่ง" for 10-19 */ } 
            else if (pos % 6 === 1 && digit === 2) { text += "ยี่"; } 
            else if (pos === 0 && digit === 1 && numStr.length > 1 && parseInt(numStr.charAt(numStr.length - 2)) !== 0) { text += "เอ็ด"; }
            else { text += units[digit]; }
            text += positions[pos % 6];
        }
    }
    return text;
  }

  const millions = Math.floor(integerPart.length / 6);
  if (millions > 0) {
      for(let i = 0; i < millions; i++) {
          const millionIndex = integerPart.length - (i + 1) * 6;
          const segment = integerPart.substring(millionIndex > 0 ? millionIndex : 0, integerPart.length - i * 6);
          if(parseInt(segment) > 0) {
             result = numberToText(segment) + "ล้าน" + result;
          }
      }
      const remaining = integerPart.substring(0, integerPart.length - millions * 6);
      result = numberToText(remaining) + result;
  } else {
      result = numberToText(integerPart);
  }
  
  result += "บาท";
  
  if (!decimalPart || parseInt(decimalPart) === 0) {
      result += "ถ้วน";
  } else {
      result += numberToText(decimalPart) + "สตางค์";
  }
  
  return result;
};
