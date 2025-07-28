'use client'

import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { useCreatePurchaseMutation, useGetPurchasesQuery, useGetPurchasesStatsQuery } from '@/lib/store/api/pharmacyApi'
import { addNotification, openModal, closeModal } from '@/lib/store/slices/uiSlice'

export default function PurchaseEntry() {
    const dispatch = useAppDispatch()
    const isModalOpen = useAppSelector((state) => state.ui.modals.purchaseEntry)

    // RTK Query hooks
    const { data: purchases } = useGetPurchasesQuery({ page: 1, limit: 10 })
    const { data: purchasesStats, isLoading: statsLoading } = useGetPurchasesStatsQuery()
    const [createPurchase, { isLoading: isCreating }] = useCreatePurchaseMutation()

    const [formData, setFormData] = useState({
        supplier_name: '',
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        items: [{
            item_name: '',
            pack: '',
            qty: '',
            expiry: '',
            batch: '',
            mrp: '',
            rate: '',
            amount: ''
        }]
    })

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                item_name: '',
                pack: '',
                qty: '',
                expiry: '',
                batch: '',
                mrp: '',
                rate: '',
                amount: ''
            }]
        })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index)
        setFormData({ ...formData, items: newItems })
    }

    const handleItemChange = (index: number, field: string, value: string) => {
        const newItems = [...formData.items]
        newItems[index] = { ...newItems[index], [field]: value }

        // Auto-calculate amount if qty and rate are provided
        if (field === 'qty' || field === 'rate') {
            const qty = parseFloat(newItems[index].qty) || 0
            const rate = parseFloat(newItems[index].rate) || 0
            newItems[index].amount = (qty * rate).toFixed(2)
        }

        setFormData({ ...formData, items: newItems })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Transform form data to API format
            const purchaseData = {
                supplier_name: formData.supplier_name,
                invoice_number: formData.invoice_number,
                date: formData.date,
                items: formData.items.map(item => ({
                    medicine_name: item.item_name,
                    pack: item.pack || undefined,
                    quantity: parseInt(item.qty),
                    expiry_date: item.expiry,
                    batch_number: item.batch || undefined,
                    mrp: item.mrp ? parseFloat(item.mrp) : undefined,
                    rate: parseFloat(item.rate),
                    amount: parseFloat(item.amount)
                }))
            }

            console.log('📤 Sending purchase data:', purchaseData)

            await createPurchase(purchaseData).unwrap()

            // Show success notification
            dispatch(addNotification({
                type: 'success',
                title: 'Purchase Saved',
                message: `Purchase from ${formData.supplier_name} saved successfully!`
            }))

            // Close modal and reset form
            dispatch(closeModal('purchaseEntry'))
            setFormData({
                supplier_name: '',
                invoice_number: '',
                date: new Date().toISOString().split('T')[0],
                items: [{
                    item_name: '',
                    pack: '',
                    qty: '',
                    expiry: '',
                    batch: '',
                    mrp: '',
                    rate: '',
                    amount: ''
                }]
            })
        } catch (error) {
            dispatch(addNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to save purchase. Please try again.'
            }))
        }
    }

    const getTotalAmount = () => {
        return formData.items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0).toFixed(2)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Purchase Entry</h1>
                    <p className="text-gray-600">Record daily medicine purchases from wholesalers</p>
                </div>
                <button
                    onClick={() => dispatch(openModal('purchaseEntry'))}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    + Add Purchase
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        ) : (
                            `₹${(purchasesStats?.todaysPurchases || 0).toLocaleString('en-IN')}`
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Today&apos;s Purchases</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">
                        {statsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        ) : (
                            `₹${(purchasesStats?.thisMonth || 0).toLocaleString('en-IN')}`
                        )}
                    </div>
                    <div className="text-sm text-gray-600">This Month</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {statsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                            purchasesStats?.totalEntries || 0
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">
                        {statsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                        ) : (
                            purchasesStats?.differentSuppliers || 0
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Different Suppliers</div>
                </div>
            </div>

            {/* Recent Purchases */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases (Last 10)</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Medicine Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Supplier</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rate</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">MRP</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Purchase Date</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                            </tr>
                        </thead>
                        <tbody className="space-y-2">
                            {statsLoading ? (
                                // Loading skeleton
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr key={index} className="border-t border-gray-200">
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div></td>
                                        <td className="px-4 py-2"><div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div></td>
                                    </tr>
                                ))
                            ) : purchasesStats?.recentPurchases && purchasesStats.recentPurchases.length > 0 ? (
                                // Show only the last 10 purchases (API already limits to 10, but being explicit)
                                purchasesStats.recentPurchases.slice(0, 10).map((purchase: any) => (
                                    <tr key={purchase.id} className="border-t border-gray-200 hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {purchase.medicine_name}
                                            {purchase.items_count > 1 && (
                                                <span className="text-xs text-gray-500 ml-1">
                                                    (+{purchase.items_count - 1} more)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{purchase.supplier}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{purchase.quantity}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">₹{purchase.rate.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">₹{purchase.mrp.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">
                                            {new Date(purchase.purchase_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900">₹{purchase.total.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="border-t border-gray-200">
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No recent purchases found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Purchase Entry Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Add Purchase Entry</h2>
                            <button
                                onClick={() => dispatch(closeModal('purchaseEntry'))}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <form onSubmit={handleSubmit} className="p-6">
                            {/* Supplier & Invoice Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.supplier_name}
                                        onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                                        className="w-full text-black px-3 py-2 border color-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter supplier name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.invoice_number}
                                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                                        className="w-full  text-black  px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter invoice number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Items Section */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">Medicine Items</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                {/* Items Table */}
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pack</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MRP</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={item.item_name}
                                                            onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Medicine name"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.pack}
                                                            onChange={(e) => handleItemChange(index, 'pack', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="10x10"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            required
                                                            value={item.qty}
                                                            onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="month"
                                                            required
                                                            value={item.expiry}
                                                            onChange={(e) => handleItemChange(index, 'expiry', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            title="Expiry month (automatically converts to last day of month)"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.batch}
                                                            onChange={(e) => handleItemChange(index, 'batch', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="Batch no"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.mrp}
                                                            onChange={(e) => handleItemChange(index, 'mrp', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={item.rate}
                                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.amount}
                                                            readOnly
                                                            className="w-full text-black px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {formData.items.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(index)}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Total Amount */}
                                <div className="mt-4 flex justify-end">
                                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                                        <span className="text-sm font-medium text-blue-800">
                                            Total Amount: ₹{getTotalAmount()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => dispatch(closeModal('purchaseEntry'))}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isCreating ? 'Saving...' : 'Save Purchase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
} 