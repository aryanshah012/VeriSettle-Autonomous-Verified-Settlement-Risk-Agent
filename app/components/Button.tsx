"use client";

import React from "react";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "primary" | "secondary" | "tab" | "danger" | "ghost";
    active?: boolean;
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
}

export const PrimaryButton = ({
    children,
    onClick,
    disabled = false,
    className = "",
    type = "button",
}: ButtonProps) => (
    <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            disabled
                ? "bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
        } ${className}`}
    >
        {children}
    </button>
);

export const SecondaryButton = ({
    children,
    onClick,
    disabled = false,
    prefix,
    className = "",
    type = "button",
}: ButtonProps & { prefix?: React.ReactNode }) => (
    <button
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
            disabled
                ? "bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed"
                : "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/80 hover:border-slate-600 hover:text-white shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        } ${className}`}
    >
        {prefix && <span>{prefix}</span>}
        {children}
    </button>
);

export const TabButton = ({
    active,
    children,
    onClick,
    className = "",
}: ButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-medium text-xs tracking-wide transition-all duration-150 ${
            active
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10"
                : "bg-slate-800/40 text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/70"
        } ${className}`}
    >
        {children}
    </button>
);