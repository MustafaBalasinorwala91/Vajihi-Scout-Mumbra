import api from './api';

export interface FeeRecord {
    fee_id: string;
    user_id: string;
    month: string;
    amount: number;
    status: 'paid' | 'due';
    paid_date?: string;
    updated_by?: string;
}

export interface FeeStats {
    totalPaid: number;
    totalDue: number;
    paidMembers: number;
    dueMembers: number;
    totalMembers: number;
    collectionRate: number;
    thisMonthDue: number;
}

export const feeService = {

    // GET ALL FEES
    async getAllFees(): Promise<FeeRecord[]> {
        const response = await api.get('/fees/all', {
            withCredentials: true,
        });

        return response.data;
    },

    // GET MY FEES
    async getMyFees() {
        const response = await api.get('/fees/my', {
            withCredentials: true,
        });

        return response.data;
    },

    // CREATE OR UPDATE FEE
    async updateFee(data: {
        user_id: string;
        month: string;
        amount: number;
        status: string;
        paid_date?: string | null;
    }) {

        const response = await api.post('/fees', data, {
            withCredentials: true,
        });

        return response.data;
    },

    // DELETE FEE
    async deleteFee(feeId: string) {

        const response = await api.delete(`/ fees / ${feeId} `, {
            withCredentials: true,
        });

        return response.data;
    },

    // GENERATE MONTHLY FEES
    async generateMonthlyFees(month: string, amount: number) {

        const response = await api.post(
            `/ admin / generate - fees / ${month}?amount = ${amount} `,
            {},
            {
                withCredentials: true,
            }
        );

        return response.data;
    },

    // CALCULATE DASHBOARD STATS
    calculateStats(fees: FeeRecord[]): FeeStats {

        const totalPaid = fees
            .filter((f) => f.status === 'paid')
            .reduce((sum, fee) => sum + fee.amount, 0);

        const totalDue = fees
            .filter((f) => f.status === 'due')
            .reduce((sum, fee) => sum + fee.amount, 0);

        const paidMembers = new Set(
            fees
                .filter((f) => f.status === 'paid')
                .map((f) => f.user_id)
        ).size;

        const dueMembers = new Set(
            fees
                .filter((f) => f.status === 'due')
                .map((f) => f.user_id)
        ).size;

        const totalMembers = new Set(
            fees.map((f) => f.user_id)
        ).size;

        const collectionRate =
            totalPaid + totalDue > 0
                ? (totalPaid / (totalPaid + totalDue)) * 100
                : 0;

        const currentMonth = new Date().toISOString().slice(0, 7);

        const thisMonthDue = fees
            .filter(
                (f) =>
                    f.month === currentMonth &&
                    f.status === 'due'
            )
            .reduce((sum, fee) => sum + fee.amount, 0);

        return {
            totalPaid,
            totalDue,
            paidMembers,
            dueMembers,
            totalMembers,
            collectionRate,
            thisMonthDue,
        };
    },
};
