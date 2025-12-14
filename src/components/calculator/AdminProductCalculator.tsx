"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Check, PenTool } from "lucide-react"
import { toast } from "sonner"
import { RosterEditor } from "./RosterEditor"
import { Save, Send, FileText } from "lucide-react"

export interface CalculatorOutput {
    totalPrice: number
    quantity: number
    specs: any
    breakdown: string
}

interface AdminProductCalculatorProps {
    product: any
    initialValues?: any
    onChange: (output: CalculatorOutput) => void
    onSave?: () => void
    onShare?: () => void
    isSaving?: boolean
    canShare?: boolean
    hideFooter?: boolean
}

export function AdminProductCalculator({ product, initialValues, onChange, onSave, onShare, isSaving, canShare = true, hideFooter = false }: AdminProductCalculatorProps) {
    const CardFooter = require("@/components/ui/card").CardFooter;

    // --- Dynamic Options (Safe Fallbacks) ---
    const sizes = useMemo(() => {
        const base = [...(product?.sizes || [])];
        if (product?.allowCustomSize) {
            if (!base.find((s: any) => s.id === 'custom')) {
                base.push({ id: 'custom', label: 'Custom Size', priceAdjustment: 0 });
            }
        }
        return base;
    }, [product]);

    const materials = product?.materials || [];
    const finishings = product?.finishings || [];
    const printSides = product?.printSides || [];
    const durations = product?.durations || [];
    const quantities = product?.quantities || []; // Quantity Tier Options
    const customSections = product?.customSections || [];

    // --- State ---
    const [size, setSize] = useState("");
    const [material, setMaterial] = useState("");
    const [finishing, setFinishing] = useState("");
    const [printSide, setPrintSide] = useState("");
    const [duration, setDuration] = useState("");

    const [quantityMode, setQuantityMode] = useState<'single' | 'breakdown'>('single');
    const [quantity, setQuantity] = useState(100);
    const [quantityBreakdown, setQuantityBreakdown] = useState<Record<string, number>>({});

    const [customSelections, setCustomSelections] = useState<Record<string, string | string[]>>({});
    const [personalizationInputs, setPersonalizationInputs] = useState<Record<string, string>>({});

    const [customWidth, setCustomWidth] = useState(100);
    const [customHeight, setCustomHeight] = useState(100);
    const [customUnit, setCustomUnit] = useState<"mm" | "cm" | "inch" | "ft">("mm");

    const [variationMode, setVariationMode] = useState(false);
    const [variationRows, setVariationRows] = useState<Array<{
        id: string;
        size: string;
        qty: number;
        selections: Record<string, string>;
    }>>([
        { id: '1', size: '', qty: 0, selections: {} }
    ]);

    const [isRosterOpen, setIsRosterOpen] = useState(false);
    const [activeRosterRowId, setActiveRosterRowId] = useState<string | null>(null);
    const [rosterData, setRosterData] = useState<Record<string, any[]>>({});

    // --- Initialization ---
    useEffect(() => {
        if (!product) return;

        // Use initialValues if provided, otherwise defaults
        if (initialValues) {
            if (initialValues.size) setSize(initialValues.size);
            if (initialValues.material) setMaterial(initialValues.material);
            if (initialValues.finishing) setFinishing(initialValues.finishing);
            if (initialValues.printSide) setPrintSide(initialValues.printSide);
            if (initialValues.duration) setDuration(initialValues.duration);

            if (initialValues.quantityMode) setQuantityMode(initialValues.quantityMode);
            if (initialValues.quantity) setQuantity(initialValues.quantity); // derived from total quantity usually, but specs has it?
            // Actually specs usually has quantityBreakdown or totalQuantity. 
            // In 'single' mode, totalQuantity is valid.

            if (initialValues.quantityBreakdown) setQuantityBreakdown(initialValues.quantityBreakdown);

            if (initialValues.customSelections) setCustomSelections(initialValues.customSelections);
            if (initialValues.personalizationInputs) setPersonalizationInputs(initialValues.personalizationInputs);

            if (initialValues.customDimensions) {
                setCustomWidth(initialValues.customDimensions.width || 100);
                setCustomHeight(initialValues.customDimensions.height || 100);
                setCustomUnit(initialValues.customDimensions.unit || 'mm');
            }

            if (initialValues.variationMode) setVariationMode(initialValues.variationMode);
            if (initialValues.variationRows) setVariationRows(initialValues.variationRows);
            if (initialValues.rosterData) setRosterData(initialValues.rosterData);

        } else {
            // Defaults
            if (sizes.length > 0 && !size) setSize(sizes[0].id);
            if (materials.length > 0 && !material) setMaterial(materials[0].id);
            if (finishings.length > 0 && !finishing) setFinishing(finishings[0].id);
            if (printSides.length > 0 && !printSide) setPrintSide(printSides[0].id);
            if (durations.length > 0 && !duration) setDuration(durations[0].id);

            const initialCustom: Record<string, string | string[]> = {};
            customSections.forEach((section: any) => {
                if (section.options.length > 0 && section.inputType !== 'checkbox') {
                    initialCustom[section.id] = section.options[0].id;
                } else if (section.inputType === 'checkbox') {
                    initialCustom[section.id] = [];
                }
            });
            setCustomSelections(prev => ({ ...initialCustom, ...prev }));
        }
    }, [product, initialValues]);

    // --- Helpers ---
    const handleCustomChange = (sectionId: string, value: string, inputType: 'select' | 'checkbox') => {
        if (inputType === 'select') {
            setCustomSelections(prev => ({ ...prev, [sectionId]: value }));
        } else {
            setCustomSelections(prev => {
                const current = (prev[sectionId] as string[]) || [];
                if (current.includes(value)) {
                    return { ...prev, [sectionId]: current.filter(v => v !== value) };
                } else {
                    return { ...prev, [sectionId]: [...current, value] };
                }
            });
        }
    };

    const handleQuantityMatrixChange = (sizeId: string, qty: number) => {
        setQuantityBreakdown(prev => ({ ...prev, [sizeId]: qty >= 0 ? qty : 0 }));
    };

    const getTotalQuantity = () => {
        if (quantityMode === 'single') return quantity;
        return Object.values(quantityBreakdown).reduce((a, b) => a + b, 0);
    };

    // --- Pricing Engine ---
    const totalPrice = useMemo(() => {
        if (!product) return 0;
        let basePrice = product.price || 0;
        let unitPrice = basePrice;
        const totalQty = getTotalQuantity();

        const selectedMaterial = materials.find((m: any) => m.id === material);
        if (selectedMaterial) unitPrice += (selectedMaterial.priceAdjustment || 0);

        const selectedFinishing = finishings.find((f: any) => f.id === finishing);
        if (selectedFinishing) unitPrice += (selectedFinishing.priceAdjustment || 0);

        const selectedPrintSide = printSides.find((p: any) => p.id === printSide);
        if (selectedPrintSide) unitPrice += (selectedPrintSide.priceAdjustment || 0);

        customSections.forEach((section: any) => {
            const selection = customSelections[section.id];
            if (Array.isArray(selection)) {
                selection.forEach(optId => {
                    const opt = section.options.find((o: any) => o.id === optId);
                    if (opt) unitPrice += (opt.priceAdjustment || 0);
                });
            } else if (selection) {
                const opt = section.options.find((o: any) => o.id === selection);
                if (opt) unitPrice += (opt.priceAdjustment || 0);
            }
        });

        let totalAttributesPrice = 0;

        if (quantityMode === 'breakdown') {
            sizes.forEach((s: any) => {
                const qty = quantityBreakdown[s.id] || 0;
                if (qty > 0) {
                    const sizeAdj = s.priceAdjustment || 0;
                    totalAttributesPrice += (unitPrice + sizeAdj) * qty;
                }
            });
        } else {
            const selectedSize = sizes.find((s: any) => s.id === size);
            let sizeAdj = 0;
            if (selectedSize) {
                if (selectedSize.id === 'custom' && product.allowCustomSize) {
                    if (product.pricingModel === 'sqft') {
                        let areaSqFt = 0;
                        const w = customWidth;
                        const h = customHeight;
                        switch (customUnit) {
                            case 'mm': areaSqFt = (w * h) / 92903; break;
                            case 'cm': areaSqFt = (w * h) / 929.03; break;
                            case 'inch': areaSqFt = (w * h) / 144; break;
                            case 'ft': areaSqFt = (w * h); break;
                            default: areaSqFt = 0;
                        }
                        unitPrice += (product.price * areaSqFt);
                    }
                    sizeAdj = selectedSize.priceAdjustment || 0;
                } else {
                    sizeAdj = selectedSize.priceAdjustment || 0;
                }
            }
            totalAttributesPrice = (unitPrice + sizeAdj) * totalQty;
        }

        if (variationMode) {
            let grandTotal = 0;
            variationRows.forEach(row => {
                if (row.qty <= 0) return;
                let rowUnitPrice = basePrice;
                if (selectedMaterial) rowUnitPrice += (selectedMaterial.priceAdjustment || 0);
                if (selectedFinishing) rowUnitPrice += (selectedFinishing.priceAdjustment || 0);
                if (selectedPrintSide) rowUnitPrice += (selectedPrintSide.priceAdjustment || 0);
                const s = sizes.find((sz: any) => sz.id === row.size);
                if (s) rowUnitPrice += (s.priceAdjustment || 0);
                Object.entries(row.selections).forEach(([secId, optId]) => {
                    const sec = customSections.find((cs: any) => cs.id === secId);
                    if (sec) {
                        const opt = sec.options.find((o: any) => o.id === optId);
                        if (opt) rowUnitPrice += (opt.priceAdjustment || 0);
                    }
                });
                grandTotal += (rowUnitPrice * row.qty);
            });
            return grandTotal;
        }

        let finalTotal = totalAttributesPrice;
        if (totalQty >= 1000) finalTotal *= 0.8;

        return finalTotal;
    }, [size, material, finishing, printSide, duration, quantityMode, quantity, quantityBreakdown, customSelections, customWidth, customHeight, product, sizes, materials, finishings, printSides, durations, customSections, variationMode, variationRows, customUnit]);

    // --- Output Synchronizer ---
    useEffect(() => {
        // Build Specs Object
        const specs = {
            size,
            material,
            finishing,
            printSide,
            duration,
            customSelections,
            quantityMode,
            quantityBreakdown: quantityMode === 'breakdown' ? quantityBreakdown : null,
            customDimensions: size === 'custom' ? { width: customWidth, height: customHeight, unit: customUnit } : null,
            variationMode,
            variationRows: variationMode ? variationRows : null,
            rosterData: Object.keys(rosterData).length > 0 ? rosterData : null,
            personalizationInputs
        };

        // Generate Detailed Summary
        const summaryParts = [];

        // 1. Quantity & Name
        summaryParts.push(`${getTotalQuantity()}x ${product?.name || 'Item'}`);

        // 2. Size
        if (size === 'custom' && product?.allowCustomSize) {
            summaryParts.push(`Custom Size: ${customWidth}x${customHeight} ${customUnit}`);
        } else {
            const sizeObj = sizes.find((s: any) => s.id === size);
            if (sizeObj) summaryParts.push(`Size: ${sizeObj.label}`);
        }

        // 3. Core Options
        const matObj = materials.find((m: any) => m.id === material);
        if (matObj) summaryParts.push(`Material: ${matObj.label}`);

        const printObj = printSides.find((p: any) => p.id === printSide);
        if (printObj) summaryParts.push(`Print: ${printObj.label}`);

        const finObj = finishings.find((f: any) => f.id === finishing);
        if (finObj) summaryParts.push(`Finishing: ${finObj.label}`);

        // 4. Custom Sections
        customSections.forEach((section: any) => {
            const selection = customSelections[section.id];
            if (Array.isArray(selection) && selection.length > 0) {
                const labels = selection.map(id => section.options.find((o: any) => o.id === id)?.label).filter(l => l);
                summaryParts.push(`${section.title}: ${labels.join(', ')}`);
            } else if (typeof selection === 'string' && selection) {
                const opt = section.options.find((o: any) => o.id === selection);
                if (opt) summaryParts.push(`${section.title}: ${opt.label}`);
            }
        });

        // 5. Quantity Breakdown (if applicable)
        if (quantityMode === 'breakdown') {
            const breakdownText = Object.entries(quantityBreakdown)
                .filter(([_, qty]) => qty > 0)
                .map(([sId, qty]) => `${sizes.find((s: any) => s.id === sId)?.label}: ${qty}`)
                .join(', ');
            if (breakdownText) summaryParts.push(`(Qty Breakdown: ${breakdownText})`);
        }

        const summary = summaryParts.join(' | ');

        onChange({
            totalPrice,
            quantity: getTotalQuantity(),
            specs,
            breakdown: summary
        });

    }, [totalPrice, size, material, finishing, printSide, duration, quantityMode, quantity, quantityBreakdown, customSelections, customWidth, customHeight, customUnit, variationMode, variationRows, rosterData, personalizationInputs]);


    // ... (UI RENDER LOGIC - Same as ProductCalculator but simplified) ...
    // Copying the render logic but without footer

    const handleRosterSave = (data: any[]) => {
        if (activeRosterRowId) {
            setRosterData(prev => ({
                ...prev,
                [activeRosterRowId]: data.filter(d => d.name || d.number)
            }));
            const row = variationRows.find(r => r.id === activeRosterRowId);
            if (row) {
                toast.success(`Saved ${data.filter(d => d.name || d.number).length} names for row.`);
            }
        }
    };

    // Helper helpers
    const addVariationRow = () => setVariationRows(prev => [...prev, { id: Math.random().toString(36).substr(2, 5), size: sizes[0]?.id || '', qty: 0, selections: {} }]);
    const removeVariationRow = (id: string) => setVariationRows(prev => prev.filter(r => r.id !== id));
    const updateVariationRow = (id: string, field: 'size' | 'qty' | 'selection', key: string, val: any) => {
        setVariationRows(prev => prev.map(row => {
            if (row.id !== id) return row;
            if (field === 'size') return { ...row, size: val };
            if (field === 'qty') return { ...row, qty: val };
            if (field === 'selection') return { ...row, selections: { ...row.selections, [key]: val } };
            return row;
        }));
    };

    if (!product) return <div>Select a product above</div>

    return (
        <Card className="w-full border shadow-sm">
            <CardHeader className="py-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-sm uppercase text-gray-500">Calculator</CardTitle>
                        <CardDescription className="font-bold text-gray-900">{product?.name}</CardDescription>
                    </div>
                    {sizes.length > 0 && customSections.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="var-mode" className="text-[10px] uppercase text-blue-600 font-bold text-right cursor-pointer">Complex<br />Order?</Label>
                            <Switch id="var-mode" checked={variationMode} onCheckedChange={setVariationMode} />
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {variationMode ? (
                    <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            {(() => {
                                const selectSections = customSections.filter((s: any) => s.inputType === 'select');
                                const colCount = selectSections.length;
                                const gridTemplate = `30px 100px 70px ${colCount > 0 ? `repeat(${colCount}, 1fr) ` : ''}30px`;

                                return (
                                    <>
                                        <div className="grid gap-2 items-center bg-muted/40 p-2 text-[10px] font-bold uppercase text-muted-foreground border-b"
                                            style={{ gridTemplateColumns: gridTemplate }}>
                                            <div>#</div>
                                            <div>Size</div>
                                            <div>Qty</div>
                                            {selectSections.map((s: any) => (
                                                <div key={s.id} className="truncate" title={s.title}>{s.title}</div>
                                            ))}
                                            <div></div>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto">
                                            {variationRows.map((row, index) => (
                                                <div key={row.id} className="grid gap-3 items-center p-3 border-b last:border-0"
                                                    style={{ gridTemplateColumns: gridTemplate }}>
                                                    <div className="text-sm text-gray-500 font-medium text-center">{index + 1}</div>
                                                    <Select value={row.size} onValueChange={(v) => updateVariationRow(row.id, 'size', '', v)}>
                                                        <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{sizes.map((s: any) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                    <Input type="number" className="h-8 text-xs bg-white text-center" value={row.qty || ''} placeholder="0" onChange={(e) => updateVariationRow(row.id, 'qty', '', parseInt(e.target.value) || 0)} />
                                                    {customSections.filter((s: any) => s.inputType === 'select').map((sec: any) => (
                                                        <Select key={sec.id} value={row.selections[sec.id]} onValueChange={(v) => updateVariationRow(row.id, 'selection', sec.id, v)}>
                                                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue placeholder="-" /></SelectTrigger>
                                                            <SelectContent>{sec.options.filter((o: any) => o.id !== 'mixed').map((o: any) => (<SelectItem key={o.id} value={o.id} className="text-xs">{o.label}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                    ))}
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-300 hover:text-red-500" onClick={() => removeVariationRow(row.id)}>x</Button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                        <Button variant="outline" size="sm" onClick={addVariationRow} className="w-full text-xs font-bold border-dashed">+ Add Variation</Button>
                    </div>
                ) : (
                    <>
                        {/* Standard Mode */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Column 1: Core Options */}
                            <div className="space-y-4">
                                {sizes.length > 0 && quantityMode === 'single' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-500">Size</Label>
                                        <Select value={size} onValueChange={setSize}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>{sizes.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {size === 'custom' && (
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                <Input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="h-8 text-xs" placeholder="W" />
                                                <Input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="h-8 text-xs" placeholder="H" />
                                                <Select value={customUnit} onValueChange={(v: any) => setCustomUnit(v)}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="mm">mm</SelectItem><SelectItem value="ft">ft</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {materials.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-500">Material</Label>
                                        <Select value={material} onValueChange={setMaterial}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>{materials.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Column 2: Extras */}
                            <div className="space-y-4">
                                {finishings.length > 0 && (
                                    <div className="space-y-1">
                                        <Label className="text-xs uppercase font-bold text-gray-500">Finishing</Label>
                                        <Select value={finishing} onValueChange={setFinishing}>
                                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                            <SelectContent>{finishings.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <Label className="text-xs uppercase font-bold text-gray-500">Quantity</Label>
                                    <Select value={quantity.toString()} onValueChange={(val) => setQuantity(parseInt(val))}>
                                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {(quantities.length > 0 ? quantities : [{ label: "100" }, { label: "200" }, { label: "500" }, { label: "1000" }]).map((q: any, i: number) => {
                                                const val = parseInt(q.label);
                                                if (isNaN(val)) return null;
                                                return <SelectItem key={i} value={val.toString()}>{val} pcs</SelectItem>
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Total Display */}
                <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <span className="text-sm font-medium text-gray-600">Calculated Price</span>
                    <span className="text-2xl font-bold text-gray-900">RM{totalPrice.toFixed(2)}</span>
                </div>
            </CardContent>

            {!hideFooter && (
                <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 p-4">
                    <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Total Estimate</span>
                        <span className="text-2xl font-bold text-foreground">RM{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            size="default"
                            className="w-full text-sm font-bold h-10 uppercase tracking-wide border-2"
                            onClick={onSave}
                            disabled={isSaving}
                        >
                            {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                        <Button
                            size="default"
                            className="w-full text-sm font-bold h-10 uppercase tracking-wide"
                            onClick={onShare}
                            disabled={!canShare}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Share Quote
                        </Button>
                    </div>
                </CardFooter>
            )
            }

            {/* Roster Modal */}
            <RosterEditor
                isOpen={isRosterOpen}
                onClose={() => setIsRosterOpen(false)}
                title="Roster Details"
                quantity={activeRosterRowId ? (variationRows.find(r => r.id === activeRosterRowId)?.qty || 0) : 0}
                data={activeRosterRowId ? (rosterData[activeRosterRowId] || []) : []}
                onSave={handleRosterSave}
            />
        </Card >
    )
}
