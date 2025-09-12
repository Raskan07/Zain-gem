import React from 'react'
import { ReactNode } from 'react';
import { Button } from '../ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';

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
    // Defensive guard: if remainder is missing, render a lightweight placeholder
    if (!remainder) {
        return (
            <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-white/60">
                Missing remainder
            </div>
        );
    }

    return (
        <div
            key={remainder.id}
            className="p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            onClick={() => {
                if (onDetail) onDetail();
            }}
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-white text-lg">{remainder.stoneName}</h3>
                {getStatusBadge(remainder.status)}
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-white/60">Weight:</span>
                    <span className="text-white font-medium">{remainder.stoneWeight}crt</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/60">Selling Price:</span>
                    <span className="text-white font-medium">LKR {remainder.sellingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/60">Days Left:</span>
                    <span className={`font-bold ${calculateDaysRemaining(remainder.paymentReceivingDate) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {(() => {
                            const daysLeft = calculateDaysRemaining(remainder.paymentReceivingDate);
                            if (daysLeft < 0) {
                                return `${Math.abs(daysLeft)}d overdue`;
                            } else if (daysLeft === 0) {
                                return "Due today";
                            } else {
                                return `${daysLeft}d left`;
                            }
                        })()}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/60">Buyer:</span>
                    <span className="text-white font-medium">{remainder.buyerType === "local" ? "Local" : "Chinese"}</span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                <div className="flex space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onEdit) onEdit();
                        }}
                        className="text-blue-400 hover:text-blue-300 h-8 px-2"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onDelete) onDelete();
                        }}
                        className="text-red-400 hover:text-red-300 h-8 px-2"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>

                    {/* Payment Received button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onArchive) onArchive();
                        }}
                        className="text-green-400 hover:text-green-300 h-8 px-2"
                        title="Mark payment received and archive"
                    >
                        Payment Received
                    </Button>
                </div>
                {remainder.receiptImage && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onViewReceipt) onViewReceipt();
                        }}
                        className="text-green-400 hover:text-green-300 h-8 px-2"
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
}

export default CustomCard