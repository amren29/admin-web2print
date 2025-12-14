import ProductForm from "@/components/ProductForm";

export default function NewProductPage() {
    return (
        <div>
            <div className="mb-6">
                <nav className="text-sm text-gray-500 mb-2">
                    <a href="/products" className="hover:text-blue-600 transition-colors">Products</a>
                    <span className="mx-2">/</span>
                    <span className="text-gray-800 font-medium">Add New</span>
                </nav>
            </div>
            <ProductForm />
        </div>
    );
}
