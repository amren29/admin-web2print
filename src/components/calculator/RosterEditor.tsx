"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check, Upload, FileText, User, Hash } from "lucide-react";

interface RosterItem {
    name?: string;
    number?: string;
    notes?: string;
}

interface RosterEditorProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    quantity: number;
    data: RosterItem[];
    onSave: (data: RosterItem[]) => void;
}

export function RosterEditor({ isOpen, onClose, title, quantity, data, onSave }: RosterEditorProps) {
    const [items, setItems] = useState<RosterItem[]>([]);
    const [mode, setMode] = useState<'list' | 'upload'>('list');

    // Initialize items based on quantity
    useEffect(() => {
        if (isOpen) {
            const initial: RosterItem[] = [];
            for (let i = 0; i < quantity; i++) {
                initial.push(data[i] || { name: "", number: "" });
            }
            setItems(initial);
        }
    }, [isOpen, quantity, data]);

    const handleChange = (index: number, field: keyof RosterItem, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSave = () => {
        onSave(items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-20">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <div>
                        <h3 className="font-bold text-lg">{title}</h3>
                        <p className="text-xs text-muted-foreground">Please provide details for {quantity} items.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
                </div>

                {/* Tabs / Mode Switch */}
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${mode === 'list' ? 'border-b-2 border-primary text-primary bg-blue-50/50' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setMode('list')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileText size={14} /> Enter Details
                        </div>
                    </button>
                    <button
                        className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${mode === 'upload' ? 'border-b-2 border-primary text-primary bg-blue-50/50' : 'text-muted-foreground hover:bg-muted/50'}`}
                        onClick={() => setMode('upload')}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Upload size={14} /> Upload File
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {mode === 'list' ? (
                        <div className="space-y-2">
                            {/* Header Label */}
                            <div className="grid grid-cols-[30px_1fr_80px] gap-2 px-2 text-[10px] uppercase font-bold text-muted-foreground mb-1">
                                <div>#</div>
                                <div>Name</div>
                                <div>Number</div>
                            </div>

                            {items.map((item, i) => (
                                <div key={i} className="grid grid-cols-[30px_1fr_80px] gap-2 items-center">
                                    <div className="text-xs text-gray-400 font-medium text-center">{i + 1}</div>
                                    <div className="relative">
                                        <User size={12} className="absolute left-2 top-2.5 text-muted-foreground opacity-50" />
                                        <Input
                                            placeholder="Name"
                                            className="h-8 text-sm pl-7 bg-white"
                                            value={item.name}
                                            onChange={(e) => handleChange(i, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Hash size={12} className="absolute left-2 top-2.5 text-muted-foreground opacity-50" />
                                        <Input
                                            placeholder="No."
                                            className="h-8 text-sm pl-6 bg-white"
                                            value={item.number}
                                            onChange={(e) => handleChange(i, 'number', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 space-y-4 text-center">
                            <div className="p-4 bg-blue-50 rounded-full text-blue-500">
                                <Upload size={32} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-sm">Upload Name List</h4>
                                <p className="text-xs text-muted-foreground px-4">
                                    If you have a long list, you can upload an Excel or CSV file here. Ensure columns are labeled "Name" and "Number".
                                </p>
                            </div>
                            <Button variant="outline" className="h-8 text-xs">Choose File</Button>
                            <p className="text-[10px] text-muted-foreground italic">File uploads are simulated in this demo.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} className="gap-2">
                        <Check size={14} /> Save Details
                    </Button>
                </div>
            </div>
        </div>
    );
}
