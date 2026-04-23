import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const Select = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("select", { ref: ref, className: `flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`, ...props })));
Select.displayName = 'Select';
