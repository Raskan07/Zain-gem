import React, { useRef } from 'react'
import { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Edit, Eye, Trash2, Calendar, Weight, User, CircleDollarSign } from 'lucide-react';
import gsap from 'gsap';

type Remainder = {
    id: string | number;
    stoneName: string;
    stoneWeight: number;
    sellingPrice: number;
    paymentReceivingDate: Date | string;
    status: 'pending' | 'paid' | 'overdue';
    buyerType: 'local' | 'chinese';
    receiptImage?: string;
};

type CustomCradProps = {
    remainder: Remainder;
    // use the onX names that your page passes
    onDetail?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onArchive?: () => void;
    onViewReceipt?: () => void;
    getStatusBadge: (status: Remainder['status']) => ReactNode;
    calculateDaysRemaining: (date: Date | string) => number;
};

function CustomCard({
    remainder,
    onDetail,
    onEdit,
    onDelete,
    onArchive,
    onViewReceipt,
    getStatusBadge,
    calculateDaysRemaining,
}: CustomCradProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        gsap.to(cardRef.current, {
            scale: 1.02,
            duration: 0.4,
            ease: "power2.out",
            borderColor: "rgba(59, 130, 246, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px -20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)"
        });
    };

    const handleMouseLeave = () => {
        gsap.to(cardRef.current, {
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
            borderColor: "rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            boxShadow: "none"
        });
    };

    // Defensive guard: if remainder is missing, render a lightweight placeholder
    if (!remainder) {
        return (
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-white/40 italic">
                Missing remainder data
            </div>
        );
    }

    const daysLeft = calculateDaysRemaining(remainder.paymentReceivingDate);
    const isOverdue = daysLeft < 0;

    return (
        <div
            ref={cardRef}
            className="group p-6 backdrop-blur-md bg-white/5 rounded-3xl border border-white/10 transition-all cursor-pointer relative overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
                if (onDetail) onDetail();
            }}
        >
            {/* Background Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-colors" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col gap-1">
                    <h3 className="font-extrabold text-white text-xl tracking-tight leading-tight group-hover:text-blue-200 transition-colors">
                        {remainder.stoneName}
                    </h3>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {remainder.buyerType === "local" ? "Local Buyer" : "Chinese Buyer"}
                    </span>
                </div>
                {getStatusBadge(remainder.status)}
            </div>

            <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Weight className="h-3 w-3" /> Weight
                        </span>
                        <p className="text-white font-bold">{remainder.stoneWeight}<span className="text-xs font-normal ml-0.5 opacity-60">crt</span></p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <CircleDollarSign className="h-3 w-3" /> Price
                        </span>
                        <p className="text-white font-bold"><span className="text-xs font-normal mr-0.5 opacity-60">LKR</span>{remainder.sellingPrice.toLocaleString()}</p>
                    </div>
                </div>

                <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                    isOverdue ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-white">Payment Status</p>
                            <p className={`font-bold text-sm ${isOverdue ? 'text-red-400' : 'text-green-400'}`}>
                                {(() => {
                                    if (daysLeft < 0) return `${Math.abs(daysLeft)} days Overdue`;
                                    if (daysLeft === 0) return "Due Today";
                                    return `${daysLeft} days Remaining`;
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-5 border-t border-white/5 relative z-10">
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) onEdit();
                        }}
                        className="text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onDelete) onDelete();
                        }}
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="flex gap-2">
                    {remainder.receiptImage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onViewReceipt) onViewReceipt();
                            }}
                            className="text-green-400 hover:bg-green-500/10 rounded-xl transition-all"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onArchive) onArchive();
                        }}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20 font-bold text-xs px-4 rounded-xl transition-all"
                    >
                        Paid
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CustomCard