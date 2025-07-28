export default function AdminSettings() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pharmacy Settings</h1>
                <p className="text-gray-600">Configure pharmacy preferences and system settings</p>
            </div>

            {/* Settings Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pharmacy Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pharmacy Details</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                            <input
                                type="text"
                                placeholder="ABC Pharmacy"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                            <input
                                type="text"
                                placeholder="PH123456789"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                            <input
                                type="text"
                                placeholder="22AAAAA0000A1Z5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                rows={3}
                                placeholder="Shop address with city and pincode"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                                <div className="text-sm text-gray-600">Enable 2FA for admin accounts</div>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Session Timeout</div>
                                <div className="text-sm text-gray-600">Auto-logout after inactivity</div>
                            </div>
                            <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                                <option>30 minutes</option>
                                <option>1 hour</option>
                                <option>4 hours</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Login Attempts</div>
                                <div className="text-sm text-gray-600">Max failed login attempts</div>
                            </div>
                            <input
                                type="number"
                                value="5"
                                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">Email Notifications</div>
                                <div className="text-sm text-gray-600">System alerts via email</div>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-gray-900">SMS Alerts</div>
                                <div className="text-sm text-gray-600">Critical alerts via SMS</div>
                            </div>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                <input type="checkbox" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="font-medium text-gray-900 mb-2">Backup Schedule</div>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Daily at 2:00 AM</option>
                                <option>Weekly on Sunday</option>
                                <option>Monthly</option>
                            </select>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 mb-2">Data Retention</div>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Keep for 7 years</option>
                                <option>Keep for 5 years</option>
                                <option>Keep indefinitely</option>
                            </select>
                        </div>
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Run Manual Backup
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Save Settings
                </button>
            </div>
        </div>
    )
} 