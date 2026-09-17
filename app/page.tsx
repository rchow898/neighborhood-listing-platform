export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 px-6 py-12 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Neighborhood Listing Platform
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Connecting local residents with community listings, trusted neighborhood sponsors, and real-time voice assistance.
        </p>
      </header>

      <section aria-labelledby="features-heading" className="space-y-6">
        <h2 id="features-heading" className="sr-only">Platform Features</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold mb-2">Local Listings</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Browse and publish neighborhood services, item exchanges, and hyper-local updates.
            </p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold mb-2">Neighborhood Sponsors</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Discover local businesses and community partners supporting neighborhood initiatives.
            </p>
          </article>

          <article className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold mb-2">Voice Help</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Navigate community services and search listings hands-free with guided voice interactions.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}