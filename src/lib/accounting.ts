export interface Invoice {
    id: string;
    customerName: string;
    totalAmount: number;
    createdAt: string;
    status: string;
    // Add other fields as needed for export
}

export function generateCSV(invoices: Invoice[]): string {
    const headers = ["Invoice ID", "Date", "Customer", "Amount", "Status"];
    const rows = invoices.map(inv => [
        inv.id,
        new Date(inv.createdAt).toISOString().split('T')[0], // YYYY-MM-DD
        `"${inv.customerName.replace(/"/g, '""')}"`, // Escape quotes
        inv.totalAmount.toFixed(2),
        inv.status
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    return csvContent;
}

export function downloadCSV(content: string, filename: string = 'invoices.csv') {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export async function syncToSoftware(invoices: Invoice[]): Promise<{ success: boolean; message: string }> {
    // Mock API Call
    console.log("Syncing to accounting software...", invoices);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate success
    return { success: true, message: `Successfully synced ${invoices.length} invoices to Accounting Software.` };
}
