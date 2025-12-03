
import React, { useMemo } from 'react';
import { useData } from '../DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Activity, Truck, CheckCircle, FileText, Package, AlertOctagon, DollarSign } from 'lucide-react';

const COLORS = { Restock: '#22c55e', RTV: '#f59e0b', Recycle: '#ef4444', Claim: '#3b82f6', InternalUse: '#a855f7', Pending: '#94a3b8' };

const Dashboard: React.FC = () => {
  const { items, ncrReports } = useData();

  const pipeline = useMemo(() => ({
    requested: items.filter(i => i.status === 'Requested').length,
    received: items.filter(i => i.status === 'Received').length,
    graded: items.filter(i => i.status === 'Graded').length,
    documented: items.filter(i => i.status === 'Documented').length,
    completed: items.filter(i => i.status === 'Completed').length
  }), [items]);

  const financials = useMemo(() => ({
    totalIntakeValue: items.reduce((acc, i) => acc + i.amount, 0),
    recoveryValue: items.filter(i => i.disposition === 'Restock').reduce((acc, i) => acc + (i.priceSell || 0) * i.quantity, 0),
    rtvValue: items.filter(i => i.disposition === 'RTV').reduce((acc, i) => acc + i.amount, 0),
    ncrCost: ncrReports.reduce((acc, n) => acc + (n.item.costAmount || 0), 0),
  }), [items, ncrReports]);

  const dispositionData = useMemo(() => {
    const counts: Record<string, number> = { Restock: 0, RTV: 0, Recycle: 0, Claim: 0, InternalUse: 0 };
    items.forEach(item => { if (item.disposition && item.disposition !== 'Pending') { counts[item.disposition]++; } });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: (COLORS as any)[name] })).filter(i => i.value > 0);
  }, [items]);

  const ncrSourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    ncrReports.forEach(report => {
      let source = report.item.problemSource || 'ไม่ระบุ';
      if (source.includes('ขนส่ง')) source = 'ขนส่ง'; else if (source.includes('คลัง')) source = 'คลังสินค้า';
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).sort((a, b) => b.value - a.value);
  }, [ncrReports]);

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">สรุปผลการปฏิบัติงาน</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <PipelineCard step="1" title="แจ้งคืน" count={pipeline.requested} icon={FileText} color="bg-slate-100" />
        <PipelineCard step="2" title="รับสินค้า" count={pipeline.received} icon={Package} color="bg-amber-100" />
        <PipelineCard step="3" title="ตรวจสอบ" count={pipeline.graded} icon={Activity} color="bg-blue-100" />
        <PipelineCard step="4" title="เอกสาร" count={pipeline.documented} icon={FileText} color="bg-purple-100" />
        <PipelineCard step="5" title="จบงาน" count={pipeline.completed} icon={CheckCircle} color="bg-green-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="มูลค่ารับเข้า" value={`฿${financials.totalIntakeValue.toLocaleString()}`} icon={Package} color="bg-slate-700" />
        <StatCard title="มูลค่ากู้คืน" value={`฿${financials.recoveryValue.toLocaleString()}`} icon={TrendingUp} color="bg-green-600" />
        <StatCard title="มูลค่าคืนเครดิต (RTV)" value={`฿${financials.rtvValue.toLocaleString()}`} icon={Truck} color="bg-amber-500" />
        <StatCard title="ต้นทุน NCR" value={`฿${financials.ncrCost.toLocaleString()}`} icon={AlertOctagon} color="bg-red-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold">การตัดสินใจ (Disposition Mix)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart><Pie data={dispositionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dispositionData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}</Pie><Tooltip/><Legend/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-bold">วิเคราะห์สาเหตุปัญหา (NCR Root Cause)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ncrSourceData} layout="vertical"><CartesianGrid/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={100}/><Tooltip/><Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>{ncrSourceData.map((e, i) => <Cell key={`cell-${i}`} fill={i === 0 ? '#ef4444' : '#64748b'} />)}</Bar></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const PipelineCard = ({ step, title, count, icon: Icon, color }: any) => (<div className={`p-4 rounded-xl border ${color}`}><div className="text-xs">Step {step}</div><Icon size={20} className="my-2"/><div className="text-2xl font-bold">{count}</div><div>{title}</div></div>);
const StatCard = ({ title, value, icon: Icon, color }: any) => (<div className="bg-white rounded-xl shadow-sm border p-5 flex justify-between"><div className="space-y-1"><p className="text-sm font-bold">{title}</p><h3 className="text-2xl font-bold">{value}</h3></div><div className={`p-3 rounded-lg ${color} text-white`}><Icon/></div></div>);

export default Dashboard;
