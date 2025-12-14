import ProductForm from "@/components/ProductForm";

export default function EditProductPage() {
    // Mock Data
    const mockProduct = {
        name: "Standard Business Cards",
        subtitle: "High quality 260gsm art card with matte lamination",
        price: 25.00,
        stock: 1500,
        pricingModel: "fixed",
        allowCustomSize: false,
        measurementUnit: "mm",
        tags: ["businesscard", "corporate", "branding", "print"],
        images: [],
        sizes: [
            { id: "s1", label: "A4", priceAdjustment: 0 },
            { id: "s2", label: "Custom (90x54mm)", priceAdjustment: 5 }
        ],
        printSides: [
            { id: "ps1", label: "Single Sided (4+0)", priceAdjustment: 0 },
            { id: "ps2", label: "Double Sided (4+4)", priceAdjustment: 10 }
        ],
        materials: [
            { id: "m1", label: "260gsm Art Card", priceAdjustment: 0 },
            { id: "m2", label: "310gsm Art Card", priceAdjustment: 10 }
        ],
        finishings: [
            { id: "f1", label: "None", priceAdjustment: 0, image: null },
            { id: "f2", label: "Matte Lamination", priceAdjustment: 15, image: null }
        ],
        durations: [
            { id: "d1", label: "3-4 Working Days", priceAdjustment: 0 },
            { id: "d2", label: "Urgent (Next Day)", priceAdjustment: 50 }
        ],
        quantities: [
            { id: "q1", label: "100", priceAdjustment: 30 },
            { id: "q2", label: "200", priceAdjustment: 45 },
            { id: "q3", label: "500", priceAdjustment: 80 }
        ],
        customSections: [
            {
                id: "cs1",
                title: "Eyelets",
                options: [
                    { id: "opt1", label: "4 Corners", priceAdjustment: 5 },
                    { id: "opt2", label: "Every 1ft", priceAdjustment: 12 }
                ]
            }
        ]
    };

    return (
        <div>
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <a href="/products" className="hover:text-blue-600 transition-colors">Products</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-800 font-medium">Edit Product</span>
                </nav>
            </div>
            <ProductForm initialData={mockProduct} isEditing={true} />
        </div>
    );
}
