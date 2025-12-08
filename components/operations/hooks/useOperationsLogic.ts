import React, { useState, useEffect } from 'react';
import { useData } from '../../../DataContext';
import { ReturnRecord, ItemCondition, DispositionAction } from '../../../types';
import { getISODetails, RESPONSIBLE_MAPPING } from '../utils';

export const useOperationsLogic = (initialData?: Partial<ReturnRecord> | null, onClearInitialData?: () => void) => {
    const { items, addReturnRecord, updateReturnRecord, addNCRReport, getNextNCRNumber } = useData();

    // Workflow State
    const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [isCustomBranch, setIsCustomBranch] = useState(false);

    // QC State
    const [qcSelectedItem, setQcSelectedItem] = useState<ReturnRecord | null>(null);
    const [customInputType, setCustomInputType] = useState<'Good' | 'Bad' | null>(null);

    // Split Logic State
    const [showSplitMode, setShowSplitMode] = useState(false);
    const [splitQty, setSplitQty] = useState(0);
    const [splitCondition, setSplitCondition] = useState<ItemCondition>('Damaged');

    // Unit Breakdown State
    const [isBreakdownUnit, setIsBreakdownUnit] = useState(false);
    const [conversionRate, setConversionRate] = useState(1);
    const [newUnitName, setNewUnitName] = useState('');
    const [splitDisposition, setSplitDisposition] = useState<DispositionAction | null>(null);

    // Disposition Temp State
    const [selectedDisposition, setSelectedDisposition] = useState<DispositionAction | null>(null);
    const [dispositionDetails, setDispositionDetails] = useState({
        route: '',
        sellerName: '',
        contactPhone: '',
        internalUseDetail: '',
        claimCompany: '',
        claimCoordinator: '',
        claimPhone: ''
    });
    const [isCustomRoute, setIsCustomRoute] = useState(false);

    // Document Generator State
    const [showDocModal, setShowDocModal] = useState(false);
    const [docData, setDocData] = useState<{ type: DispositionAction, items: ReturnRecord[] } | null>(null);
    const [includeVat, setIncludeVat] = useState(true);
    const [vatRate, setVatRate] = useState(7);
    const [isDocEditable, setIsDocEditable] = useState(false);
    const [docConfig, setDocConfig] = useState({
        companyNameTH: 'บริษัท นีโอสยาม โลจิสติกส์ แอนด์ ทรานสปอร์ต จำกัด',
        companyNameEN: 'NEOSIAM LOGISTICS & TRANSPORT CO., LTD.',
        address: '159/9-10 หมู่ 7 ต.บางม่วง อ.เมืองนครสวรรค์ จ.นครสวรรค์ 60000',
        contact: 'Tel: 056-275-841 Email: info_nw@neosiamlogistics.com',
        titleTH: '',
        titleEN: '',
        remarks: '1. กรุณาตรวจสอบความถูกต้องของสินค้าภายใน 7 วัน',
        signatory1: 'ผู้จัดทำ (Prepared By)',
        signatory2: 'ผู้ตรวจสอบ (Checked By)',
        signatory3: 'ผู้อนุมัติ (Approved By)'
    });

    // Document Selection State
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [selectionStatus, setSelectionStatus] = useState<DispositionAction | null>(null);
    const [selectionItems, setSelectionItems] = useState<ReturnRecord[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 4 Split State
    const [docSelectedItem, setDocSelectedItem] = useState<ReturnRecord | null>(null);
    const [showStep4SplitModal, setShowStep4SplitModal] = useState(false);

    // Manual Intake Form State
    const initialFormState: Partial<ReturnRecord> = {
        branch: 'พิษณุโลก',
        date: new Date().toISOString().split('T')[0],
        quantity: 1,
        unit: 'ชิ้น',
        priceBill: 0,
        priceSell: 0,
        status: 'Requested',
        disposition: 'Pending',
        condition: 'Unknown',
        productCode: '',
        expiryDate: '',
        notes: '',
        ncrNumber: '',
        refNo: '',
        neoRefNo: '',
        customerName: '',
        destinationCustomer: '',
        problemDamaged: false, problemDamagedInBox: false, problemLost: false, problemMixed: false,
        problemWrongInv: false, problemLate: false, problemDuplicate: false, problemWrong: false,
        problemIncomplete: false, problemOver: false, problemWrongInfo: false, problemShortExpiry: false,
        problemTransportDamage: false, problemAccident: false,
        problemPOExpired: false, problemNoBarcode: false, problemNotOrdered: false,
        problemOther: false,
        problemOtherText: '', problemDetail: '',
        actionReject: false, actionRejectQty: 0, actionRejectSort: false, actionRejectSortQty: 0,
        actionRework: false, actionReworkQty: 0, actionReworkMethod: '',
        actionSpecialAcceptance: false, actionSpecialAcceptanceQty: 0, actionSpecialAcceptanceReason: '',
        actionScrap: false, actionScrapQty: 0,
        actionScrapReplace: false, // Corrected name from actionScrapReplace
        actionScrapReplaceQty: 0,
        causePackaging: false, causeTransport: false, causeOperation: false, causeEnv: false,
        causeDetail: '', preventionDetail: '',

        images: [],
        hasCost: false, costAmount: 0, costResponsible: '', problemSource: '',
        problemAnalysis: undefined, problemAnalysisSub: '', problemAnalysisCause: '', problemAnalysisDetail: ''
    };
    const [formData, setFormData] = useState<Partial<ReturnRecord>>(initialFormState);
    const [requestItems, setRequestItems] = useState<Partial<ReturnRecord>[]>([]);
    const [customProblemType, setCustomProblemType] = useState('');
    const [customRootCause, setCustomRootCause] = useState('');

    // Derived Data (filtered items)
    const requestedItems = items.filter(i => i.status === 'Requested');
    const receivedItems = items.filter(i => i.status === 'Received');
    const gradedItems = items.filter(i => i.status === 'Graded');
    const documentedItems = items.filter(i => i.status === 'Documented');
    const completedItems = items.filter(i => i.status === 'Completed');
    const processedItems = items.filter(i => i.status === 'Graded');

    // Autocomplete Data
    const uniqueCustomers = React.useMemo(() => {
        const dbValues = items.map(i => i.customerName).filter(Boolean);
        const localValues = requestItems.map(i => i.customerName).filter(Boolean);
        return Array.from(new Set([...dbValues, ...localValues])).sort();
    }, [items, requestItems]);

    const uniqueDestinations = React.useMemo(() => {
        const dbValues = items.map(i => i.destinationCustomer).filter(Boolean);
        const localValues = requestItems.map(i => i.destinationCustomer).filter(Boolean);
        return Array.from(new Set([...dbValues, ...localValues])).sort();
    }, [items, requestItems]);

    const uniqueProductCodes = React.useMemo(() => {
        const dbValues = items.map(i => i.productCode).filter(Boolean);
        const localValues = requestItems.map(i => i.productCode).filter(Boolean);
        return Array.from(new Set([...dbValues, ...localValues])).sort();
    }, [items, requestItems]);

    const uniqueProductNames = React.useMemo(() => {
        const dbValues = items.map(i => i.productName).filter(Boolean);
        const localValues = requestItems.map(i => i.productName).filter(Boolean);
        return Array.from(new Set([...dbValues, ...localValues])).sort();
    }, [items, requestItems]);

    useEffect(() => {
        if (initialData) {
            setActiveStep(1);
            setFormData(prev => ({
                ...prev,
                ...initialData,
                date: initialData.date || prev.date,
                branch: initialData.branch || prev.branch,
            }));
            if (onClearInitialData) onClearInitialData();
        }
    }, [initialData, onClearInitialData]);

    const handleDispositionDetailChange = (key: keyof typeof dispositionDetails, value: string) => {
        setDispositionDetails(prev => ({ ...prev, [key]: value }));
    };

    // Auto-map responsible person based on problem source
    useEffect(() => {
        if (formData.hasCost && formData.problemSource) {
            const responsible = RESPONSIBLE_MAPPING[formData.problemSource];
            if (responsible) {
                setFormData(prev => ({ ...prev, costResponsible: responsible }));
            }
        }
    }, [formData.problemSource, formData.hasCost]);

    const selectQCItem = (item: ReturnRecord) => {
        setQcSelectedItem(item);
        setCustomInputType(null);
        setSelectedDisposition(null);
        setDispositionDetails({
            route: '', sellerName: '', contactPhone: '', internalUseDetail: '',
            claimCompany: '', claimCoordinator: '', claimPhone: ''
        });
        setIsCustomRoute(false);
    };

    const handleConditionSelect = (condition: ItemCondition, type?: 'Good' | 'Bad') => {
        if (!qcSelectedItem) return;
        if (condition === 'Other') {
            setCustomInputType(type || null);
            setQcSelectedItem({ ...qcSelectedItem, condition: '' });
        } else {
            setCustomInputType(null);
            setQcSelectedItem({ ...qcSelectedItem, condition });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({
                        ...prev,
                        images: [...(prev.images || []), reader.result as string]
                    }));
                };
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: (prev.images || []).filter((_, i) => i !== index)
        }));
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.productName || !formData.productCode || !formData.founder) {
            alert("กรุณาระบุชื่อสินค้า, รหัสสินค้า และผู้พบปัญหา (Founder)");
            return;
        }
        const newItem = { ...formData };
        setRequestItems(prev => [...prev, newItem]);
        setFormData(prev => ({
            ...initialFormState,
            branch: prev.branch,
            date: prev.date,
            customerName: prev.customerName,
            destinationCustomer: prev.destinationCustomer,
            neoRefNo: prev.neoRefNo,
            refNo: prev.refNo
        }));
        setCustomProblemType('');
        setCustomRootCause('');
    };

    const handleRemoveItem = (index: number) => {
        setRequestItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleRequestSubmit = async () => {
        let itemsToProcess = [...requestItems];
        const currentFormIsFilled = formData.productName && formData.productCode && formData.quantity && (formData.quantity > 0);

        if (currentFormIsFilled) {
            const isDuplicate = requestItems.some(item =>
                item.productCode === formData.productCode && item.quantity === formData.quantity && item.refNo === formData.refNo
            );
            if (requestItems.length === 0 || !isDuplicate) {
                itemsToProcess.push(formData);
            }
        }

        if (itemsToProcess.length === 0) {
            alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการก่อนยืนยัน");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let successCount = 0;
            let savedNcrNumbers: string[] = [];

            for (const item of itemsToProcess) {
                let finalNcrNumber = item.ncrNumber;
                if (!finalNcrNumber) {
                    finalNcrNumber = await getNextNCRNumber();
                }

                const record: ReturnRecord = {
                    ...item as ReturnRecord,
                    id: `RT-${new Date().getFullYear()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    amount: (item.quantity || 0) * (item.priceBill || 0),
                    reason: item.problemDetail || item.notes || 'แจ้งคืนสินค้า',
                    status: 'Requested',
                    dateRequested: item.date || new Date().toISOString().split('T')[0],
                    disposition: 'Pending', // Initial defaults
                    condition: 'Unknown',
                    productName: item.productName || 'Unknown Product',
                    productCode: item.productCode || 'N/A',
                    customerName: item.customerName || 'Unknown Customer',
                    category: 'General',
                    ncrNumber: finalNcrNumber,
                };

                const success = await addReturnRecord(record);

                if (success) {
                    // Create NCR Record if needed
                    const ncrRecord: any = {
                        id: finalNcrNumber + '-' + record.id,
                        ncrNo: finalNcrNumber,
                        date: record.dateRequested,
                        toDept: 'แผนกควบคุมคุณภาพ',
                        founder: 'Operations Hub',
                        poNo: '', copyTo: '',
                        problemDamaged: record.problemDamaged,
                        problemDamagedInBox: record.problemDamagedInBox,
                        problemLost: record.problemLost,
                        problemMixed: record.problemMixed,
                        problemWrongInv: record.problemWrongInv,
                        problemLate: record.problemLate,
                        problemDuplicate: record.problemDuplicate,
                        problemWrong: record.problemWrong,
                        problemIncomplete: record.problemIncomplete,
                        problemOver: record.problemOver,
                        problemWrongInfo: record.problemWrongInfo,
                        problemShortExpiry: record.problemShortExpiry,
                        problemTransportDamage: record.problemTransportDamage,
                        problemAccident: record.problemAccident,
                        problemOther: record.problemOther,
                        problemOtherText: record.problemOtherText,
                        problemDetail: record.problemDetail || record.reason || '',
                        item: {
                            id: record.id,
                            branch: record.branch,
                            refNo: record.refNo,
                            neoRefNo: record.neoRefNo,
                            productCode: record.productCode,
                            productName: record.productName,
                            customerName: record.customerName,
                            destinationCustomer: record.destinationCustomer,
                            quantity: record.quantity,
                            unit: record.unit || 'PCS',
                            priceBill: record.priceBill,
                            expiryDate: record.expiryDate,
                            hasCost: false, costAmount: 0, costResponsible: '', problemSource: '-'
                        },
                        actionReject: record.actionReject,
                        actionRejectQty: record.actionRejectQty,
                        actionRejectSort: record.actionRejectSort,
                        actionRejectSortQty: record.actionRejectSortQty,
                        actionRework: record.actionRework,
                        actionReworkQty: record.actionReworkQty,
                        actionReworkMethod: record.actionReworkMethod,
                        actionSpecialAccept: record.actionSpecialAcceptance,
                        actionSpecialAcceptQty: record.actionSpecialAcceptanceQty,
                        actionSpecialAcceptReason: record.actionSpecialAcceptanceReason,
                        actionScrap: record.actionScrap,
                        actionScrapQty: record.actionScrapQty,
                        actionReplace: record.actionScrapReplace,
                        actionReplaceQty: record.actionScrapReplaceQty,
                        causePackaging: record.causePackaging,
                        causeTransport: record.causeTransport,
                        causeOperation: record.causeOperation,
                        causeEnv: record.causeEnv,
                        causeDetail: record.causeDetail,
                        preventionDetail: record.preventionDetail,
                        preventionDueDate: '', responsiblePerson: '', responsiblePosition: '',
                        qaAccept: false, qaReject: false, qaReason: '',
                        dueDate: '', approver: '', approverPosition: '', approverDate: '',
                        status: 'Open'
                    };

                    const ncrSuccess = await addNCRReport(ncrRecord);
                    if (!ncrSuccess) {
                        alert(`Warning: Failed to create NCR Record for ${record.id}`);
                    }
                    successCount++;
                    if (finalNcrNumber) savedNcrNumbers.push(finalNcrNumber);
                }
            }

            if (successCount > 0) {
                const ncrListText = savedNcrNumbers.length > 0 ? `\n(NCR No: ${Array.from(new Set(savedNcrNumbers)).join(', ')})` : '';
                alert(`บันทึกคำขอคืนเรียบร้อย ${successCount} รายการ! ${ncrListText} \nรายการจะไปรอที่ขั้นตอน "รับสินค้าเข้า"`);
                setFormData(initialFormState);
                setRequestItems([]);
                setCustomProblemType('');
                setCustomRootCause('');
                setIsCustomBranch(false);
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleIntakeReceive = async (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        await updateReturnRecord(id, { status: 'Received', dateReceived: today });
    };

    const handleQCSubmit = async () => {
        if (!qcSelectedItem || !selectedDisposition) return;
        if (!qcSelectedItem.condition || qcSelectedItem.condition === 'Unknown') {
            alert("กรุณาระบุสภาพสินค้า");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        const success = await updateReturnRecord(qcSelectedItem.id, {
            condition: qcSelectedItem.condition,
            disposition: selectedDisposition,
            status: 'Graded',
            dateGraded: today,
            dispositionRoute: dispositionDetails.route,
            sellerName: dispositionDetails.sellerName,
            contactPhone: dispositionDetails.contactPhone,
            internalUseDetail: dispositionDetails.internalUseDetail,
            claimCompany: dispositionDetails.claimCompany,
            claimCoordinator: dispositionDetails.claimCoordinator,
            claimPhone: dispositionDetails.claimPhone
        });

        if (success) {
            setQcSelectedItem(null);
            setSelectedDisposition(null);
            setCustomInputType(null);
            setIsCustomRoute(false);
            alert('บันทึกผลการตรวจสอบคุณภาพเรียบร้อย (Ready for Documentation)');
        }
    };

    const handleSplitSubmit = async () => {
        const currentQty = qcSelectedItem?.quantity || 0;
        const totalAvailable = isBreakdownUnit ? (currentQty * conversionRate) : currentQty;

        // Improved Validation: Check if integer
        if (!Number.isInteger(splitQty)) {
            alert("กรุณาระบุจำนวนเป็นจำนวนเต็ม");
            return;
        }

        if (!qcSelectedItem || splitQty <= 0 || splitQty >= totalAvailable) {
            alert(`จำนวนที่แยกต้องมากกว่า 0 และน้อยกว่าจำนวนทั้งหมด (${totalAvailable})`);
            return;
        }
        if (!qcSelectedItem.condition || qcSelectedItem.condition === 'Unknown') {
            alert("กรุณาระบุสภาพสินค้าหลัก (Main Item)");
            return;
        }
        if (!selectedDisposition) {
            alert("กรุณาเลือกการตัดสินใจ (Disposition) สำหรับรายการหลักก่อนแยกรายการ");
            return;
        }

        const finalUnit = isBreakdownUnit ? (newUnitName || 'Sub-unit') : qcSelectedItem.unit;
        const finalPriceBill = isBreakdownUnit && conversionRate > 1 ? (qcSelectedItem.priceBill || 0) / conversionRate : qcSelectedItem.priceBill;
        const finalPriceSell = isBreakdownUnit && conversionRate > 1 ? (qcSelectedItem.priceSell || 0) / conversionRate : qcSelectedItem.priceSell;

        const mainQty = totalAvailable - splitQty;
        const today = new Date().toISOString().split('T')[0];



        const updateMainSuccess = await updateReturnRecord(qcSelectedItem.id, {
            quantity: mainQty,
            unit: finalUnit,
            priceBill: finalPriceBill,
            priceSell: finalPriceSell,
            condition: qcSelectedItem.condition,
            disposition: selectedDisposition,
            status: 'Graded',
            dateGraded: today,
            dispositionRoute: dispositionDetails.route,
            sellerName: dispositionDetails.sellerName,
            contactPhone: dispositionDetails.contactPhone,
            internalUseDetail: dispositionDetails.internalUseDetail,
            claimCompany: dispositionDetails.claimCompany,
            claimCoordinator: dispositionDetails.claimCoordinator,
            claimPhone: dispositionDetails.claimPhone
        });

        const splitId = `${qcSelectedItem.id}-S${Math.floor(Math.random() * 100)}`;
        const splitStatus = splitDisposition ? 'Graded' : 'Received';

        const splitItem: ReturnRecord = {
            ...qcSelectedItem,
            id: splitId,
            quantity: splitQty,
            unit: finalUnit,
            priceBill: finalPriceBill,
            priceSell: finalPriceSell,
            condition: splitCondition,
            status: splitStatus,
            refNo: `${qcSelectedItem.refNo} (Split)`,
            dateReceived: today,
        };

        if (splitDisposition) {
            (splitItem as any).disposition = splitDisposition;
            (splitItem as any).dateGraded = today;
        } else {
            delete (splitItem as any).disposition;
            delete (splitItem as any).dateGraded;
        }

        const createSplitSuccess = await addReturnRecord(splitItem);

        if (updateMainSuccess && createSplitSuccess) {
            setQcSelectedItem(null);
            setSelectedDisposition(null);
            setCustomInputType(null);
            setIsCustomRoute(false);
            setShowSplitMode(false);
            setSplitQty(0);
            setIsBreakdownUnit(false);
            setConversionRate(1);
            setNewUnitName('');
            setSplitDisposition(null);
            alert(`ดำเนินการแยกรายการเรียบร้อย\n- รายการหลัก: ${mainQty} ${finalUnit}\n- รายการแยก: ${splitQty} ${finalUnit}`);
        } else {
            alert("เกิดข้อผิดพลาดในการแยกรายการ");
        }
    };

    const toggleSplitMode = () => {
        if (!showSplitMode) {
            // Reset ALL Split State when opening
            setSplitQty(0);
            setSplitDisposition(null);
            setSplitCondition('New');
            setIsBreakdownUnit(false);
            setConversionRate(1);
            setNewUnitName('');
        }
        setShowSplitMode(!showSplitMode);
    };

    const handlePrintClick = (status: DispositionAction, list: ReturnRecord[]) => {
        if (list.length === 0) {
            alert('ไม่พบรายการสินค้าในสถานะนี้');
            return;
        }
        setSelectionStatus(status);
        setSelectionItems(list);
        setSelectedItemIds(new Set(list.map(i => i.id)));
        setShowSelectionModal(true);
    };

    const handleGenerateDoc = () => {
        if (!selectionStatus) return;
        const selectedList = selectionItems.filter(item => selectedItemIds.has(item.id));
        if (selectedList.length === 0) {
            alert("กรุณาเลือกรายการสินค้าอย่างน้อย 1 รายการก่อนสร้างเอกสาร");
            return;
        }
        const details = getISODetails(selectionStatus);
        setDocConfig(prev => ({ ...prev, titleTH: details.th, titleEN: details.en }));
        setDocData({ type: selectionStatus, items: selectedList });
        setIncludeVat(true);
        setShowSelectionModal(false);
        setShowDocModal(true);
        setIsDocEditable(false);
    };

    const handleConfirmDocGeneration = async () => {
        if (!docData) return;
        const today = new Date().toISOString().split('T')[0];

        let successCount = 0;
        for (const item of docData.items) {
            const success = await updateReturnRecord(item.id, { status: 'Documented', dateDocumented: today });
            if (success) successCount++;
        }

        if (successCount > 0) {
            alert(`สร้างเอกสารและบันทึกสถานะเรียบร้อย ${successCount} รายการ`);
            setShowDocModal(false);
        }
    };

    const handleCompleteJob = async (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        await updateReturnRecord(id, { status: 'Completed', dateCompleted: today });
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedItemIds(newSet);
    };

    return {
        state: {
            activeStep, isCustomBranch, qcSelectedItem, customInputType,
            showSplitMode, splitQty, splitCondition, isBreakdownUnit, conversionRate, newUnitName, splitDisposition,
            selectedDisposition, dispositionDetails, isCustomRoute,
            showDocModal, docData, includeVat, vatRate, isDocEditable, docConfig,
            showSelectionModal, selectionStatus, selectionItems, selectedItemIds,
            formData, requestItems, customProblemType, customRootCause,
            docSelectedItem, showStep4SplitModal
        },
        derived: {
            uniqueCustomers, uniqueDestinations, uniqueProductCodes, uniqueProductNames,
            requestedItems, receivedItems, gradedItems, documentedItems, completedItems, processedItems
        },
        actions: {
            setActiveStep, setIsCustomBranch, setFormData, setRequestItems,
            handleImageUpload, handleRemoveImage, handleAddItem, handleRemoveItem, handleRequestSubmit,
            handleIntakeReceive, selectQCItem, handleConditionSelect, setQcSelectedItem, setCustomInputType,
            setSelectedDisposition, setIsCustomRoute, handleDispositionDetailChange, handleQCSubmit,
            setShowSplitMode, setIsBreakdownUnit, setConversionRate, setNewUnitName, setSplitQty, setSplitCondition, setSplitDisposition, handleSplitSubmit,
            toggleSplitMode,
            handlePrintClick, toggleSelection, setShowSelectionModal,
            handleGenerateDoc, setIncludeVat, setVatRate, setIsDocEditable, setDocConfig, setShowDocModal,
            handleConfirmDocGeneration,

            // Step 4 Split Actions
            setDocSelectedItem, setShowStep4SplitModal,
            handleDocItemClick: (item: ReturnRecord) => {
                setDocSelectedItem(item);
                setShowStep4SplitModal(true);
            },
            handleStep4SplitSubmit: async (splitQty: number, newDisposition: DispositionAction, isBreakdown: boolean = false, rate: number = 1, newUnit: string = '', mainDisposition?: DispositionAction) => {
                if (!docSelectedItem) {
                    alert("Error: No Item Selected in State!");
                    return;
                }

                const currentQty = docSelectedItem.quantity;
                const totalAvailable = isBreakdown ? (currentQty * rate) : currentQty;

                if (splitQty <= 0) {
                    alert("จำนวนที่แยกต้องมากกว่า 0");
                    return;
                }
                if (splitQty >= totalAvailable) {
                    alert("จำนวนที่แยกต้องน้อยกว่าจำนวนทั้งหมด (ต้องเหลือรายการหลักอย่างน้อย 1)");
                    return;
                }

                const mainQty = totalAvailable - splitQty;
                const finalUnit = isBreakdown ? (newUnit || 'Sub-unit') : docSelectedItem.unit;

                // Recalculate price
                const finalPriceBill = isBreakdown && rate > 1 ? (docSelectedItem.priceBill || 0) / rate : docSelectedItem.priceBill;
                const finalPriceSell = isBreakdown && rate > 1 ? (docSelectedItem.priceSell || 0) / rate : docSelectedItem.priceSell;
                const finalMainDisposition = mainDisposition || docSelectedItem.disposition || 'Return';

                try {
                    // 1. Update Main Item
                    const updateMainPayload: Partial<ReturnRecord> = {
                        quantity: mainQty,
                        disposition: finalMainDisposition
                    };
                    if (isBreakdown) {
                        updateMainPayload.unit = finalUnit;
                        updateMainPayload.priceBill = finalPriceBill;
                        updateMainPayload.priceSell = finalPriceSell;
                    }

                    const updateMainSuccess = await updateReturnRecord(docSelectedItem.id, updateMainPayload);
                    if (!updateMainSuccess) throw new Error("Failed to update Main Item");

                    // 2. Create Split Item
                    const today = new Date().toISOString().split('T')[0];
                    const splitId = `${docSelectedItem.id}-S${Math.floor(Math.random() * 1000)}`;
                    const splitItem: ReturnRecord = {
                        ...docSelectedItem,
                        id: splitId,
                        quantity: splitQty,
                        unit: finalUnit,
                        priceBill: finalPriceBill,
                        priceSell: finalPriceSell,
                        disposition: newDisposition,
                        status: 'Graded', // Remains in Step 4 view
                        refNo: `${docSelectedItem.refNo} (Split)`,
                        dateGraded: today,
                        ncrNumber: docSelectedItem.ncrNumber,
                        parentId: docSelectedItem.id // Traceability: Link to parent
                    };

                    const createSplitSuccess = await addReturnRecord(splitItem);
                    if (!createSplitSuccess) throw new Error("Failed to create Split Item");

                    // 3. Success Feedback & UI Update
                    alert(`แยกรายการสำเร็จ / Split Successful!\n- Main: ${mainQty} ${finalUnit} (${finalMainDisposition})\n- Split: ${splitQty} ${finalUnit} (${newDisposition})`);

                    // Intelligent List Update
                    if (showSelectionModal) {
                        setSelectionItems(prev => {
                            const newList: ReturnRecord[] = [];
                            prev.forEach(item => {
                                if (item.id === docSelectedItem.id) {
                                    // Main Item Logic: Keep it only if it still belongs in this view
                                    if (finalMainDisposition === selectionStatus) {
                                        const updatedMain = {
                                            ...item,
                                            quantity: mainQty,
                                            unit: finalUnit,
                                            priceBill: finalPriceBill,
                                            priceSell: finalPriceSell,
                                            disposition: finalMainDisposition
                                        };
                                        newList.push(updatedMain);
                                    }

                                    // Split Item Logic: Add it if it belongs in this view
                                    if (newDisposition === selectionStatus) {
                                        newList.push(splitItem);
                                    }
                                } else {
                                    newList.push(item);
                                }
                            });
                            return newList;
                        });

                        // Update Checkbox Selection State
                        setSelectedItemIds(prev => {
                            const newSet = new Set(prev);
                            if (finalMainDisposition !== selectionStatus) {
                                newSet.delete(docSelectedItem.id);
                            }
                            return newSet;
                        });
                    }

                    setShowStep4SplitModal(false);
                    setDocSelectedItem(null);

                } catch (error) {
                    console.error("Split Error:", error);
                    alert(`เกิดข้อผิดพลาด (Error): ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            },
            handleCompleteJob,
            setCustomProblemType, setCustomRootCause
        }
    };
};
