import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const Card = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("div", { ref: ref, className: `rounded-lg border border-gray-200 bg-white shadow-sm ${className}`, ...props })));
Card.displayName = 'Card';
export const CardHeader = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("div", { ref: ref, className: `border-b border-gray-200 px-6 py-4 ${className}`, ...props })));
CardHeader.displayName = 'CardHeader';
export const CardContent = React.forwardRef(({ className = '', ...props }, ref) => (_jsx("div", { ref: ref, className: `px-6 py-4 ${className}`, ...props })));
CardContent.displayName = 'CardContent';
