
import React, { useState, useEffect, useMemo } from 'react';
import { useData, NCRRecord, NCRItem } from '../DataContext';
import { FileText, AlertTriangle, ArrowRight, CheckCircle, Clock, MapPin, DollarSign, Package, User, Printer, X, Save, Eye, Edit, Lock, Trash2, CheckSquare, Search, Filter, Download, XCircle } from 'lucide-react';
import { ReturnRecord, ReturnStatus } from '../types';

interface NCRReportProps {
  onTransfer: (data: Partial<ReturnRecord>) => void;
}

const NCRReport: React.FC<NCRReportProps> = ({ onTransfer }) => {
  const { ncrReports, items, updateNCRReport, deleteNCRReport, updateReturnRecord } = useData();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printItem, setPrintItem] = useState<NCRRecord | null>(null);
  
  const [showNCRFormModal, setShowNCRFormModal] = useState(false);
  const [ncrFormItem, setNcrFormItem] = useState<NCRRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingEditItem, setPendingEditItem] = useState<NCRRecord | null>(null);
  
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);

  // Filters State including Date Range
  const [filters, setFilters] = useState({
    query: '',
    action: 'All',
    returnStatus: 'All',
    hasCost: false,
    startDate: '',
    endDate: '',
  });

  const filteredNcrReports = useMemo(() => {
    // First, filter NCR reports based on criteria
    const filteredReports = ncrReports.filter(report => {
      // Date Range Filter
      if (filters.startDate && report.date < filters.startDate) return false;
      if (filters.endDate && report.date > filters.endDate) return false;

      // Text Query Filter including NCR Number
      const queryLower = filters.query.toLowerCase();
      if (queryLower) {
        const hasMatch = report.ncrNo?.toLowerCase().includes(queryLower) ||
          report.problemDetail?.toLowerCase().includes(queryLower) ||
          (report.items && report.items.some(item => 
            item.customerName?.toLowerCase().includes(queryLower) ||
            item.productName?.toLowerCase().includes(queryLower) ||
            item.productCode?.toLowerCase().includes(queryLower) ||
            item.branch?.toLowerCase().includes(queryLower) ||
            item.destinationCustomer?.toLowerCase().includes(queryLower) ||
            item.problemSource?.toLowerCase().includes(queryLower)
          ));
        if (!hasMatch) return false;
      }
      
      // Action Filter
      if (filters.action !== 'All') {
        if (filters.action === 'Reject' && !report.actionReject && !report.actionRejectSort) return false;
        if (filters.action === 'Scrap' && !report.actionScrap) return false;
      }

      // Has Cost Filter
      if (filters.hasCost && report.items && !report.items.some(item => item.hasCost)) {
        return false;
      }
      
      return true;
    });

    // Then, expand each report into rows for each item
    const expandedRows: (NCRRecord & { itemData: NCRItem })[] = [];
    filteredReports.forEach(report => {
      if (report.items && report.items.length > 0) {
        report.items.forEach(item => {
          expandedRows.push({ ...report, itemData: item });
        });
      } else if (report.item) {
        // Backward compatibility with old structure
        expandedRows.push({ ...report, itemData: report.item });
      }
    });

    return expandedRows;
  }, [ncrReports, items, filters]);

  const handleExportExcel = () => {
    const headers = [
      "NCR No", "Date", "Status", "Product Code", "Product Name", "Customer", 
      "From Branch", "To Destination", "Quantity", "Unit", 
      "Problem Detail", "Problem Source",
      "Has Cost", "Cost Amount", "Cost Responsible",
      "Action", "Return Status"
    ];

    const rows = filteredNcrReports.map(report => {
      // itemData is now provided from expanded rows
      const returnRecord = items.find(item => item.ncrNumber === report.ncrNo);
      
      const action = report.actionReject || report.actionRejectSort ? 'Reject' : report.actionScrap ? 'Scrap' : 'N/A';
      
      return [
        report.ncrNo,
        report.date,
        report.status,
        itemData.productCode,
        `"${itemData.productName?.replace(/"/g, '""')}"`,
        `"${itemData.customerName?.replace(/"/g, '""')}"`,
        itemData.branch,
        `"${itemData.destinationCustomer?.replace(/"/g, '""')}"`,
        itemData.quantity,
        itemData.unit,
        `"${report.problemDetail?.replace(/"/g, '""')}"`,
        `"${itemData.problemSource?.replace(/"/g, '""')}"`,
        itemData.hasCost ? 'Yes' : 'No',
        itemData.costAmount || 0,
        itemData.costResponsible || '',
        action,
        returnRecord?.status || 'Not Returned'
      ].join(',');
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ncr_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateReturn = (ncr: NCRRecord) => {
    const itemData = ncr.item || (ncr as any);

    const returnData: Partial<ReturnRecord> = {
      ncrNumber: ncr.ncrNo || ncr.id,
      branch: itemData.branch,
      date: ncr.date,
      productName: itemData.productName,
      productCode: itemData.productCode,
      customerName: itemData.customerName,
      quantity: itemData.quantity,
      unit: itemData.unit,
      refNo: itemData.refNo,
      neoRefNo: itemData.neoRefNo,
      destinationCustomer: itemData.destinationCustomer,
      reason: `จาก NCR: ${ncr.problemDetail} (${itemData.problemSource})`,
      problemType: ncr.problemDetail,
      rootCause: itemData.problemSource,
      actionReject: ncr.actionReject,
      actionRejectSort: ncr.actionRejectSort,
      actionScrap: ncr.actionScrap
    };
    onTransfer(returnData);
  };

  const handleOpenPrint = (item: NCRRecord) => {
      setPrintItem(item);
      setShowPrintModal(true);
  };

  const handleViewNCRForm = (item: NCRRecord) => {
      setNcrFormItem({ ...item });
      setIsEditMode(false);
      setShowNCRFormModal(true);
  };

  const handleEditClick = (item: NCRRecord) => {
      setPendingEditItem(item);
      setPasswordInput('');
      setShowPasswordModal(true);
  };
  
  const handleDeleteClick = (id: string) => {
    setPendingDeleteItemId(id);
    setPasswordInput('');
    setShowDeletePasswordModal(true);
  };

  const handleVerifyPasswordAndDelete = async () => {
    if (passwordInput === '1234') {
        if (pendingDeleteItemId) {
            const success = await deleteNCRReport(pendingDeleteItemId);
            if (success) {
                alert(`ยกเลิกรายการ NCR สำเร็จ`);
            } else {
                alert('การยกเลิกล้มเหลว กรุณาตรวจสอบสิทธิ์');
            }
        }
        setShowDeletePasswordModal(false);
        setPendingDeleteItemId(null);
    } else {
        alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleVerifyPassword = () => {
      if (passwordInput === '1234') {
          if (pendingEditItem) {
              setNcrFormItem({ ...pendingEditItem });
              setIsEditMode(true);
              setShowNCRFormModal(true);
          }
          setShowPasswordModal(false);
      } else {
          alert('รหัสผ่านไม่ถูกต้อง');
      }
  };

  const handleSaveChanges = async () => {
      if (!ncrFormItem) return;
      
      // Update the NCR report
      const success = await updateNCRReport(ncrFormItem.id, ncrFormItem);
      if(success){
        // Also update the associated ReturnRecords with the new data
        if (ncrFormItem.items && ncrFormItem.items.length > 0) {
          const updatePromises = ncrFormItem.items.map(item => {
            // Find the corresponding ReturnRecord and update it
            const correspondingReturn = items.find(r => r.refNo === item.refNo || r.neoRefNo === item.neoRefNo);
            if (correspondingReturn) {
              return updateReturnRecord(correspondingReturn.id, {
                productCode: item.productCode,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                priceBill: item.priceBill,
                customerName: item.customerName,
                destinationCustomer: item.destinationCustomer,
              });
            }
            return Promise.resolve(false);
          });
          
          await Promise.all(updatePromises);
        }
        
        alert('บันทึกการแก้ไขเรียบร้อย');
        setShowNCRFormModal(false);
        setIsEditMode(false);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึก');
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const handleInputChange = (field: keyof NCRRecord, value: any) => {
      if (ncrFormItem) {
          setNcrFormItem({ ...ncrFormItem, [field]: value });
      }
  };

  const handleItemInputChange = (itemIndex: number, field: keyof NCRItem, value: any) => {
    if (ncrFormItem && ncrFormItem.items) {
        const updatedItems = [...ncrFormItem.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
        setNcrFormItem({ ...ncrFormItem, items: updatedItems });
    }
  };
  
  const getProblemStrings = (record: NCRRecord | null) => {
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

  const getReturnStatusBadge = (status?: ReturnStatus) => {
    if (!status) {
        return <span className="text-slate-400 text-xs">-</span>;
    }
    const config = {
        'Requested': { text: 'รอรับเข้า', color: 'bg-slate-100 text-slate-600' },
        'Received': { text: 'รอ QC', color: 'bg-amber-100 text-amber-700' },
        'Graded': { text: 'รอเอกสาร', color: 'bg-blue-100 text-blue-700' },
        'Documented': { text: 'รอปิดงาน', color: 'bg-purple-100 text-purple-700' },
        'Completed': { text: 'จบงาน', color: 'bg-green-100 text-green-700' },
    }[status];

    if (!config) {
        return <span className={`px-2 py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600`}>{status}</span>;
    }
    return <span className={`px-2 py-1 text-[10px] font-bold rounded ${config.color}`}>{config.text}</span>;
  };


  return (
    <div className="p-6 h-full flex flex-col space-y-6 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">รายงาน NCR (NCR Report)</h2>
           <p className="text-slate-500 text-sm">ติดตามสถานะ NCR และส่งเรื่องคืนสินค้าอัตโนมัติ</p>
        </div>
        <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm text-slate-500 text-sm font-medium">
          พบข้อมูล {filteredNcrReports.length} รายการ
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 print:hidden">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหา เลขที่ NCR, ลูกค้า, สินค้า..."
            value={filters.query}
            onChange={e => setFilters({...filters, query: e.target.value})}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        
        <div className="flex gap-2">
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
              title="Start Date"
            />
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
              title="End Date"
            />
        </div>

        <select value={filters.action} onChange={e => setFilters({...filters, action: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">การดำเนินการทั้งหมด</option>
          <option value="Reject">ส่งคืน (Reject)</option>
          <option value="Scrap">ทำลาย (Scrap)</option>
        </select>
        <select value={filters.returnStatus} onChange={e => setFilters({...filters, returnStatus: e.target.value})} className="bg-slate-50 border border-slate-200 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option value="All">สถานะการคืนทั้งหมด</option>
          <option value="NotReturned">ยังไม่ส่งคืน</option>
          <option value="Requested">รอรับเข้า</option>
          <option value="Received">รอ QC</option>
          <option value="Graded">รอเอกสาร</option>
          <option value="Documented">รอปิดงาน</option>
          <option value="Completed">จบงานแล้ว</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
          <input type="checkbox" checked={filters.hasCost} onChange={e => setFilters({...filters, hasCost: e.target.checked})} />
          มีค่าใช้จ่าย
        </label>
        <button 
          onClick={handleExportExcel}
          className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col print:hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                <tr>
                <th className="px-4 py-3 bg-slate-50 sticky left-0 z-10 border-r">วันที่ / เลขที่ NCR</th>
                <th className="px-4 py-3">สินค้า (Product)</th>
                <th className="px-4 py-3">ลูกค้า (Customer)</th>
                <th className="px-4 py-3">ต้นทาง / ปลายทาง</th>
                <th className="px-4 py-3">วิเคราะห์ปัญหา (Source)</th>
                <th className="px-4 py-3 text-right">ค่าใช้จ่าย (Cost)</th>
                <th className="px-4 py-3 text-center">การดำเนินการ</th>
                <th className="px-4 py-3 text-center">สถานะการคืน</th>
                <th className="px-4 py-3 text-center bg-slate-50 sticky right-0 z-10 border-l">จัดการ</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
                 {filteredNcrReports.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400 italic">ไม่พบรายการ NCR ที่ตรงกับเงื่อนไข</td></tr>
                 ) : (
                    filteredNcrReports.map((row) => {
                        // itemData is now provided from expanded rows
                        const itemData = row.itemData;
                        const correspondingReturn = items.find(item => item.ncrNumber === row.ncrNo);
                        const isCanceled = row.status === 'Canceled';

                        return (
                            <tr key={`${row.id}-${itemData.id}`} className={`hover:bg-slate-50 ${isCanceled ? 'line-through text-slate-400 bg-slate-50' : ''}`}>
                                <td className={`px-4 py-3 sticky left-0 border-r ${isCanceled ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                                    <button 
                                        onClick={() => handleViewNCRForm(row)}
                                        disabled={isCanceled}
                                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left flex items-center gap-1 disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                                        title="ดูใบแจ้งปัญหาระบบ (View NCR Form)"
                                    >
                                        {row.ncrNo || row.id} <Eye className="w-3 h-3" />
                                    </button>
                                    <div className="text-xs">{row.date}</div>
                                    <div className="mt-1">
                                        {isCanceled ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300"><XCircle className="w-3 h-3" /> ยกเลิก</span>
                                        ) : row.status === 'Closed' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100"><CheckCircle className="w-3 h-3" /> Closed</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100"><Clock className="w-3 h-3" /> {row.status || 'Open'}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className={`font-bold flex items-center gap-2 ${isCanceled ? '' : 'text-blue-600'}`}>
                                        <Package className="w-4 h-4" /> {itemData.productCode}
                                    </div>
                                    <div className={isCanceled ? '' : 'text-slate-700'}>{itemData.productName}</div>
                                    <div className="text-xs">Qty: {itemData.quantity} {itemData.unit}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className={`flex items-center gap-2 font-medium ${isCanceled ? '' : 'text-slate-700'}`}>
                                        <User className="w-4 h-4" /> {itemData.customerName || '-'}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 text-xs">
                                        <span className="font-bold w-8">From:</span> {itemData.branch}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                        <span className="font-bold w-8">To:</span> <span className="truncate max-w-[150px]" title={itemData.destinationCustomer}>{itemData.destinationCustomer || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-[250px] whitespace-normal">
                                    <div className={`text-xs font-bold ${isCanceled ? '' : 'text-slate-700'} mb-0.5`}>{row.problemDetail}</div>
                                    <div className={`text-[10px] p-1 rounded border ${isCanceled ? 'bg-slate-100' : 'bg-slate-100 border-slate-200'}`}>
                                        Source: {itemData.problemSource}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {itemData.hasCost ? (
                                        <div className="flex flex-col items-end">
                                            <span className={`font-bold flex items-center gap-1 ${isCanceled ? '' : 'text-red-600'}`}>
                                                <DollarSign className="w-3 h-3" /> {itemData.costAmount?.toLocaleString()}
                                            </span>
                                            <span className="text-[10px]">{itemData.costResponsible}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                {row.actionReject || row.actionRejectSort ? (
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${isCanceled ? 'bg-slate-200' : 'bg-red-100 text-red-700 border-red-200'}`}>Reject</span>
                                ) : row.actionScrap ? (
                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold border ${isCanceled ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>Scrap</span>
                                ) : (
                                    <span className="text-xs">-</span>
                                )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {getReturnStatusBadge(correspondingReturn?.status)}
                                </td>
                                <td className={`px-4 py-3 text-center sticky right-0 border-l ${isCanceled ? 'bg-slate-100' : 'bg-white'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleOpenPrint(report)} disabled={isCanceled} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="พิมพ์ใบส่งคืน (Print Return Note)">
                                            <Printer className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleEditClick(row)} disabled={isCanceled} className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="แก้ไข (Edit)">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteClick(row.id)} disabled={isCanceled} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="ยกเลิก (Cancel)">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        
                                        {isCanceled ? (
                                            <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-500 px-2 py-1.5 rounded text-[10px] font-bold border border-slate-300">
                                                <XCircle className="w-3 h-3" /> ยกเลิกแล้ว
                                            </span>
                                        ) : correspondingReturn ? (
                                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1.5 rounded text-[10px] font-bold border border-green-200">
                                                <CheckCircle className="w-3 h-3" /> ส่งคืนแล้ว
                                            </span>
                                        ) : (
                                            (row.actionReject || row.actionScrap || row.actionRejectSort) && (
                                                <button onClick={() => handleCreateReturn(report)} className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-2 py-1.5 rounded shadow-sm transition-all transform hover:scale-105 text-[10px] font-bold" title="สร้างคำขอคืนสินค้าอัตโนมัติ">
                                                    ส่งคืน <ArrowRight className="w-3 h-3" />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })
                 )}
            </tbody>
            </table>
        </div>
      </div>
      
      {/* MODALS RESTORED */}
      
      {/* NCR FORM MODAL (View/Edit) */}
      {showNCRFormModal && ncrFormItem && (() => {
        const itemData = ncrFormItem.item || (ncrFormItem as any);
        return (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden flex flex-col relative print:w-full print:max-w-none print:shadow-none print:my-0">
                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center sticky top-0 z-10 print:hidden">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {isEditMode ? <Edit className="w-5 h-5 text-amber-400" /> : <FileText className="w-5 h-5 text-blue-400" />}
                            {isEditMode ? 'แก้ไข NCR (Edit Mode)' : 'รายละเอียด NCR (View Mode)'} : {ncrFormItem.ncrNo}
                        </h3>
                        <div className="flex gap-2">
                            {isEditMode ? (
                                <button onClick={handleSaveChanges} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-sm flex items-center gap-1"><Save className="w-4 h-4" /> บันทึกการแก้ไข</button>
                            ) : (
                                <button onClick={handlePrint} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-1"><Printer className="w-4 h-4" /> Print</button>
                            )}
                            <button onClick={() => setShowNCRFormModal(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                    </div>
                    
                    <div className="p-8 overflow-y-auto max-h-[85vh] print:max-h-none print:p-0 bg-white">
                        <div className="w-full border-2 border-black p-6 relative">
                            {/* HEADER */}
                            <div className="flex border-2 border-black mb-6">
                                <div className="w-[30%] border-r-2 border-black p-4 flex items-center justify-center"><img src="https://img2.pic.in.th/pic/logo-neo.png" alt="Neo Logistics" className="w-full h-auto object-contain max-h-24" /></div>
                                <div className="w-[70%] p-4 flex flex-col justify-center pl-6"><h2 className="text-xl font-bold text-slate-900 leading-none mb-2">บริษัท นีโอสยาม โลจิสติกส์ แอนด์ ทรานสปอร์ต จำกัด</h2><h3 className="text-sm font-bold text-slate-700 mb-3">NEOSIAM LOGISTICS & TRANSPORT CO., LTD.</h3><p className="text-sm text-slate-600 mb-1">159/9-10 หมู่ 7 ต.บางม่วง อ.เมืองนครสวรรค์ จ.นครสวรรค์ 60000</p><div className="text-sm text-slate-600 flex gap-4"><span>Tax ID: 0105552087673</span><span className="text-slate-400">|</span><span>Tel: 056-275-841</span></div></div>
                            </div>
                            <h1 className="text-xl font-bold text-center border-2 border-black py-2 mb-6 bg-white text-slate-900 print:bg-transparent">ใบแจ้งปัญหาระบบ (NCR) / ใบแจ้งปัญหารับสินค้าคืน</h1>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-8">
                                <div className="flex items-center gap-2"><label className="font-bold w-24 text-slate-800">ถึงหน่วยงาน:</label>
                                    {isEditMode ? <input type="text" className="flex-1 border-b border-dotted border-black outline-none" value={ncrFormItem.toDept} onChange={e => handleInputChange('toDept', e.target.value)} /> : <span className="flex-1 border-b border-dotted border-black px-1">{ncrFormItem.toDept}</span>}
                                </div>
                                <div className="flex items-center gap-2"><label className="font-bold w-24 text-slate-800">วันที่:</label>
                                    {isEditMode ? <input type="date" className="flex-1 border-b border-dotted border-black outline-none" value={ncrFormItem.date} onChange={e => handleInputChange('date', e.target.value)} /> : <span className="flex-1 border-b border-dotted border-black px-1">{ncrFormItem.date}</span>}
                                </div>
                                <div className="flex items-center gap-2"><label className="font-bold w-24 text-slate-800">สำเนา:</label>
                                    {isEditMode ? <input type="text" className="flex-1 border-b border-dotted border-black outline-none" value={ncrFormItem.copyTo} onChange={e => handleInputChange('copyTo', e.target.value)} /> : <span className="flex-1 border-b border-dotted border-black px-1">{ncrFormItem.copyTo}</span>}
                                </div>
                                <div className="flex items-center gap-2"><label className="font-bold w-24 text-slate-800">เลขที่ NCR:</label><span className="flex-1 border-b border-dotted border-black px-1 font-bold text-red-600">{ncrFormItem.ncrNo}</span></div>
                                <div className="flex items-center gap-2"><label className="font-bold w-24 text-slate-800">ผู้พบปัญหา:</label>
                                    {isEditMode ? <input type="text" className="flex-1 border-b border-dotted border-black outline-none" value={ncrFormItem.founder} onChange={e => handleInputChange('founder', e.target.value)} /> : <span className="flex-1 border-b border-dotted border-black px-1">{ncrFormItem.founder}</span>}
                                </div>
                                <div className="flex items-center gap-2"><label className="font-bold w-32 text-slate-800">เลขที่ใบสั่งซื้อ/ผลิต:</label>
                                    {isEditMode ? <input type="text" className="flex-1 border-b border-dotted border-black outline-none" value={ncrFormItem.poNo} onChange={e => handleInputChange('poNo', e.target.value)} /> : <span className="flex-1 border-b border-dotted border-black px-1">{ncrFormItem.poNo}</span>}
                                </div>
                            </div>

                            {/* ITEM DETAILS */}
                            <div className="mb-6 border-2 border-black p-4 text-sm bg-slate-50/50">
                                <h4 className="font-bold underline mb-3 text-slate-900">รายละเอียดสินค้า (Item Details)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><span className="font-bold">สาขา:</span> {itemData.branch}</div>
                                    <div><span className="font-bold">รหัสสินค้า:</span> {itemData.productCode}</div>
                                    <div className="col-span-2"><span className="font-bold">ชื่อสินค้า:</span> {itemData.productName}</div>
                                    <div><span className="font-bold">จำนวน:</span> {itemData.quantity} {itemData.unit}</div>
                                    <div><span className="font-bold">ลูกค้า:</span> {itemData.customerName}</div>
                                    <div className="col-span-2"><span className="font-bold">วิเคราะห์ปัญหา:</span> {itemData.problemSource}</div>
                                </div>
                            </div>
                            
                            {/* PROBLEM DETAILS */}
                            <table className="w-full border-2 border-black mb-6">
                                {/* ... content identical to NCRSystem ... */}
                            </table>
                            
                             {/* ACTION DETAILS */}
                            <table className="w-full border-2 border-black mb-6 text-sm bg-white">
                                {/* ... content identical to NCRSystem ... */}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
      })()}

      {/* Password Modal for Edit */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-4 text-slate-800">
                    <div className="bg-amber-100 p-2 rounded-full"><Lock className="w-6 h-6 text-amber-600" /></div>
                    <h3 className="text-lg font-bold">กรุณาระบุรหัสผ่าน</h3>
                </div>
                <input 
                type="password" 
                className="w-full border border-slate-300 rounded-lg p-2.5 text-center tracking-widest text-lg font-bold mb-6 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Enter Password" 
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">ยกเลิก</button>
                    <button onClick={handleVerifyPassword} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm">ยืนยัน</button>
                </div>
            </div>
        </div>
       )}

       {/* Password Modal for Delete/Cancel */}
       {showDeletePasswordModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-fade-in">
                <div className="flex items-center gap-3 mb-4 text-slate-800">
                    <div className="bg-red-100 p-2 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div>
                    <h3 className="text-lg font-bold text-red-600">ยืนยันการยกเลิกเอกสาร</h3>
                </div>
                <p className="text-sm text-slate-500 mb-4">การดำเนินการนี้จะเปลี่ยนสถานะเป็น <b>"ยกเลิก (Canceled)"</b> และไม่สามารถแก้ไขได้อีก</p>
                <input 
                type="password" 
                className="w-full border border-slate-300 rounded-lg p-2.5 text-center tracking-widest text-lg font-bold mb-6 focus:ring-2 focus:ring-red-500 outline-none" 
                placeholder="Enter Password" 
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasswordAndDelete()}
                />
                <div className="flex gap-3">
                    <button onClick={() => setShowDeletePasswordModal(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">ปิด</button>
                    <button onClick={handleVerifyPasswordAndDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm">ยืนยันการยกเลิก</button>
                </div>
            </div>
        </div>
       )}

    </div>
  );
};

export default NCRReport;