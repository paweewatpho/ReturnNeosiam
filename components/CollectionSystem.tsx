
import React, { useState, useMemo } from 'react';
import {
    Truck, CheckCircle2, Clock, MapPin, Package, FileText,
    ArrowRight, Plus, Search, User, Phone, X, Save,
    Camera, PenTool, Printer, Boxes, Ship, LayoutGrid, List
} from 'lucide-react';
import { CollectionOrder, ReturnRequest, ShipmentManifest, CollectionStatus } from '../types';
import { mockCollectionOrders, mockReturnRequests, mockDrivers, mockShipments } from '../data/mockCollectionData';

// --- SUB-COMPONENTS ---

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'APPROVED_FOR_PICKUP': 'bg-green-100 text-green-800 border-green-200',
        'PICKUP_SCHEDULED': 'bg-blue-100 text-blue-800 border-blue-200',
        'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'ASSIGNED': 'bg-blue-100 text-blue-800 border-blue-200',
        'COLLECTED': 'bg-purple-100 text-purple-800 border-purple-200',
        'CONSOLIDATED': 'bg-slate-100 text-slate-800 border-slate-200',
        'IN_TRANSIT': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'ARRIVED_HQ': 'bg-green-100 text-green-800 border-green-200',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
};

// --- MAIN COMPONENT ---

