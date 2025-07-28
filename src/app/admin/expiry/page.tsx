'use client'

import { useGetExpiryStatsQuery, useGetExpiryAlertsQuery } from '@/lib/store/api/pharmacyApi'
import { useState, useMemo } from 'react'

export default function ExpiryTracking() {
    // Filter state
    const [filters, setFilters] = useState({
        medicine_name: '',
        batch_number: '',
        supplier_name: '',
        start_date: '',
        end_date: ''
    })

    // Applied filters state (for actual API calls)
    const [appliedFilters, setAppliedFilters] = useState({
        medicine_name: '',
        batch_number: '',
        supplier_name: '',
        start_date: '',
        end_date: '',
        days: 90 // Default to 90 days on initial load
    })

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // RTK Query hooks to fetch expiry data
    const { data: expiryStats, isLoading, error } = useGetExpiryStatsQuery()

    // Build filter parameters for expiry alerts query
    // Check if any specific filters are applied
    const hasSpecificFilters = !!(
        appliedFilters.medicine_name ||
        appliedFilters.batch_number ||
        appliedFilters.supplier_name ||
        appliedFilters.start_date ||
        appliedFilters.end_date
    )

    // Always include page and limit to ensure RTK Query detects parameter changes
    const alertsParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage
        }

        // Only include days restriction if no other filters are applied (for initial load)
        if (!hasSpecificFilters) {
            params.days = appliedFilters.days
        }

        // Add other filters if they exist
        if (appliedFilters.medicine_name) params.medicine_name = appliedFilters.medicine_name
        if (appliedFilters.batch_number) params.batch_number = appliedFilters.batch_number
        if (appliedFilters.supplier_name) params.supplier_name = appliedFilters.supplier_name
        if (appliedFilters.start_date) params.start_date = appliedFilters.start_date
        if (appliedFilters.end_date) params.end_date = appliedFilters.end_date

        return params
    }, [
        currentPage,
        itemsPerPage,
        hasSpecificFilters,
        appliedFilters.days,
        appliedFilters.medicine_name,
        appliedFilters.batch_number,
        appliedFilters.supplier_name,
        appliedFilters.start_date,
        appliedFilters.end_date
    ])

    const { data: expiryResponse, isLoading: alertsLoading } = useGetExpiryAlertsQuery(alertsParams)

    // Extract data and metadata from response
    const expiryAlerts = expiryResponse?.data || []
    const totalResults = expiryResponse?.total || 0
    const totalPages = expiryResponse?.totalPages || 1
    const totalValueAtRisk = expiryResponse?.totalValueAtRisk || 0

    // Helper function to calculate days to expiry
    const getDaysToExpiry = (expiryDate: string) => {
        const today = new Date()
        const expiry = new Date(expiryDate)
        const diffTime = expiry.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    // Filter handlers
    const handleFilterChange = (field: string, value: string | number) => {
        setFilters({
            ...filters,
            [field]: value
        })
    }

    const handleSubmitFilters = () => {
        setAppliedFilters({
            medicine_name: filters.medicine_name,
            batch_number: filters.batch_number,
            supplier_name: filters.supplier_name,
            start_date: filters.start_date,
            end_date: filters.end_date,
            days: 90 // Keep days for internal logic, but won't be used if other filters are applied
        })
        setCurrentPage(1) // Reset to first page when applying new filters
    }

    const clearFilters = () => {
        const defaultFormFilters = {
            medicine_name: '',
            batch_number: '',
            supplier_name: '',
            start_date: '',
            end_date: ''
        }
        const defaultAppliedFilters = {
            medicine_name: '',
            batch_number: '',
            supplier_name: '',
            start_date: '',
            end_date: '',
            days: 90 // Reset to 90 days for initial load
        }
        setFilters(defaultFormFilters)
        setAppliedFilters(defaultAppliedFilters)
        setCurrentPage(1) // Reset to first page when clearing filters
    }

    // Pagination functions
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1))
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    // Calculate if there are more pages
    const hasNextPage = currentPage < totalPages
    const hasPreviousPage = currentPage > 1

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
                        {alertsLoading ? (
                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                            `₹${totalValueAtRisk.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                        )}
                    </div>
                    <div className="text-sm text-gray-600">
                        Value at Risk
                        {totalResults > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                                All filtered results ({totalResults} items)
                            </div>
                        )}
                    </div>
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
                        {!hasSpecificFilters && (
                            <span className="ml-2 text-blue-600">
                                • Showing next 90 days
                            </span>
                        )}
                        {hasSpecificFilters && (
                            <span className="ml-2 text-green-600">
                                • Searching entire database
                            </span>
                        )}
                        {(appliedFilters.start_date || appliedFilters.end_date) && (
                            <span className="ml-2 text-purple-600">
                                • Custom date range
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmitFilters}
                            className="group relative px-6 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200"
                        >
                            <span className="relative flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                                </svg>
                                Apply Filters
                            </span>
                        </button>
                        <button
                            onClick={clearFilters}
                            className="group relative px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-200 rounded-lg font-medium shadow-md hover:shadow-lg hover:border-red-300 hover:text-red-600 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-100"
                        >
                            <span className="relative flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Clear Filters
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Expiry Table */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">All Expiry Alerts</h3>
                    <div className="text-sm text-gray-600">
                        {!alertsLoading && totalResults > 0 && (
                            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full font-medium shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {totalResults} total result{totalResults !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
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
                                    Rate
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    MRP
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : expiryAlerts.length > 0 ? (
                                expiryAlerts.map((item, index) => {
                                    const daysToExpiry = getDaysToExpiry(item.expiry_date)

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
                                                ₹{item.quantity > 0 ? (item.estimated_loss / item.quantity).toFixed(2) : '0.00'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                ₹{item.mrp?.toFixed(2) || '0.00'}
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                                        No expiry alerts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {(expiryAlerts.length > 0 || currentPage > 1) && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-700">
                            Showing page {currentPage} of {totalPages}
                            <span className="text-gray-500">
                                {expiryAlerts.length > 0 && (
                                    ` (${((currentPage - 1) * itemsPerPage) + 1}-${((currentPage - 1) * itemsPerPage) + expiryAlerts.length} of ${totalResults} items)`
                                )}
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePreviousPage}
                                disabled={!hasPreviousPage}
                                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasPreviousPage
                                    ? 'text-gray-700 bg-white border border-gray-300 shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:border-blue-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-100'
                                    : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed opacity-60'
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Previous
                                </span>
                            </button>

                            <div className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg">
                                Page {currentPage}
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={!hasNextPage}
                                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasNextPage
                                    ? 'text-gray-700 bg-white border border-gray-300 shadow-md hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-gray-50 hover:border-blue-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-100'
                                    : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed opacity-60'
                                    }`}
                            >
                                <span className="flex items-center gap-1">
                                    Next
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 