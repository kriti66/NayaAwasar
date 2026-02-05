import React from 'react';
import { Edit2, CheckCircle, X, Plus } from 'lucide-react';

const ProfileSectionCard = ({
    title,
    subtitle,
    icon: Icon,
    children,
    onEdit,
    isEditing,
    onSave,
    onCancel,
    onAdd,
    addLabel
}) => {
    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="px-8 py-6 flex justify-between items-center border-b border-gray-50 bg-white">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className="w-12 h-12 rounded-[1rem] bg-gray-50 text-[#2D9B82] flex items-center justify-center border border-gray-100/50">
                            <Icon size={22} />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none mb-1.5">{title}</h2>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            {subtitle || 'Last updated 2 days ago'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onCancel}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <X size={14} />
                                <span>Cancel</span>
                            </button>
                            <button
                                onClick={onSave}
                                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#2D9B82] text-white text-xs font-bold rounded-xl hover:bg-[#25836d] transition-all shadow-lg shadow-[#2D9B82]/10"
                            >
                                <CheckCircle size={14} />
                                <span>Save</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {onAdd && (
                                <button
                                    onClick={onAdd}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F0FDF4] text-[#2D9B82] text-xs font-bold rounded-xl hover:bg-[#DCFCE7] transition-all border border-[#2D9B82]/10"
                                >
                                    <Plus size={14} />
                                    <span>{addLabel || 'Add'}</span>
                                </button>
                            )}
                            <button
                                onClick={onEdit}
                                className="flex items-center justify-center w-10 h-10 bg-white border border-gray-100 text-gray-400 hover:text-[#2D9B82] hover:border-[#2D9B82]/20 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-8">
                {children}
            </div>
        </div>
    );
};

export default ProfileSectionCard;
