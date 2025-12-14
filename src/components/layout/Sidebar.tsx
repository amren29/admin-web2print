"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, FileText, Users, DollarSign, Package, Settings, LogOut, ChevronLeft, Briefcase, TicketPercent } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Orders", icon: ShoppingCart, href: "/orders" },
    { label: "Quotes", icon: FileText, href: "/quotes" },
    { label: "Customers", icon: Users, href: "/customers" },
    { label: "Agents", icon: DollarSign, href: "/agents" },
    { label: "Products", icon: Package, href: "/products" },
    { label: "Packages", icon: Briefcase, href: "/marketing/bundles" },
    { label: "Promotions", icon: TicketPercent, href: "/promotions" }, // Was likely 'marketing/promotions' or just 'promotions'
    { label: "Invoices", icon: FileText, href: "/invoices" },
    { label: "Users", icon: Users, href: "/users" },
    { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-slate-800 text-white flex flex-col h-full border-r border-slate-700 hidden lg:flex shadow-xl z-20">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-8 border-b border-slate-700 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20">
                        W
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Web2Print</span>
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu</div>

                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={cn("transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                            <span>{item.label}</span>
                            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full" />}
                        </Link>
                    );
                })}
            </div>

            {/* Footer / Profile Snippet */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/30">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 border border-slate-600">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Admin User</p>
                        <p className="text-xs text-slate-400 truncate">admin@web2print.com</p>
                    </div>
                    <LogOut size={16} className="text-slate-500 hover:text-white transition-colors" />
                </div>
            </div>
        </aside>
    );
}