const CollectionSystem: React.FC = () => {
    // Data State
    const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(mockReturnRequests);
    const [collectionOrders, setCollectionOrders] = useState<CollectionOrder[]>(mockCollectionOrders);
    const [shipments, setShipments] = useState<ShipmentManifest[]>(mockShipments);

    // View State
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1); // 1: Dispatch, 2: Driver, 3: Consolidation
    const [selectedRmas, setSelectedRmas] = useState<string[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showManifestModal, setShowManifestModal] = useState(false);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

    // Form State (Create Collection)
    const [formDriverId, setFormDriverId] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formBoxes, setFormBoxes] = useState(1);
    const [formDesc, setFormDesc] = useState('');

    // Form State (Create Manifest)
    const [formCarrier, setFormCarrier] = useState('');
    const [formTracking, setFormTracking] = useState('');

    // --- ACTIONS ---

    const handleCreateCollection = () => {
        if (!formDriverId || selectedRmas.length === 0) return;

        // Group selected RMAs (Assuming they are from same location for this MVP, or logic to group)
        // For simplicity, we create one collection order for the selected RMAs.
        // In real world, we might validate same address.

        // Find first RMA to get location info
        const firstRma = returnRequests.find(r => r.id === selectedRmas[0]);
        if (!firstRma) return;

        const newOrder: CollectionOrder = {
            id: `COL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(collectionOrders.length + 1).padStart(3, '0')}`,
            driverId: formDriverId,
            linkedRmaIds: selectedRmas,
            pickupLocation: {
                name: firstRma.customerName,
                address: firstRma.customerAddress,
                contactName: firstRma.contactPerson,
                contactPhone: firstRma.contactPhone
            },
            pickupDate: formDate,
            packageSummary: {
                totalBoxes: formBoxes,
                description: formDesc || 'General Goods'
            },
            status: 'PENDING',
            vehiclePlate: mockDrivers.find(d => d.id === formDriverId)?.plate,
            createdDate: new Date().toISOString()
        };

        setCollectionOrders([newOrder, ...collectionOrders]);

        // Update RMAs status
        setReturnRequests(prev => prev.map(r => selectedRmas.includes(r.id) ? { ...r, status: 'PICKUP_SCHEDULED' } : r));

        // Reset
        setSelectedRmas([]);
        setShowCreateModal(false);
        setFormBoxes(1);
        setFormDesc('');
    };

    const handleCreateManifest = () => {
        if (!formCarrier || selectedCollectionIds.length === 0) return;

        const newManifest: ShipmentManifest = {
            id: `SHP-${new Date().getFullYear()}-${String(shipments.length + 1).padStart(3, '0')}`,
            collectionOrderIds: selectedCollectionIds,
            transportMethod: '3PL_COURIER', // Default
            carrierName: formCarrier,
            trackingNumber: formTracking || '-',
            status: 'IN_TRANSIT',
            createdDate: new Date().toISOString()
        };

        setShipments([newManifest, ...shipments]);

        // Update Collection Orders status
        setCollectionOrders(prev => prev.map(c => selectedCollectionIds.includes(c.id) ? { ...c, status: 'CONSOLIDATED' } : c));

        setSelectedCollectionIds([]);
        setShowManifestModal(false);
        setFormCarrier('');
        setFormTracking('');
    };

    const handleDriverAction = (orderId: string, action: 'COLLECT') => {
        if (action === 'COLLECT') {
            if (confirm('Driver: Confirm collection of goods? (Photo/Signature simulated)')) {
                setCollectionOrders(prev => prev.map(o => o.id === orderId ? {
                    ...o,
                    status: 'COLLECTED',
                    proofOfCollection: {
                        timestamp: new Date().toISOString(),
                        signatureUrl: 'signed_mock',
                        photoUrls: ['mock_photo_url']
                    }
                } : o));
            }
        }
    };

    // --- RENDERERS ---

    // 1. DISPATCHER VIEW
    const renderDispatchView = () => {
        const pendingRmas = returnRequests.filter(r => r.status === 'APPROVED_FOR_PICKUP');

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">1. Pending Pickups (Source: Approved RMAs)</h3>
                            <p className="text-sm text-slate-500">Commercial Requests waiting for Logistics assignment.</p>
                        </div>
                        {selectedRmas.length > 0 && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 animate-bounce-short"
                            >
                                <Truck className="w-5 h-5" /> Dispatch {selectedRmas.length} Requests
                            </button>
                        )}
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-3 w-10"><input type="checkbox" disabled /></th>
                                <th className="p-3">RMA ID</th>
                                <th className="p-3">Customer / Location</th>
                                <th className="p-3">Items Summary</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingRmas.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic">No approved RMAs pending pickup.</td></tr>
                            ) : pendingRmas.map(rma => (
                                <tr key={rma.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                                    setSelectedRmas(prev => prev.includes(rma.id) ? prev.filter(id => id !== rma.id) : [...prev, rma.id]);
                                }}>
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedRmas.includes(rma.id)}
                                            onChange={() => { }}
                                            className="accent-blue-600 w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-3 font-mono text-sm font-bold text-blue-600">{rma.id}</td>
                                    <td className="p-3 text-sm">
                                        <div className="font-bold text-slate-700">{rma.customerName}</div>
                                        <div className="text-xs text-slate-500">{rma.customerAddress}</div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-600">{rma.itemsSummary}</td>
                                    <td className="p-3 text-right"><StatusBadge status={rma.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // 2. DRIVER VIEW
    const renderDriverView = () => {
        // Show PENDING or ASSIGNED orders
        const myTasks = collectionOrders.filter(o => o.status === 'PENDING' || o.status === 'ASSIGNED');

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Truck className="w-5 h-5" /> Driver Task List
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTasks.map(order => (
                        <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                <span className="font-mono font-bold text-slate-700">{order.id}</span>
                                <StatusBadge status={order.status} />
                            </div>
                            <div className="p-4 flex-grow space-y-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                                    <div>
                                        <div className="font-bold text-slate-800">{order.pickupLocation.name}</div>
                                        <div className="text-sm text-slate-500">{order.pickupLocation.address}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-blue-500 shrink-0" />
                                    <div className="text-sm">
                                        <span className="font-bold">{order.pickupLocation.contactName}</span>
                                        <span className="text-slate-400 mx-1">|</span>
                                        <a href={`tel:${order.pickupLocation.contactPhone}`} className="text-blue-600 underline">{order.pickupLocation.contactPhone}</a>
                                    </div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded border border-amber-100 flex items-center gap-3">
                                    <Package className="w-8 h-8 text-amber-600" />
                                    <div>
                                        <div className="font-bold text-slate-800">{order.packageSummary.totalBoxes} Packages</div>
                                        <div className="text-xs text-slate-500">{order.packageSummary.description}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50">
                                <button
                                    onClick={() => handleDriverAction(order.id, 'COLLECT')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Camera className="w-4 h-4" /> Confirm Collection
                                </button>
                            </div>
                        </div>
                    ))}
                    {myTasks.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No active tasks assigned.</div>}
                </div>
            </div>
        );
    };

    // 3. CONSOLIDATION VIEW
    const renderConsolidationView = () => {
        const collectedOrders = collectionOrders.filter(o => o.status === 'COLLECTED');

        return (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">3. Hub Consolidation</h3>
                            <p className="text-sm text-slate-500">Items collected by drivers, waiting to be shipped to HQ.</p>
                        </div>
                        {selectedCollectionIds.length > 0 && (
                            <button
                                onClick={() => setShowManifestModal(true)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 animate-bounce-short"
                            >
                                <Ship className="w-5 h-5" /> Create Manifest ({selectedCollectionIds.length})
                            </button>
                        )}
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-3 w-10"><input type="checkbox" disabled /></th>
                                <th className="p-3">Collection ID</th>
                                <th className="p-3">Pickup Location</th>
                                <th className="p-3">Driver</th>
                                <th className="p-3 text-center">Boxes</th>
                                <th className="p-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {collectedOrders.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No collected items at Hub.</td></tr>
                            ) : collectedOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                                    setSelectedCollectionIds(prev => prev.includes(order.id) ? prev.filter(id => id !== order.id) : [...prev, order.id]);
                                }}>
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCollectionIds.includes(order.id)}
                                            onChange={() => { }}
                                            className="accent-purple-600 w-4 h-4"
                                        />
                                    </td>
                                    <td className="p-3 font-mono text-sm font-bold text-purple-600">{order.id}</td>
                                    <td className="p-3 text-sm">
                                        <div className="font-bold text-slate-700">{order.pickupLocation.name}</div>
                                    </td>
                                    <td className="p-3 text-sm">
                                        {mockDrivers.find(d => d.id === order.driverId)?.name.split('(')[0]}
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-800">{order.packageSummary.totalBoxes}</td>
                                    <td className="p-3 text-right"><StatusBadge status={order.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-700 mb-4">Recent Shipments (Manifests)</h4>
                    <div className="grid gap-4">
                        {shipments.map(shipment => (
                            <div key={shipment.id} className="bg-slate-50 p-4 rounded border border-slate-200 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-slate-800">{shipment.id}</div>
                                    <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                        <span>Via: {shipment.carrierName}</span>
                                        <span>Track: {shipment.trackingNumber}</span>
                                        <span>Count: {shipment.collectionOrderIds.length} Orders</span>
                                    </div>
                                </div>
                                <StatusBadge status={shipment.status} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50/50">
            {/* STEP NAVIGATION */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-800">Inbound Logistics</h2>
                    <span className="text-xs text-slate-400 font-mono">Module: LOG-INBOUND-01</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentStep(1)} className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all ${currentStep === 1 ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        1. Dispatch (RMA)
                    </button>
                    <button onClick={() => setCurrentStep(2)} className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all ${currentStep === 2 ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        2. Driver Collection
                    </button>
                    <button onClick={() => setCurrentStep(3)} className={`flex-1 py-3 px-4 rounded-lg border text-sm font-bold transition-all ${currentStep === 3 ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        3. Consolidation
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-grow p-6 overflow-y-auto">
                {currentStep === 1 && renderDispatchView()}
                {currentStep === 2 && renderDriverView()}
                {currentStep === 3 && renderConsolidationView()}
            </div>

            {/* MODALS */}

            {/* Create Collection Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Truck className="w-6 h-6 text-blue-600" /> Create Collection Order</h3>
                        <p className="text-sm text-slate-500 mb-6">Grouping {selectedRmas.length} RMAs for pickup.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Driver</label>
                                <select className="w-full p-2 border border-slate-300 rounded-lg" value={formDriverId} onChange={e => setFormDriverId(e.target.value)}>
                                    <option value="">-- Select Driver --</option>
                                    {mockDrivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.plate})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Date</label>
                                <input type="date" className="w-full p-2 border border-slate-300 rounded-lg" value={formDate} onChange={e => setFormDate(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Boxes (Est.)</label>
                                    <input type="number" min="1" className="w-full p-2 border border-slate-300 rounded-lg" value={formBoxes} onChange={e => setFormBoxes(parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="e.g. Computer Parts" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleCreateCollection} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Confirm Dispatch</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Manifest Modal */}
            {showManifestModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Ship className="w-6 h-6 text-purple-600" /> Create Shipment Manifest</h3>
                        <p className="text-sm text-slate-500 mb-6">Consolidating {selectedCollectionIds.length} collections to HQ.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Carrier / Transport Provider</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="e.g. Kerry Express, Private Truck" value={formCarrier} onChange={e => setFormCarrier(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Number</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg" placeholder="Optional" value={formTracking} onChange={e => setFormTracking(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowManifestModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleCreateManifest} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700">Generate Manifest</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CollectionSystem;
