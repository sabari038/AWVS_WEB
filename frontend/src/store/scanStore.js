import { create } from 'zustand';
import api from '../services/api';

const useScanStore = create((set, get) => ({
    activeScan: null,
    scans: [],
    logs: [],
    progress: 0,
    isPolling: false,

    fetchScans: async () => {
        try {
            const res = await api.get('/scans');
            set({ scans: res.data.scans });
        } catch (e) { console.error('Failed to fetch scans', e); }
    },

    startScan: async (name, target, type) => {
        try {
            const res = await api.post('/scans/start', { name, target, type });
            set({ activeScan: res.data.id, isPolling: true, progress: 0, logs: [] });
            get().pollScanStatus(res.data.id);
            return res.data.id;
        } catch (e) {
            console.error('Start scan failed', e);
            throw e;
        }
    },

    pollScanStatus: async (scanId) => {
        if (!get().isPolling) return;

        try {
            const [statusRes, logsRes] = await Promise.all([
                api.get(`/scans/${scanId}/status`),
                api.get(`/scans/${scanId}/logs`)
            ]);

            set({ progress: statusRes.data.progress, logs: logsRes.data.logs });

            if (statusRes.data.status === 'complete' || statusRes.data.status === 'cancelled') {
                set({ isPolling: false });
                get().fetchScans();
            } else {
                setTimeout(() => get().pollScanStatus(scanId), 2000);
            }
        } catch (e) {
            console.error('Polling failed', e);
            set({ isPolling: false });
        }
    },

    cancelScan: async (scanId) => {
        try {
            await api.delete(`/scans/${scanId}`);
            set({ isPolling: false });
        } catch (e) { console.error('Cancel failed', e); }
    }
}));

export default useScanStore;
