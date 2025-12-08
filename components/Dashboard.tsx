
import React, { useMemo } from 'react';
import { useData } from '../DataContext';
import { db } from '../firebase';
import { ref, remove, set } from 'firebase/database';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Activity, AlertTriangle,
  Truck, CheckCircle, Clock, FileText, Package, AlertOctagon, DollarSign, Trash2
} from 'lucide-react';

const COLORS = {
  Restock: '#22c55e', // Green
  RTV: '#f59e0b',     // Amber
  Recycle: '#ef4444', // Red
  Claim: '#3b82f6',   // Blue
  InternalUse: '#a855f7', // Purple
  Pending: '#94a3b8'  // Slate
};

const Dashboard: React.FC = () => {
  const { items, ncrReports } = useData();

  // 1. Operation Pipeline Metrics (Aligned with Operations Hub Queues)
  const pipeline = useMemo(() => {
    return {
      requested: items.filter(i => i.status === 'Pending').length,      // Step 1: Drafts/New
      received: items.filter(i => i.status === 'Requested').length,     // Step 2: To Receive (Intake Queue)
      graded: items.filter(i => i.status === 'Received').length,        // Step 3: To QC (QC Queue)
      documented: items.filter(i => i.status === 'Graded').length,      // Step 4: To Docs (Docs Queue)
      completed: items.filter(i => i.status === 'Documented').length    // Step 5: To Close (Close Queue)
    };
  }, [items]);

  // 2. Financial Metrics & Cost Analysis
  const financials = useMemo(() => {
    let totalIntakeValue = 0;
    let recoveryValue = 0;
    let rtvValue = 0;
    let ncrCost = 0;

    const costByResponsible: Record<string, number> = {};
    const costBySource: Record<string, number> = {};

    // Calculate from Items (Returns)
    items.forEach(i => {
      const qty = i.quantity || 0;
      const price = i.priceBill || 0;
      totalIntakeValue += price * qty;

      if (i.disposition === 'Restock') recoveryValue += (i.priceSell || 0) * qty;
      if (i.disposition === 'RTV') rtvValue += price * qty;

      if (i.hasCost && i.costAmount) {
        // Track direct costs from items
        const responsible = i.costResponsible || 'Unassigned';
        const source = i.problemSource || 'Other';
        costByResponsible[responsible] = (costByResponsible[responsible] || 0) + i.costAmount;
        costBySource[source] = (costBySource[source] || 0) + i.costAmount;
      }
    });

    // Calculate from NCR Reports
    ncrReports.filter(n => n.status !== 'Canceled').forEach(n => {
      const cost = n.item?.costAmount || (n as any).costAmount || 0;
      ncrCost += cost;

      // Merge NCR costs if not already counted (Assuming NCR reports come from items)
      // Note: If NCR is separate, we add here. 
    });

    // Convert to Chart Data
    const costResponsibleData = Object.entries(costByResponsible)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5

    return { totalIntakeValue, recoveryValue, rtvValue, ncrCost, costResponsibleData };
  }, [items, ncrReports]);

  // 3. Disposition Mix
  const dispositionData = useMemo(() => {
    const counts: Record<string, number> = { Restock: 0, RTV: 0, Recycle: 0, Claim: 0, InternalUse: 0 };
    items.forEach(item => {
      if (item.disposition && item.disposition !== 'Pending' && counts[item.disposition] !== undefined) {
        counts[item.disposition]++;
      }
    });

    return [
      { name: 'ขาย (Restock)', value: counts.Restock, color: COLORS.Restock },
      { name: 'ส่งคืน (RTV)', value: counts.RTV, color: COLORS.RTV },
      { name: 'เคลม (Claim)', value: counts.Claim, color: COLORS.Claim },
      { name: 'ทิ้ง (Scrap)', value: counts.Recycle, color: COLORS.Recycle },
      { name: 'ใช้ภายใน (Internal)', value: counts.InternalUse, color: COLORS.InternalUse },
    ].filter(i => i.value > 0);
  }, [items]);

  // 4. Problem Analysis (Returns)
  const problemAnalysisData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => {
      if (i.problemAnalysis) {
        const key = i.problemAnalysis;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  // 5. NCR Root Cause & Process Stats
  const ncrStats = useMemo(() => {
    const rootCauses: Record<string, number> = {};
    const causes = { Packaging: 0, Transport: 0, Operation: 0, Environment: 0 };

    ncrReports.filter(n => n.status !== 'Canceled').forEach(report => {
      // Root Cause
      let source = report.item?.problemSource || (report as any).problemSource || 'Other';
      rootCauses[source] = (rootCauses[source] || 0) + 1;

      // Process Causes
      if (report.causePackaging) causes.Packaging++;
      if (report.causeTransport) causes.Transport++;
      if (report.causeOperation) causes.Operation++;
      if (report.causeEnv) causes.Environment++;
    });

    const rootCauseData = Object.entries(rootCauses)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const causeData = [
      { name: 'Packaging', value: causes.Packaging },
      { name: 'Transport', value: causes.Transport },
      { name: 'Operation', value: causes.Operation },
      { name: 'Environment', value: causes.Environment },
    ].filter(i => i.value > 0);

    return { rootCauseData, causeData };
  }, [ncrReports]);

  return (
    <div className="p-6 space-y-8 animate-fade-in pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">สรุปผลการปฏิบัติงาน (Operation Performance)</h2>
          <p className="text-slate-500 text-sm">ติดตามสถานะงานคงค้าง (WIP), ประสิทธิภาพทางการเงิน และวิเคราะห์ปัญหา (Root Cause)</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-sm font-bold text-blue-700">Realtime Accuracy 100%</span>
        </div>
      </div>

      {/* 1. PIPELINE FLOW */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> สถานะงานคงค้าง (Work in Progress Pipeline)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <PipelineCard step="1" title="แจ้งคืน (Request)" count={pipeline.requested} icon={FileText} color="bg-slate-100 text-slate-600" desc="รอรับเข้า" />
          <PipelineCard step="2" title="รับสินค้า (Intake)" count={pipeline.received} icon={Package} color="bg-amber-50 text-amber-600 border-amber-200" desc="รอ QC" isAlert={pipeline.received > 20} />
          <PipelineCard step="3" title="ตรวจสอบ (QC)" count={pipeline.graded} icon={Activity} color="bg-blue-50 text-blue-600 border-blue-200" desc="รอเอกสาร" />
          <PipelineCard step="4" title="เอกสาร (Docs)" count={pipeline.documented} icon={FileText} color="bg-purple-50 text-purple-600 border-purple-200" desc="รอปิดงาน" />
          <PipelineCard step="5" title="จบงาน (Done)" count={pipeline.completed} icon={CheckCircle} color="bg-green-50 text-green-600 border-green-200" desc="สำเร็จ" />
        </div>
      </div>

      {/* 2. FINANCIAL PERFORMANCE */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> ประสิทธิภาพทางการเงิน (Financial Impact)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Intake" value={`฿${financials.totalIntakeValue.toLocaleString()}`} subText="มูลค่ารับเข้าทั้งระบบ" icon={Package} color="bg-slate-700" />
          <StatCard title="Recovery Value" value={`฿${financials.recoveryValue.toLocaleString()}`} subText="รายได้จากการขายคืน (Restock)" icon={TrendingUp} color="bg-green-600" />
          <StatCard title="RTV Credit" value={`฿${financials.rtvValue.toLocaleString()}`} subText="เครดิตจากการส่งคืน (RTV)" icon={Truck} color="bg-amber-500" />
          <StatCard title="Cost Impact" value={`฿${financials.ncrCost.toLocaleString()}`} subText="มูลค่าความเสียหาย (NCR & Costs)" icon={AlertOctagon} color="bg-red-500" isAlert />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 3. PROBLEM ANALYSIS (By Dept) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              วิเคราะห์ปัญหา (Problem Analysis)
            </h3>
            <p className="text-xs text-slate-500">จำแนกตามหน่วยงานที่รับผิดชอบ (จาก Return)</p>
          </div>
          <div className="flex-1 min-h-[200px]">
            {problemAnalysisData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={problemAnalysisData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">ไม่มีข้อมูลปัญหา</div>
            )}
          </div>
        </div>

        {/* 4. DISPOSITION MIX */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              การตัดสินใจ (Disposition Mix)
            </h3>
            <p className="text-xs text-slate-500">สัดส่วนการจัดการสินค้า</p>
          </div>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dispositionData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {dispositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. COST TRACKING (By Responsible) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              ค่าใช้จ่าย (Cost Tracking)
            </h3>
            <p className="text-xs text-slate-500">Top 5 ผู้รับผิดชอบความเสียหาย (บาท)</p>
          </div>
          <div className="flex-1 min-h-[200px]">
            {financials.costResponsibleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financials.costResponsibleData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: number) => `฿${val.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">ไม่มีข้อมูลค่าใช้จ่าย</div>
            )}
          </div>
        </div>

      </div>

      {/* 6. NCR ROOT CAUSE & PROCESS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-purple-600" />
            สาเหตุและการป้องกัน (NCR Root Cause & Prevention)
          </h3>
          <p className="text-xs text-slate-500">วิเคราะห์สาเหตุเชิงลึกจากระบบ NCR</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Root Cause Bar Chart */}
          <div className="h-[250px]">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Problem Source Breakdown</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ncrStats.rootCauseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Process Cause Area Chart */}
          <div className="h-[250px]">
            <h4 className="text-sm font-bold text-slate-700 mb-2">Process Issues (Causes)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ncrStats.causeData} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {ncrStats.causeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DANGER ZONE - Factory Reset */}
      <div className="border border-red-200 bg-red-50 rounded-lg p-6 flex flex-col items-center mt-12 mb-8 opacity-50 hover:opacity-100 transition-opacity">
        <h3 className="text-red-700 font-bold text-lg mb-2 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> DATA FACTORY RESET
        </h3>
        <button
          onClick={async () => {
            if (confirm("คำเตือน: คุณต้องการลบข้อมูลทั้งหมดใช่หรือไม่?")) {
              const code = prompt("ใส่รหัสผ่าน (1234):");
              if (code === '1234') {
                await remove(ref(db, 'return_records'));
                await remove(ref(db, 'ncr_reports'));
                await set(ref(db, 'ncr_counter'), 0);
                location.reload();
              }
            }
          }}
          className="text-red-600 underline text-xs cursor-pointer hover:text-red-800"
        >
          ล้างข้อมูลตัวอย่างทั้งหมด
        </button>
      </div>

    </div >
  );
};

// Component: Pipeline Card
const PipelineCard = ({ step, title, count, icon: Icon, color, desc, isAlert }: any) => (
  <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${color} ${isAlert ? 'ring-2 ring-red-400 bg-red-50' : ''}`}>
    <div className="text-[10px] font-bold opacity-60 uppercase mb-1">Step {step}</div>
    <div className="mb-2 p-2 bg-white bg-opacity-50 rounded-full">
      <Icon className="w-5 h-5" />
    </div>
    <div className={`text-2xl font-bold mb-1 ${isAlert ? 'text-red-600' : ''}`}>{count}</div>
    <div className="text-xs font-bold truncate w-full">{title}</div>
    <div className="text-[10px] opacity-70 mt-1">{desc}</div>
  </div>
);

// Component: Stat Card
const StatCard = ({ title, value, subText, icon: Icon, color, isAlert }: any) => (
  <div className={`bg-white rounded-xl shadow-sm border p-5 flex items-start justify-between transition-transform hover:-translate-y-1 duration-200 ${isAlert ? 'border-red-200 bg-red-50/10' : 'border-slate-100'}`}>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
      <h3 className={`text-2xl font-bold mb-1 ${isAlert ? 'text-red-600' : 'text-slate-800'}`}>{value}</h3>
      <p className="text-xs text-slate-400">{subText}</p>
    </div>
    <div className={`p-3 rounded-lg shadow-sm ${color} text-white`}>
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

export default Dashboard;
