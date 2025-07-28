'use client'

import { useGetExpiryStatsQuery, useGetExpiryAlertsQuery } from '@/lib/store/api/pharmacyApi'
import { useState, useEffect } from 'react'

export default function ExpiryTracking() {
    // Filter state
    const [filters, setFilters] = useState({
        medicine_name: '',
        batch_number: '',
        supplier_name: '',
        start_date: '',
        end_date: '',
        days: 90
    })

    // Debounced filters state
    const [debouncedFilters, setDebouncedFilters] = useState(filters)

    // RTK Query hooks to fetch expiry data
    const { data: expiryStats, isLoading, error } = useGetExpiryStatsQuery()

    // Build filter parameters for expiry alerts query
    const alertsParams = {
        days: debouncedFilters.days,
        ...(debouncedFilters.medicine_name && { medicine_name: debouncedFilters.medicine_name }),
        ...(debouncedFilters.batch_number && { batch_number: debouncedFilters.batch_number }),
        ...(debouncedFilters.supplier_name && { supplier_name: debouncedFilters.supplier_name }),
        ...(debouncedFilters.start_date && { start_date: debouncedFilters.start_date }),
        ...(debouncedFilters.end_date && { end_date: debouncedFilters.end_date })
    }

    const { data: expiryAlerts = [], isLoading: alertsLoading } = useGetExpiryAlertsQuery(alertsParams)

    // Debounce the filters with 500ms delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters)
        }, 500)

        return () => clearTimeout(timer)
    }, [filters])

    // Helper function to calculate days to expiry
    const getDaysToExpiry = (expiryDate: string) => {
        const today = new Date()
        const expiry = new Date(expiryDate)
        const diffTime = expiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Helper function to get expiry status color
    const getExpiryStatusColor = (days: number) => {
        if (days < 0) return 'red' // Expired
        if (days <= 7) return 'red' // Critical
        if (days <= 30) return 'orange' // Warning
        return 'yellow' // Alert
    }

    // Filter handlers
    const handleFilterChange = (field: string, value: string | number) => {
        setFilters({
            ...filters,
            [field]: value
        })
    }

    const clearFilters = () => {
        setFilters({
            medicine_name: '',
            batch_number: '',
            supplier_name: '',
            start_date: '',
            end_date: '',
            days: 90
        })
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Expiry Tracking</h1>
                    <p className="text-gray-600">Monitor medicine expiry dates and manage expired stock</p>
                </div>
            </div>

            {/* Expiry Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-red-600">
                        {isLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                        ) : (
                            expiryStats?.expiredThisWeek || 0
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Expired This Week</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-orange-600">
                        {isLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                        ) : (
                            expiryStats?.expiringIn30Days || 0
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Expiring in 30 Days</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">
                        {isLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                        ) : (
                            expiryStats?.expiringIn90Days || 0
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Expiring in 90 Days</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {isLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                            `₹${(expiryStats?.valueAtRisk || 0).toLocaleString('en-IN')}`
                        )}
                    </div>
                    <div className="text-sm text-gray-600">Value at Risk</div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Expiry Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name</label>
                        <input
                            type="text"
                            value={filters.medicine_name}
                            onChange={(e) => handleFilterChange('medicine_name', e.target.value)}
                            placeholder="Search by medicine name..."
                            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                        <input
                            type="text"
                            value={filters.batch_number}
                            onChange={(e) => handleFilterChange('batch_number', e.target.value)}
                            placeholder="Search by batch number..."
                            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                        <input
                            type="text"
                            value={filters.supplier_name}
                            onChange={(e) => handleFilterChange('supplier_name', e.target.value)}
                            placeholder="Search by supplier name..."
                            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        {alertsLoading ? 'Searching...' : `Found ${expiryAlerts.length} results`}
                        {(filters.start_date || filters.end_date) && (
                            <span className="ml-2 text-blue-600">
                                • Date range active
                            </span>
                        )}
                    </div>
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Expiry Table */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Expiry Alerts</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Medicine Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Supplier Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Batch Number
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expiry Date
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Days to Expiry
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {alertsLoading ? (
                                // Loading skeleton
                                Array.from({ length: 3 }).map((_, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : expiryAlerts.length > 0 ? (
                                expiryAlerts.map((item, index) => {
                                    const daysToExpiry = getDaysToExpiry(item.expiry_date)
                                    const statusColor = getExpiryStatusColor(daysToExpiry)

                                    return (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.medicine_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.supplier_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.batch_number || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.quantity} units
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(item.expiry_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {daysToExpiry < 0
                                                    ? `Expired ${Math.abs(daysToExpiry)} days ago`
                                                    : daysToExpiry === 0
                                                        ? 'Expires today'
                                                        : `Expires in ${daysToExpiry} days`
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold text-${statusColor}-600 bg-${statusColor}-100`}>
                                                    {statusColor === 'red' ? 'Expired' : statusColor === 'orange' ? 'Critical' : statusColor === 'yellow' ? 'Alert' : 'Normal'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                        No expiry alerts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
} 