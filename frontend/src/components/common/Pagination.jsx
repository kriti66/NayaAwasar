import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // simplified max items logic

        if (totalPages <= 7) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Logic for middle pages
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if near start
            if (currentPage <= 3) {
                end = 4;
            }

            // Adjust if near end
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 pt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#29a08e] hover:border-[#29a08e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((page, index) => (
                page === '...' ? (
                    <span key={`dots-${index}`} className="w-8 h-8 flex items-center justify-center text-gray-400">
                        <MoreHorizontal size={16} />
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                ? 'bg-[#29a08e] text-white shadow-md shadow-[#29a08e]/20 scale-110'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-[#29a08e] hover:text-[#29a08e]'
                            }`}
                    >
                        {page}
                    </button>
                )
            ))}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#29a08e] hover:border-[#29a08e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};

export default Pagination;
