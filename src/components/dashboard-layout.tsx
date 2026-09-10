'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Upload, FileText, Clock, Share2, FileBarChart, Search, Settings, HelpCircle, LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children, userRole }: { children: React.ReactNode, userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = React.useState('Patient');
  const [initials, setInitials] = React.useState('P');

  React.useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data?.full_name) {
          setUserName(data.full_name);
          const ini = data.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          setInitials(ini || 'P');
        }
      }
    }
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = userRole === 'DOCTOR' ? [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'My Patients', href: '/patients', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ] : [
    { name: 'Home', href: '/', icon: Home },
    { name: 'My Profile', href: '/profile', icon: User },
    { name: 'Upload Records', href: '/upload', icon: Upload },
    { name: 'My Health Context', href: '/context', icon: FileText },
    { name: 'Timeline', href: '/timeline', icon: Clock },
    { name: 'Share with Doctor', href: '/share', icon: Share2 },
    { name: 'Handoff Reports', href: '/handoff', icon: FileBarChart },
    { name: 'Find Doctors', href: '/doctors', icon: Search },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Help & Support', href: '/support', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen print:h-auto bg-gray-50 overflow-hidden print:overflow-visible text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a2322] text-white flex flex-col shrink-0 print:hidden">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center font-bold text-xl">+</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">DocLens</h1>
              <p className="text-[10px] text-gray-400">Your health story, connected.</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-emerald-900/40 text-emerald-400 border-l-2 border-emerald-500' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
        {/* Header - simple header with search and user profile as seen in mockups */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 print:hidden">
          <div className="w-96">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search your records, doctors, or anything..." 
                className="w-full bg-gray-50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              {/* Notification icon placeholder */}
              <div className="w-4 h-4 rounded-full border-2 border-current"></div>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-800 font-bold text-sm">
                {initials}
              </div>
              <span className="text-sm font-medium">{userName}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto print:overflow-visible print:p-0 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
