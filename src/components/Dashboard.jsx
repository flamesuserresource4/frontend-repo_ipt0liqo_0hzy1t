import { useEffect, useMemo, useState } from 'react'
import Header from './Header'
import SectionCard from './SectionCard'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('account')
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [pets, setPets] = useState([])
  const [feed, setFeed] = useState([])
  const [messages, setMessages] = useState([])
  const [me, setMe] = useState(null)

  useEffect(() => {
    // bootstrap: create demo users if none
    const bootstrap = async () => {
      const ures = await fetch(`${API}/users`).then(r => r.json()).catch(() => [])
      setUsers(ures)
      let current = ures.find(u => u.user_type === 'owner')
      if (!current) {
        current = await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Alex', email: `alex_${Date.now()}@pets.app`, user_type: 'owner' }) }).then(r => r.json())
        current = { id: current.id, name: 'Alex', email: 'alex@pets.app', user_type: 'owner' }
      }
      setMe(current)
      const pres = await fetch(`${API}/products`).then(r => r.json()).catch(() => [])
      setProducts(pres)
      const petres = await fetch(`${API}/pets`).then(r => r.json()).catch(() => [])
      setPets(petres)
      const feedres = await fetch(`${API}/feed`).then(r => r.json()).catch(() => [])
      setFeed(feedres)
    }
    bootstrap()
  }, [])

  const createPet = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      owner_id: me.id,
      name: form.get('name'),
      species: form.get('species'),
      breed: form.get('breed') || undefined,
      description: form.get('description') || undefined,
      photo_urls: (form.get('photo_urls') || '').split(',').map(s => s.trim()).filter(Boolean)
    }
    const res = await fetch(`${API}/pets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const { id } = await res.json()
      setPets([{ id, ...body }, ...pets])
      e.currentTarget.reset()
      setActiveTab('pets')
    }
  }

  const createProduct = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    // create a business if needed
    let biz = users.find(u => u.user_type === 'business')
    if (!biz) {
      const created = await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PetCo', email: `biz_${Date.now()}@pets.app`, user_type: 'business' }) }).then(r => r.json())
      biz = { id: created.id, name: 'PetCo', user_type: 'business' }
      setUsers(prev => [...prev, biz])
    }
    const body = {
      owner_id: biz.id,
      title: form.get('title'),
      description: form.get('description') || undefined,
      price: parseFloat(form.get('price') || '0'),
      images: (form.get('images') || '').split(',').map(s => s.trim()).filter(Boolean),
      stock: parseInt(form.get('stock') || '0', 10),
    }
    const res = await fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const { id } = await res.json()
      setProducts([{ id, ...body }, ...products])
      e.currentTarget.reset()
      setActiveTab('products')
    }
  }

  const createPost = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      user_id: me.id,
      caption: form.get('caption') || undefined,
      media_urls: (form.get('media_urls') || '').split(',').map(s => s.trim()).filter(Boolean),
      product_ids: (form.get('product_ids') || '').split(',').map(s => s.trim()).filter(Boolean),
      pet_ids: pets.map(p => p.id),
      visibility: 'public'
    }
    const res = await fetch(`${API}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const { id } = await res.json()
      setFeed([{ id, ...body, created_at: new Date().toISOString() }, ...feed])
      e.currentTarget.reset()
      setActiveTab('feed')
    }
  }

  const placeOrder = async (productId) => {
    const body = {
      buyer_id: me.id,
      product_id: productId,
      quantity: 1,
      shipping_address: '123 Pet St, Paw City, PC',
      status: 'pending'
    }
    const res = await fetch(`${API}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) alert('Order placed! Check Orders tab to update tracking.')
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const receiver = (users.find(u => u.user_type === 'business') || users[0])
    // ensure mutual follow
    await fetch(`${API}/follow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ follower_id: me.id, following_id: receiver.id }) })
    await fetch(`${API}/follow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ follower_id: receiver.id, following_id: me.id }) })

    const body = { sender_id: me.id, receiver_id: receiver.id, text: form.get('text') }
    const res = await fetch(`${API}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      const convo = await fetch(`${API}/conversations?user_a=${me.id}&user_b=${receiver.id}`).then(r => r.json())
      setMessages(convo)
      e.currentTarget.reset()
      setActiveTab('messages')
    }
  }

  const updateOrder = async (orderId) => {
    const tracking = prompt('Enter tracking number')
    if (!tracking) return
    const res = await fetch(`${API}/orders/${orderId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tracking_number: tracking, status: 'shipped' }) })
    if (res.ok) alert('Order updated!')
  }

  useEffect(() => {
    const loadConvo = async () => {
      const receiver = (users.find(u => u.user_type === 'business') || users[0])
      if (me && receiver) {
        const convo = await fetch(`${API}/conversations?user_a=${me.id}&user_b=${receiver.id}`).then(r => r.json()).catch(() => [])
        setMessages(convo)
      }
    }
    loadConvo()
  }, [me, users])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-blue-100">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6">

        {activeTab === 'account' && (
          <SectionCard title="Quick Start">
            <p className="mb-3">A simple sandbox to try the core flows: create your profile and pets, list a product, share a post, message after following, and place orders with tracking.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <form onSubmit={createPet} className="space-y-2">
                <h3 className="font-semibold text-white">Add Pet</h3>
                <input name="name" placeholder="Name" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" required />
                <input name="species" placeholder="Species" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" required />
                <input name="breed" placeholder="Breed (optional)" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
                <textarea name="description" placeholder="About" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
                <input name="photo_urls" placeholder="Photo URLs (comma-separated)" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">Save Pet</button>
              </form>

              <form onSubmit={createProduct} className="space-y-2">
                <h3 className="font-semibold text-white">Add Product (business)</h3>
                <input name="title" placeholder="Title" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" required />
                <textarea name="description" placeholder="Description" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
                <input name="price" type="number" step="0.01" placeholder="Price" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" required />
                <input name="images" placeholder="Image URLs (comma-separated)" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
                <input name="stock" type="number" placeholder="Stock" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" defaultValue="10" />
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">Save Product</button>
              </form>
            </div>
          </SectionCard>
        )}

        {activeTab === 'pets' && (
          <SectionCard title="Your Pets">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pets.map(p => (
                <div key={p.id} className="bg-slate-900/50 border border-slate-700 rounded p-3">
                  {p.photo_urls?.[0] && <img src={p.photo_urls[0]} className="w-full h-32 object-cover rounded mb-2" />}
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-blue-200/80">{p.species} {p.breed ? `• ${p.breed}` : ''}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeTab === 'products' && (
          <SectionCard title="Shop Products">
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {products.map(pr => (
                <div key={pr.id} className="bg-slate-900/50 border border-slate-700 rounded p-3 flex flex-col">
                  {pr.images?.[0] && <img src={pr.images[0]} className="w-full h-32 object-cover rounded mb-2" />}
                  <div className="font-semibold text-white">{pr.title}</div>
                  <div className="text-sm">${'{'}pr.price{'}'}</div>
                  <div className="text-xs text-blue-200/80">Stock: {pr.stock}</div>
                  <button className="mt-auto bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded" onClick={() => placeOrder(pr.id)}>Buy</button>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeTab === 'posts' && (
          <SectionCard title="Create Post">
            <form onSubmit={createPost} className="space-y-2">
              <input name="caption" placeholder="Caption" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
              <input name="media_urls" placeholder="Media URLs (comma-separated)" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
              <input name="product_ids" placeholder="Tag Product IDs (comma-separated)" className="w-full bg-slate-900/60 border border-slate-700 rounded p-2" />
              <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">Share</button>
            </form>
          </SectionCard>
        )}

        {activeTab === 'feed' && (
          <SectionCard title="Social Feed">
            <div className="grid gap-4">
              {feed.map(post => (
                <div key={post.id || post._id} className="bg-slate-900/50 border border-slate-700 rounded p-3">
                  <div className="text-sm text-blue-200/70 mb-1">{new Date(post.created_at || Date.now()).toLocaleString()}</div>
                  {post.media_urls?.[0] && <img src={post.media_urls[0]} className="w-full h-48 object-cover rounded mb-2" />}
                  {post.caption && <div className="mb-2">{post.caption}</div>}
                  {post.product_ids?.length > 0 && (
                    <div className="text-xs text-blue-200/80">Tagged products: {post.product_ids.join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {activeTab === 'orders' && (
          <SectionCard title="Orders">
            <OrdersList me={me} updateOrder={updateOrder} />
          </SectionCard>
        )}

        {activeTab === 'messages' && (
          <SectionCard title="Messages">
            <form onSubmit={sendMessage} className="flex gap-2 mb-3">
              <input name="text" placeholder="Say hi..." className="flex-1 bg-slate-900/60 border border-slate-700 rounded p-2" required />
              <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">Send</button>
            </form>
            <div className="space-y-2">
              {messages.map(m => (
                <div key={m.id} className={`px-3 py-2 rounded max-w-[70%] ${m.sender_id === me?.id ? 'bg-blue-600 ml-auto' : 'bg-slate-700'} `}>
                  {m.text}
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </main>
    </div>
  )
}

function OrdersList({ me, updateOrder }) {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    const load = async () => {
      const buyerOrders = await fetch(`${API}/orders?buyer_id=${me?.id || ''}`).then(r => r.json()).catch(() => [])
      const bizOrders = await fetch(`${API}/orders?owner_id=${me?.id || ''}`).then(r => r.json()).catch(() => [])
      setOrders([...buyerOrders, ...bizOrders])
    }
    if (me) load()
  }, [me])

  return (
    <div className="grid gap-3">
      {orders.map(o => (
        <div key={o.id} className="bg-slate-900/50 border border-slate-700 rounded p-3 flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Order {o.id.slice(-6)}</div>
            <div className="text-xs text-blue-200/80">Product: {o.product_id} • Qty: {o.quantity} • Status: {o.status}</div>
            {o.tracking_number && <div className="text-xs text-blue-200/80">Tracking: {o.tracking_number}</div>}
          </div>
          <div className="flex items-center gap-2">
            {!o.tracking_number && (
              <button onClick={() => updateOrder(o.id)} className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded">Add Tracking</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
