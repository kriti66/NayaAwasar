
import { useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

/**
 * Custom hook to handle job saving logic centrally.
 * @param {Array<string>} initialSavedIds - Array of initially saved job IDs
 * @returns {Object} { savedJobIds, toggleSaveJob, isSaving }
 */
const useJobSaver = (initialSavedIds = []) => {
    const [savedJobIds, setSavedJobIds] = useState(initialSavedIds);
    const [isSaving, setIsSaving] = useState(false);

    const toggleSaveJob = useCallback(async (jobId) => {
        if (isSaving) return;

        const jobIdStr = (jobId?.toString?.() || String(jobId));
        const isSaved = savedJobIds.some(id => (id?.toString?.() || String(id)) === jobIdStr);
        const newSavedIds = isSaved
            ? savedJobIds.filter(id => (id?.toString?.() || String(id)) !== jobIdStr)
            : [...savedJobIds, jobIdStr];

        setSavedJobIds(newSavedIds);
        setIsSaving(true);

        try {
            const res = await api.post(`/jobs/${jobId}/save`);
            const serverSavedIds = res.data?.savedJobs || [];
            if (Array.isArray(serverSavedIds)) {
                setSavedJobIds(serverSavedIds.map(id => (id?.toString?.() || id)));
            }
            if (import.meta.env?.DEV) {
                console.log('[useJobSaver] Toggle OK', { jobId: jobIdStr, saved: res.data?.saved, count: serverSavedIds?.length });
            }
            toast.success(isSaved ? 'Job removed from saved list' : 'Job saved successfully');
        } catch (error) {
            console.error("[useJobSaver] Toggle failed:", error?.message || error);
            setSavedJobIds(isSaved ? [...savedJobIds, jobIdStr] : savedJobIds.filter(id => (id?.toString?.() || String(id)) !== jobIdStr));
            toast.error(error.response?.data?.message || 'Failed to update saved jobs');
        } finally {
            setIsSaving(false);
        }
    }, [savedJobIds, isSaving]);

    return { savedJobIds, setSavedJobIds, toggleSaveJob };
};

export default useJobSaver;
