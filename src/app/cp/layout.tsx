import { Handshake, PlusCircle, LayoutDashboard, LogOut } from "lucide-react";

export default function CPLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* CP Header */}
            <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center text-white">
                        <Handshake size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg leading-none">Partner Connect</h1>
                        <div className="text-[10px] text-slate-400 mt-0.5">ELITE TIER BROKER</div>
                    </div>
                </div>

                <nav className="flex items-center gap-6 text-sm font-medium">
                    <a href="#" className="text-white hover:text-amber-400 transition-colors flex items-center gap-2">
                        <LayoutDashboard size={18} /> Dashboard
                    </a>
                    <a href="#" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        <PlusCircle size={18} /> Register Lead
                    </a>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="font-bold">Rahul Properties</div>
                        <div className="text-xs text-slate-400">ID: CP-9921</div>
                    </div>
                    <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><LogOut size={20} /></button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                {children}
            </main>
        </div>
    );
}
