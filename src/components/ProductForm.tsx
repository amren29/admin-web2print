"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X, ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PricingOption {
    id: string;
    label: string;
    priceAdjustment: number;
    width?: number;
    height?: number;
    image?: string | null;
    requiresInput?: boolean; // New: If true, user must provide text/file
}

interface CustomSection {
    id: string;
    title: string;
    inputType: 'select' | 'checkbox'; // New: Single or Multi select
    options: PricingOption[];
}

interface ProductFormProps {
    initialData?: any; // strict type would be better in real app
    isEditing?: boolean;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
    // General Info State
    const [productName, setProductName] = useState(initialData?.name || "");
    const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [basePrice, setBasePrice] = useState(initialData?.price || 0);
    const [stock, setStock] = useState(initialData?.stock || 0);
    const [pricingModel, setPricingModel] = useState(initialData?.pricingModel || "fixed"); // fixed | sqft
    const [allowCustomSize, setAllowCustomSize] = useState(initialData?.allowCustomSize || false);
    const [measurementUnit, setMeasurementUnit] = useState(initialData?.measurementUnit || "mm");
    const [tags, setTags] = useState<string[]>(
        Array.isArray(initialData?.tags)
            ? initialData.tags
            : (initialData?.tags ? initialData.tags.split(',').map((t: string) => t.trim()) : [])
    );
    const [currentTag, setCurrentTag] = useState("");
    const [images, setImages] = useState<string[]>(initialData?.images || []);

    // Pricing Engine State
    const [sizes, setSizes] = useState<PricingOption[]>(
        initialData?.sizes || [{ id: "1", label: "", priceAdjustment: 0 }]
    );
    const [materials, setMaterials] = useState<PricingOption[]>(
        initialData?.materials || [{ id: "1", label: "", priceAdjustment: 0 }]
    );
    const [finishings, setFinishings] = useState<PricingOption[]>(
        initialData?.finishings || [{ id: "1", label: "", priceAdjustment: 0 }]
    );
    const [durations, setDurations] = useState<PricingOption[]>(
        initialData?.durations || [{ id: "1", label: "", priceAdjustment: 0 }]
    );
    const [quantities, setQuantities] = useState<PricingOption[]>(
        initialData?.quantities || [{ id: "1", label: "", priceAdjustment: 0 }]
    );

    const [department, setDepartment] = useState(initialData?.department || "standard"); // New Department State
    // Custom Options State
    const [customSections, setCustomSections] = useState<CustomSection[]>(
        initialData?.customSections || []
    );
    const [newSectionName, setNewSectionName] = useState("");
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [printSides, setPrintSides] = useState<PricingOption[]>(
        initialData?.printSides || [{ id: "1", label: "", priceAdjustment: 0 }]
    );

