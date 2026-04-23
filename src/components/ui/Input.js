import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const Input = React.forwardRef(({ className = '', type, ...props }, ref) => {
    return (_jsx("input", { type: type, className: `flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`, ref: ref, ...props }));
});
Input.displayName = 'Input';
