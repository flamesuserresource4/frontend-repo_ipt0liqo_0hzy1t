import { PawPrint, ShoppingBag, MessageCircle, Camera, Users, User, PackageSearch } from 'lucide-react'

export default function Header({ activeTab, setActiveTab }) {
  const tabs = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'pets', label: 'Pets', icon: PawPrint },
    { key: 'products', label: 'Products', icon: ShoppingBag },
    { key: 'posts', label: 'Posts', icon: Camera },
    { key: 'feed', label: 'Feed', icon: Users },
    { key: 'orders', label: 'Orders', icon: PackageSearch },
    { key: 'messages', label: 'Messages', icon: MessageCircle },
  ]

  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-slate-900/60 border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/flame-icon.svg" className="w-8 h-8" />
          <span className="text-white font-semibold">Pet Social + Marketplace</span>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon
            const active = activeTab === t.key
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition ${active ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-slate-700/60'}`}>
                <Icon size={16} /> {t.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
