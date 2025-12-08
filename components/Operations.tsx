
import React from 'react';
import { useOperationsLogic } from './operations/hooks/useOperationsLogic';
import { Step1Request } from './operations/components/Step1Request';
import { Step2Intake } from './operations/components/Step2Intake';
import { Step3QC } from './operations/components/Step3QC';
import { Step4Docs } from './operations/components/Step4Docs';
import { Step5Complete } from './operations/components/Step5Complete';
import { SelectionModal } from './operations/components/SelectionModal';
import { DocumentPreviewModal } from './operations/components/DocumentPreviewModal';
import { Step4SplitModal } from './operations/components/Step4SplitModal';
import { FileInput, Truck, Activity, ClipboardList, FileText } from 'lucide-react';

const Operations: React.FC = () => {
  const { state, derived, actions } = useOperationsLogic();


  const MENU_ITEMS = [
    { id: 1, label: 'แจ้งคืนสินค้า', icon: FileInput, count: derived.requestedItems.length || undefined, color: 'text-blue-600' },
    { id: 2, label: 'รับสินค้าเข้า', icon: Truck, count: derived.requestedItems.length || undefined, color: 'text-amber-500' },
    { id: 3, label: 'ตรวจสอบคุณภาพ', icon: Activity, count: derived.receivedItems.length || undefined, color: 'text-blue-500' },
    { id: 4, label: 'จัดการเอกสาร', icon: ClipboardList, count: derived.processedItems.length || undefined, color: 'text-slate-600' },
    { id: 5, label: 'ปิดงาน', icon: FileText, count: derived.documentedItems.length || undefined, color: 'text-green-600' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sarabun">
      {/* Sidebar Menu */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" /> Operations Hub
          </h1>
          <p className="text-blue-100 text-xs mt-1">ระบบจัดการสินค้าคืนและ QC</p>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = state.activeStep === item.id;
            return (
              <button
                key={item.id}
                onClick={() => actions.setActiveStep(item.id as any)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'bg-slate-100'} ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600">System Status</span>
            </div>
            <div className="text-[10px] text-slate-400 space-y-1">
              <div className="flex justify-between"><span>Database:</span> <span className="text-green-600 font-bold">Connected</span></div>
              <div className="flex justify-between"><span>Sync:</span> <span className="text-green-600 font-bold">Auto</span></div>
              <div className="flex justify-between"><span>Version:</span> <span>2.5.0 (Beta)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {state.activeStep === 1 && (
          <Step1Request
            formData={state.formData}
            requestItems={state.requestItems}
            isCustomBranch={state.isCustomBranch}
            uniqueCustomers={derived.uniqueCustomers}
            uniqueDestinations={derived.uniqueDestinations}
            uniqueProductCodes={derived.uniqueProductCodes}
            uniqueProductNames={derived.uniqueProductNames}
            setFormData={actions.setFormData}
            setIsCustomBranch={actions.setIsCustomBranch}
            setRequestItems={actions.setRequestItems}
            handleAddItem={actions.handleAddItem}
            handleRemoveItem={actions.handleRemoveItem}
            handleImageUpload={actions.handleImageUpload}
            handleRemoveImage={actions.handleRemoveImage}
            handleRequestSubmit={actions.handleRequestSubmit}
          />
        )}

        {state.activeStep === 2 && (
          <Step2Intake
            requestedItems={derived.requestedItems}
            handleIntakeReceive={actions.handleIntakeReceive}
          />
        )}

        {state.activeStep === 3 && (
          <Step3QC
            receivedItems={derived.receivedItems}
            qcSelectedItem={state.qcSelectedItem}
            customInputType={state.customInputType}
            selectedDisposition={state.selectedDisposition}
            dispositionDetails={state.dispositionDetails}
            isCustomRoute={state.isCustomRoute}
            showSplitMode={state.showSplitMode}
            isBreakdownUnit={state.isBreakdownUnit}
            conversionRate={state.conversionRate}
            newUnitName={state.newUnitName}
            splitQty={state.splitQty}
            splitCondition={state.splitCondition}
            splitDisposition={state.splitDisposition}

            selectQCItem={actions.selectQCItem}
            setQcSelectedItem={actions.setQcSelectedItem}
            handleConditionSelect={actions.handleConditionSelect}
            setSelectedDisposition={actions.setSelectedDisposition}
            setIsCustomRoute={actions.setIsCustomRoute}
            handleDispositionDetailChange={actions.handleDispositionDetailChange}
            setShowSplitMode={actions.setShowSplitMode}
            setIsBreakdownUnit={actions.setIsBreakdownUnit}
            setConversionRate={actions.setConversionRate}
            setNewUnitName={actions.setNewUnitName}
            setSplitQty={actions.setSplitQty}
            setSplitCondition={actions.setSplitCondition}
            setSplitDisposition={actions.setSplitDisposition}
            handleSplitSubmit={actions.handleSplitSubmit}
            handleQCSubmit={actions.handleQCSubmit}
            toggleSplitMode={actions.toggleSplitMode}
          />
        )}

        {state.activeStep === 4 && (
          <Step4Docs
            processedItems={derived.processedItems}
            onPrintClick={(status) => actions.handlePrintClick(status, derived.processedItems.filter(i =>
              i.disposition === status || (status === 'InternalUse' && !i.disposition)
            ))}
            onSplitClick={actions.handleDocItemClick}
          />
        )}

        {state.activeStep === 5 && (
          <Step5Complete
            documentedItems={derived.documentedItems}
            completedItems={derived.completedItems}
            handleCompleteJob={actions.handleCompleteJob}
          />
        )}
      </div>

      {/* Modals */}
      <SelectionModal
        isOpen={state.showSelectionModal}
        onClose={() => actions.setShowSelectionModal(false)}
        selectionItems={state.selectionItems}
        selectionStatus={state.selectionStatus}
        selectedItemIds={state.selectedItemIds}
        toggleSelection={actions.toggleSelection}
        handleGenerateDoc={actions.handleGenerateDoc}
        onSplit={actions.handleDocItemClick}
      />

      <DocumentPreviewModal
        isOpen={state.showDocModal}
        onClose={() => actions.setShowDocModal(false)}
        docData={state.docData}
        docConfig={state.docConfig}
        setDocConfig={actions.setDocConfig}
        isDocEditable={state.isDocEditable}
        setIsDocEditable={actions.setIsDocEditable}
        includeVat={state.includeVat}
        setIncludeVat={actions.setIncludeVat}
        vatRate={state.vatRate}
        setVatRate={actions.setVatRate}
        handleConfirmDocGeneration={actions.handleConfirmDocGeneration}
      />

      <Step4SplitModal
        isOpen={state.showStep4SplitModal}
        onClose={() => actions.setShowStep4SplitModal(false)}
        item={state.docSelectedItem}
        onConfirm={actions.handleStep4SplitSubmit}
      />
    </div>
  );
};

export default Operations;