import { jsx as _jsx } from "react/jsx-runtime";
import { Star } from 'lucide-react';
export function RatingStars({ rating, onRate, size = 'md', readonly = false, }) {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };
    return (_jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4, 5].map((star) => (_jsx("button", { onClick: () => !readonly && onRate?.(star), disabled: readonly, className: `${sizeClass[size]} transition-colors ${star <= Math.round(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'} ${!readonly && 'cursor-pointer hover:text-yellow-300'}`, children: _jsx(Star, { size: 24 }) }, star))) }));
}
