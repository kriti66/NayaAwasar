
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

        // Optimistic update
        const isSaved = savedJobIds.includes(jobId);
        const newSavedIds = isSaved
            ? savedJobIds.filter(id => id !== jobId)
            : [...savedJobIds, jobId];

        setSavedJobIds(newSavedIds);
        setIsSaving(true);

        try {
            await api.post(`/jobs/${jobId}/save`);
            toast.success(isSaved ? 'Job removed from saved list' : 'Job saved successfully');
        } catch (error) {
            console.error("Failed to save job", error);
            // Revert on error
            setSavedJobIds(isSaved ? [...savedJobIds, jobId] : savedJobIds.filter(id => id !== jobId));
            toast.error(error.response?.data?.message || 'Failed to update saved jobs');
        } finally {
            setIsSaving(false);
        }
    }, [savedJobIds, isSaving]);

    return { savedJobIds, setSavedJobIds, toggleSaveJob };
};

export default useJobSaver;
