"use client";

import { CreditCard, DollarSign, Download, Filter } from "lucide-react";

export default function DonationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Financial Ledger</h2>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
                        <Download className="h-4 w-4" /> Export
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                        <DollarSign className="h-4 w-4" /> Record Donation
                    </button>
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-gray-950 dark:border-gray-800">
                <div className="p-4 border-b flex items-center gap-4 bg-gray-50 dark:bg-gray-900">
                    <div className="relative flex-1">
                        <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Filter by Name, Type or Date..."
                            className="w-full pl-9 rounded-md border-gray-200 text-sm focus:border-black focus:ring-black"
                        />
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Donor</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium">Amount</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        <tr>
                            <td className="px-6 py-4">Oct 24, 2025</td>
                            <td className="px-6 py-4 font-medium">Brother Ahmed Ali</td>
                            <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Sadaqah</span></td>
                            <td className="px-6 py-4">$150.00</td>
                            <td className="px-6 py-4 text-green-600 font-medium">Completed</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">Oct 23, 2025</td>
                            <td className="px-6 py-4 font-medium">Anonymous</td>
                            <td className="px-6 py-4"><span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Zakat</span></td>
                            <td className="px-6 py-4">$500.00</td>
                            <td className="px-6 py-4 text-green-600 font-medium">Completed</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4">Oct 20, 2025</td>
                            <td className="px-6 py-4 font-medium">Jumuah Collection</td>
                            <td className="px-6 py-4"><span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">General</span></td>
                            <td className="px-6 py-4">$1,240.50</td>
                            <td className="px-6 py-4 text-green-600 font-medium">Verified</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