    // Helpers
    const addOption = (setter: React.Dispatch<React.SetStateAction<PricingOption[]>>) => {
        setter((prev) => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), label: "", priceAdjustment: 0 },
        ]);
    };

    const removeOption = (
        setter: React.Dispatch<React.SetStateAction<PricingOption[]>>,
        id: string
    ) => {
        setter((prev) => prev.filter((item) => item.id !== id));
    };

    const updateOption = (
        setter: React.Dispatch<React.SetStateAction<PricingOption[]>>,
        id: string,
        field: keyof PricingOption,
        value: string | number | boolean | null
    ) => {
        setter((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    // Custom Section Helpers
    const addCustomSection = () => {
        if (!newSectionName.trim()) return;
        setCustomSections(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                title: newSectionName,
                inputType: 'select',
                options: [{ id: Math.random().toString(36).substr(2, 9), label: "", priceAdjustment: 0, requiresInput: false }]
            }
        ]);
        setNewSectionName("");
        setIsAddingSection(false);
    };

    const removeCustomSection = (sectionId: string) => {
        setCustomSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const addCustomOption = (sectionId: string) => {
        setCustomSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    options: [...section.options, { id: Math.random().toString(36).substr(2, 9), label: "", priceAdjustment: 0 }]
                };
            }
            return section;
        }));
    };

    const removeCustomOption = (sectionId: string, optionId: string) => {
        setCustomSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    options: section.options.filter(opt => opt.id !== optionId)
                };
            }
            return section;
        }));
    };

    const updateCustomSectionConfig = (sectionId: string, field: keyof CustomSection, value: any) => {
        setCustomSections(prev => prev.map(section => {
            if (section.id === sectionId) return { ...section, [field]: value };
            return section;
        }));
    };

    const updateCustomOption = (sectionId: string, optionId: string, field: keyof PricingOption, value: string | number | boolean | null) => {
        setCustomSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    options: section.options.map(opt => opt.id === optionId ? { ...opt, [field]: value } : opt)
                };
            }
            return section;
        }));
    };


    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = currentTag.trim().replace(/^#/, ''); // Remove # if user typed it
            if (tag && !tags.includes(tag)) {
                setTags([...tags, tag]);
                setCurrentTag("");
            }
        } else if (e.key === 'Backspace' && !currentTag && tags.length > 0) {
            setTags(tags.slice(0, -1));
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (images.length >= 5) {
                toast.error("Maximum 5 images allowed");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Helper: Apply Department Presets
    const handleDepartmentChange = (dept: string) => {
        setDepartment(dept);

        // IDs of sections that are managed by presets
        const presetIds = ['neck', 'sleeve', 'personalization', 'print-location'];

        // 1. Remove all existing preset sections to start clean
        // We keep any custom sections the user manualy added (random IDs)
        let newSections = customSections.filter(s => !presetIds.includes(s.id));

        // 2. Add new presets based on selection
        if (dept === 'sublimation') {
            newSections = [...newSections,
            {
                id: "neck",
                title: "Neck Type",
                inputType: 'select',
                options: [
                    { id: "round", label: "Round Neck", priceAdjustment: 0 },
                    { id: "vneck", label: "V-Neck", priceAdjustment: 0 },
                    { id: "collar", label: "Collar (Polo)", priceAdjustment: 10 }
                ]
            },
            {
                id: "sleeve",
                title: "Sleeve Type",
                inputType: 'select',
                options: [
                    { id: "short", label: "Short Sleeve", priceAdjustment: 0 },
                    { id: "long", label: "Long Sleeve", priceAdjustment: 5 }
                ]
            },
            {
                id: "personalization",
                title: "Personalization",
                inputType: 'select',
                options: [
                    { id: "none", label: "No Personalization", priceAdjustment: 0 },
                    { id: "names", label: "Add Individual Names", priceAdjustment: 5, requiresInput: true },
                    { id: "names-numbers", label: "Add Names & Numbers", priceAdjustment: 10, requiresInput: true }
                ]
            }
            ];
        } else if (dept === 'dtf') {
            newSections = [...newSections,
            {
                id: "print-location",
                title: "Print Locations",
                inputType: 'checkbox',
                options: [
                    { id: "front-logo", label: "Front Left Logo", priceAdjustment: 5 },
                    { id: "front-big", label: "Front Big (A3)", priceAdjustment: 15 },
                    { id: "back-big", label: "Back Big (A3)", priceAdjustment: 15 }
                ]
            },
            {
                id: "personalization",
                title: "Add-ons",
                inputType: 'select',
                options: [
                    { id: "none", label: "None", priceAdjustment: 0 },
                    { id: "name-list", label: "Individual Names (Back)", priceAdjustment: 8, requiresInput: true }
                ]
            }
            ];
        }

        setCustomSections(newSections);

        // 3. Auto-populate Sizes for Apparel
        if (dept === 'sublimation' || dept === 'dtf') {
            setSizes([
                { id: "xs", label: "XS", priceAdjustment: 0 },
                { id: "s", label: "S", priceAdjustment: 0 },
                { id: "m", label: "M", priceAdjustment: 0 },
                { id: "l", label: "L", priceAdjustment: 0 },
                { id: "xl", label: "XL", priceAdjustment: 0 },
                { id: "2xl", label: "2XL", priceAdjustment: 2 }, // Example surcharge
                { id: "3xl", label: "3XL", priceAdjustment: 4 }  // Example surcharge
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({
            productName,
            description, // Ensure this is logged/saved
            department, // Add department to save payload
            subtitle,
            basePrice,
            stock,
            pricingModel,
            allowCustomSize,
            measurementUnit,
            tags,
            sizes,
            materials,
            finishings,
            durations,
            quantities,
            printSides,
            customSections,
        });
        toast.success("Product saved successfully!");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? "Edit Product" : "Add New Product"}
                    </h1>
                    <p className="text-gray-500 text-sm">Configure product details and pricing options.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/products" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Cancel
                    </Link>
                    <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
                        <Save size={18} />
                        <span>Save Product</span>
                    </button>
                </div>
            </div>

            {/* General Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">General Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Product Name</label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g. Standard Business Card"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Subtitle Product</label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="e.g. High quality, full color printing"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detailed product description..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Department / Type</label>
                            <select
                                value={department}
                                onChange={(e) => handleDepartmentChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="standard">Standard (General Printing)</option>
                                <option value="sublimation">Apparel - Full Sublimation</option>
                                <option value="dtf">Apparel - DTF Printing</option>
                                <option value="large-format">Large Format</option>
                            </select>
                            <p className="text-xs text-gray-500">Selecting an apparel department will pre-load standard options.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pricing Model</label>
                                <select
                                    value={pricingModel}
                                    onChange={(e) => setPricingModel(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="fixed">Fixed Price (Per Unit)</option>
                                    <option value="sqft">Area Based (Per SqFt)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        {pricingModel === 'sqft' ? 'Base Rate (RM / sqft)' : 'Base Price (RM)'}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">RM</span>
                                        <input
                                            type="number"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                                    <input
                                        type="number"
                                        value={stock}
                                        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tags (SEO)</label>
                            <div className="flex flex-wrap gap-2 mb-2 p-1">
                                {tags.map((tag, index) => (
                                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200">
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                placeholder="Type tag and press Enter (e.g. businesscard)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Product Images ({images.length}/5)</label>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {images.map((img, index) => (
                                <div key={index} className="relative aspect-square border-2 border-gray-200 rounded-xl overflow-hidden group">
                                    <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}

                            {images.length < 5 && (
                                <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors aspect-square">
                                    <div className="bg-blue-50 p-3 rounded-full mb-2">
                                        <Upload size={20} className="text-blue-500" />
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">Add Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Engine Config */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Pricing Engine Configuration</h2>

                <PricingSection
                    title="1. Size"
                    description="Add available sizes for this product (e.g. A4, A5)."
                    options={sizes}
                    setOptions={setSizes}
                    addOption={() => addOption(setSizes)}
                    removeOption={(id) => removeOption(setSizes, id)}
                    updateOption={(id, f, v) => updateOption(setSizes, id, f, v)}
                    isSizeConfig={true}
                    department={department}
                    extraHeaderContent={
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={allowCustomSize}
                                    onChange={(e) => setAllowCustomSize(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 font-medium">Allow Customer to Customize Size?</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600">Unit:</label>
                                <select
                                    value={measurementUnit}
                                    onChange={(e) => setMeasurementUnit(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="mm">mm</option>
                                    <option value="cm">cm</option>
                                    <option value="inch">inch</option>
                                    <option value="ft">ft</option>
                                </select>
                            </div>
                        </div>
                    }
                />

                <PricingSection
                    title="2. Printing Side"
                    description="Add printing side options (e.g. Single Sided, Double Sided)."
                    options={printSides}
                    setOptions={setPrintSides}
                    addOption={() => addOption(setPrintSides)}
                    removeOption={(id) => removeOption(setPrintSides, id)}
                    updateOption={(id, f, v) => updateOption(setPrintSides, id, f, v)}
                />

                <PricingSection
                    title="3. Material"
                    description="Add material options (e.g. 260gsm Art Card)."
                    options={materials}
                    setOptions={setMaterials}
                    addOption={() => addOption(setMaterials)}
                    removeOption={(id) => removeOption(setMaterials, id)}
                    updateOption={(id, f, v) => updateOption(setMaterials, id, f, v)}
                />

                <PricingSection
                    title="4. Finishing"
                    description="Add finishing options (e.g. Matte Lamination, Spot UV)."
                    options={finishings}
                    setOptions={setFinishings}
                    addOption={() => addOption(setFinishings)}
                    removeOption={(id) => removeOption(setFinishings, id)}
                    updateOption={(id, f, v) => updateOption(setFinishings, id, f, v)}
                />

                <PricingSection
                    title="5. Process Duration"
                    description="Add production time options (e.g. 2-3 Working Days, Urgent)."
                    options={durations}
                    setOptions={setDurations}
                    addOption={() => addOption(setDurations)}
                    removeOption={(id) => removeOption(setDurations, id)}
                    updateOption={(id, f, v) => updateOption(setDurations, id, f, v)}
                />

                <PricingSection
                    title="6. Quantity"
                    description="Define quantity breaks (e.g. 100, 200, 500)."
                    options={quantities}
                    setOptions={setQuantities}
                    addOption={() => addOption(setQuantities)}
                    removeOption={(id) => removeOption(setQuantities, id)}
                    updateOption={(id, f, v) => updateOption(setQuantities, id, f, v)}
                />

                {/* Custom Sections */}
                {customSections.map((section, index) => (
                    <PricingSection
                        key={section.id}
                        title={`${7 + index}. ${section.title}`}
                        description={`Custom options for ${section.title}.`}
                        options={section.options}
                        setOptions={() => { }} // Not used directly for custom
                        addOption={() => addCustomOption(section.id)}
                        removeOption={(optId) => removeCustomOption(section.id, optId)}
                        updateOption={(optId, f, v) => updateCustomOption(section.id, optId, f, v)}
                        onRemoveSection={
                            ['neck', 'sleeve', 'personalization', 'print-location'].includes(section.id)
                                ? undefined
                                : () => removeCustomSection(section.id)
                        }
                        sectionConfig={{
                            inputType: section.inputType,
                            onUpdateConfig: (field, value) => updateCustomSectionConfig(section.id, field, value)
                        }}
                    />
                ))}

                {/* Add New Section UI */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    {!isAddingSection ? (
                        <button
                            type="button"
                            onClick={() => setIsAddingSection(true)}
                            className="flex items-center gap-2 text-blue-600 font-medium hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                            <span>Add Custom Option Group</span>
                        </button>
                    ) : (
                        <div className="w-full max-w-md space-y-3 animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="font-semibold text-gray-800">Add New Option Group</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    placeholder="Group Name (e.g. Eyelets, Folding)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={addCustomSection}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingSection(false)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </form>
    );
}

// Reusable Section Component
function PricingSection({
    title,
    description,
    options,
    setOptions,
    addOption,
    removeOption,
    updateOption,
    isSizeConfig = false,
    extraHeaderContent,
    onRemoveSection,
    sectionConfig,
    department
}: {
    title: string;
    description: string;
    options: PricingOption[];
    setOptions: any;
    addOption: () => void;
    removeOption: (id: string) => void;
    updateOption: (id: string, field: keyof PricingOption, value: string | number | boolean | null) => void;
    isSizeConfig?: boolean;
    department?: string; // Passed down to control UI
    extraHeaderContent?: React.ReactNode;
    onRemoveSection?: () => void;
    sectionConfig?: {
        inputType: 'select' | 'checkbox';
        onUpdateConfig: (field: any, value: any) => void;
    };
}) {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, optionId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateOption(optionId, "image", reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onRemoveSection && (
                        <button
                            type="button"
                            onClick={onRemoveSection}
                            className="flex items-center gap-1 text-sm bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                        >
                            <Trash2 size={16} />
                            <span>Remove Group</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={addOption}
                        className="flex items-center gap-1 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-700"
                    >
                        <Plus size={16} />
                        <span>Add Item</span>
                    </button>
                </div>
            </div>

            {extraHeaderContent && (
                <div className="px-4 py-3 bg-blue-50/30 border-b border-gray-100">
                    {extraHeaderContent}
                </div>
            )}

            {sectionConfig && (
                <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                    <label className="text-sm text-gray-600 font-medium">Selection Type:</label>
                    <div className="flex bg-white rounded-lg border p-1">
                        <button
                            type="button"
                            onClick={() => sectionConfig.onUpdateConfig('inputType', 'select')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sectionConfig.inputType === 'select' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Single Select (Dropdown)
                        </button>
                        <button
                            type="button"
                            onClick={() => sectionConfig.onUpdateConfig('inputType', 'checkbox')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sectionConfig.inputType === 'checkbox' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Multi Select (Checkboxes)
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-3">
                {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                            {/* Image Upload/Preview */}
                            <label className="cursor-pointer relative group/img flex-shrink-0">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e, option.id)}
                                />
                                {option.image ? (
                                    <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden relative">
                                        <img src={option.image} alt="Opt" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                            <ImageIcon size={14} className="text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors bg-gray-50">
                                        <ImageIcon size={16} />
                                    </div>
                                )}
                            </label>

                            <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(option.id, "label", e.target.value)}
                                placeholder="Option Name (e.g. A4)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {isSizeConfig && !['sublimation', 'dtf'].includes(department || "") && (
                            <>
                                <div className="relative w-24">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">mm</span>
                                    <input
                                        type="number"
                                        value={option.width || ""}
                                        onChange={(e) => updateOption(option.id, "width", parseFloat(e.target.value) || 0)}
                                        placeholder="W"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div className="text-gray-400">×</div>
                                <div className="w-24 relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">mm</span>
                                    <input
                                        type="number"
                                        value={option.height || ""}
                                        onChange={(e) => updateOption(option.id, "height", parseFloat(e.target.value) || 0)}
                                        placeholder="H"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <div className="w-32 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">RM</span>
                            <input
                                type="number"
                                value={option.priceAdjustment}
                                onChange={(e) => updateOption(option.id, "priceAdjustment", parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Requires Input Checkbox */}
                        <div className="flex items-center" title="Does this option require customer input? (e.g. Name list)">
                            <label className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white cursor-pointer hover:border-blue-500 transition-colors">
                                <span className={`text-[10px] font-bold ${option.requiresInput ? 'text-blue-600' : 'text-gray-300'}`}>T</span>
                                <input
                                    type="checkbox"
                                    checked={option.requiresInput || false}
                                    onChange={(e) => updateOption(option.id, "requiresInput", e.target.checked)}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <button
                            type="button"
                            onClick={() => removeOption(option.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {options.length === 0 && (
                    <div className="text-center py-4 text-sm text-gray-400 italic">
                        No options added yet. Click "Add Item" to start.
                    </div>
                )}
            </div>
        </div>
    );
}
