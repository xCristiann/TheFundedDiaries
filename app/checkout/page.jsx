export const dynamic = "force-dynamic";

export default function Page() {
  // dacă ai deja /checkout UI, înlocuiești aici cu componenta ta reală
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-gray-400">This page is now dynamic to avoid prerender errors.</p>
      </div>
    </div>
  );
}
