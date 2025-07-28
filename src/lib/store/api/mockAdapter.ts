// Mock adapter for development/testing
import { CreatePurchaseRequest, PurchaseResponse, InventoryItem, ExpiryAlert } from './pharmacyApi'

const mockPurchases: PurchaseResponse[] = [
    {
        id: '1',
        medicine_id: '1',
        supplier_name: 'MedPlus Wholesale',
        quantity: 100,
        rate_per_unit: 8.50,
        total_amount: 850.00,
        batch_number: 'PAR001',
        expiry_date: '2025-12-31',
        purchase_date: '2024-01-15',
        created_at: '2024-01-15T10:30:00Z',
        items: [
            {
                id: '1',
                purchase_id: '1',
                medicine_name: 'Paracetamol 500mg',
                pack: '10x10',
                quantity: 100,
                expiry_date: '2025-12-31',
                batch_number: 'PAR001',
                mrp: 10.50,
                rate: 8.50,
                amount: 850.00
            }
        ]
    }
]

export const mockApi = {
    // Simulate API delay
    delay: (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms)),

    async getPurchases() {
        await this.delay()
        return mockPurchases
    },

    async createPurchase(data: CreatePurchaseRequest): Promise<PurchaseResponse> {
        await this.delay()

        const newPurchase: PurchaseResponse = {
            id: Date.now().toString(),
            medicine_id: '1', // This would be resolved from medicine name in real app
            supplier_name: data.supplier_name,
            quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
            rate_per_unit: data.items[0]?.rate || 0,
            total_amount: data.items.reduce((sum, item) => sum + item.amount, 0),
            batch_number: data.items[0]?.batch_number,
            expiry_date: data.items[0]?.expiry_date || '',
            purchase_date: data.purchase_date,
            created_at: new Date().toISOString(),
            items: data.items.map((item, index) => ({
                id: (Date.now() + index).toString(),
                purchase_id: Date.now().toString(),
                medicine_name: item.medicine_name,
                pack: item.pack,
                quantity: item.quantity,
                expiry_date: item.expiry_date,
                batch_number: item.batch_number,
                mrp: item.mrp,
                rate: item.rate,
                amount: item.amount
            }))
        }

        mockPurchases.push(newPurchase)
        return newPurchase
    },

    async getDashboardStats() {
        await this.delay()
        return {
            total_medicines: 2456,
            todays_purchases: 8540,
            expiring_soon: 23,
            stock_value: 240000,
            recent_activity: [
                {
                    id: '1',
                    action: 'Paracetamol 500mg purchased (100 units)',
                    time: '2 minutes ago',
                    type: 'purchase'
                },
                {
                    id: '2',
                    action: 'Crocin stock updated',
                    time: '15 minutes ago',
                    type: 'inventory'
                },
                {
                    id: '3',
                    action: 'Expiry alert: Amoxicillin expires in 7 days',
                    time: '30 minutes ago',
                    type: 'expiry'
                }
            ]
        }
    },

    async getInventory(): Promise<InventoryItem[]> {
        await this.delay()
        return [
            {
                medicine_name: 'Paracetamol 500mg',
                total_quantity: 500,
                current_stock: 450,
                expiring_soon: 0,
                total_value: 4250,
                last_purchase_date: '2024-01-15'
            },
            {
                medicine_name: 'Crocin 650mg',
                total_quantity: 200,
                current_stock: 25,
                expiring_soon: 25,
                total_value: 637.50,
                last_purchase_date: '2024-01-10'
            }
        ]
    },

    async getExpiryAlerts(): Promise<ExpiryAlert[]> {
        await this.delay()
        return [
            {
                medicine_name: 'Amoxicillin 250mg',
                batch_number: 'AMX001',
                quantity: 15,
                expiry_date: '2024-02-01',
                days_to_expiry: 7,
                estimated_loss: 450
            },
            {
                medicine_name: 'Crocin 650mg',
                batch_number: 'CRC024',
                quantity: 8,
                expiry_date: '2024-02-15',
                days_to_expiry: 21,
                estimated_loss: 102
            }
        ]
    }
} 