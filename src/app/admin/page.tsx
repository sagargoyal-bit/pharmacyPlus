'use client'

import { useGetDashboardStatsQuery } from '@/lib/store/api/pharmacyApi'

export default function AdminDashboard() {
    // Fetch dashboard data using RTK Query
    const { data: dashboardData, isLoading, error } = useGetDashboardStatsQuery()

    // Fallback stats for when API is not connected
    const fallbackStats = [
        {
            title: 'Total Medicines',
            value: '2,456',
            change: '+15%',
            trend: 'up',
            icon: '💊'
        },
        {
            title: 'Today&apos;s Purchases',
            value: '₹8,540',
            change: '+8%',
            trend: 'up',
            icon: '🛒'
        },
        {
            title: 'Expiring Soon',
            value: '23',
            change: '-5%',
            trend: 'down',
            icon: '⏰'
        },
        {
            title: 'Stock Value',
            value: '₹2.4L',
            change: '+12%',
            trend: 'up',
            icon: '💰'
        }
    ]

    const fallbackActivity = [
        { id: 1, action: 'Paracetamol 500mg purchased (100 units)', time: '2 minutes ago', type: 'purchase' },
        { id: 2, action: 'Crocin stock updated', time: '15 minutes ago', type: 'inventory' },
        { id: 3, action: 'Expiry alert: Amoxicillin expires in 7 days', time: '30 minutes ago', type: 'expiry' },
        { id: 4, action: 'Daily backup completed', time: '1 hour ago', type: 'system' },
        { id: 5, action: 'Azithromycin purchased from MedPlus', time: '2 hours ago', type: 'purchase' }
    ]

    // Use API data if available, otherwise use fallback data
    const stats = dashboardData ? [
        {
            title: 'Total Medicines',
            value: dashboardData.total_medicines.toString(),
            change: '+15%',
            trend: 'up' as const,
            icon: '💊'
        },
        {
            title: 'Today&apos;s Purchases',
            value: `₹${dashboardData.todays_purchases.toLocaleString()}`,
            change: '+8%',
            trend: 'up' as const,
            icon: '🛒'
        },
        {
            title: 'Expiring Soon',
            value: dashboardData.expiring_soon.toString(),
            change: '-5%',
            trend: 'down' as const,
            icon: '⏰'
        },
        {
            title: 'Stock Value',
            value: `₹${(dashboardData.stock_value / 100000).toFixed(1)}L`,
            change: '+12%',
            trend: 'up' as const,
            icon: '💰'
        }
    ] : fallbackStats

    const recentActivity = dashboardData?.recent_activity || fallbackActivity

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                    <p className="text-gray-600">Loading dashboard data...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                    <p className="text-gray-600">Using demo data (API not connected)</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here&apos;s your pharmacy stock overview and recent activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className="text-2xl">{stat.icon}</div>
                        </div>
                        <div className="mt-4">
                            <span className={`inline-flex items-center text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {stat.trend === 'up' ? '↗' : '↘'} {stat.change}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">from last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                                <div className={`w-2 h-2 rounded-full ${activity.type === 'purchase' ? 'bg-blue-500' :
                                    activity.type === 'inventory' ? 'bg-green-500' :
                                        activity.type === 'expiry' ? 'bg-red-500' :
                                            'bg-purple-500'
                                    }`} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all activity →
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">🛒</div>
                            <div className="text-sm font-medium text-gray-900">Add Purchase</div>
                            <div className="text-xs text-gray-500">Record new medicine purchase</div>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">📦</div>
                            <div className="text-sm font-medium text-gray-900">Check Stock</div>
                            <div className="text-xs text-gray-500">View inventory levels</div>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">⏰</div>
                            <div className="text-sm font-medium text-gray-900">Expiry Alerts</div>
                            <div className="text-xs text-gray-500">Check expiring medicines</div>
                        </button>
                        <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                            <div className="text-2xl mb-2">⚙️</div>
                            <div className="text-sm font-medium text-gray-900">Settings</div>
                            <div className="text-xs text-gray-500">Configure pharmacy</div>
                        </button>
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-green-900">Database</div>
                            <div className="text-xs text-green-600">Online</div>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-green-900">API Services</div>
                            <div className="text-xs text-green-600">Operational</div>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div>
                            <div className="text-sm font-medium text-yellow-900">Backup</div>
                            <div className="text-xs text-yellow-600">In Progress</div>
                        </div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    )
} 