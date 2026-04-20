const CookiesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cookies Policy</h1>
        <p className="text-sm text-gray-600">
          This page explains how Naya Awasar uses cookies and similar technologies to improve your experience.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">1. Essential Cookies</h2>
          <p className="text-gray-700">
            These cookies keep you signed in, secure your session, and ensure core portal features work properly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">2. Performance Cookies</h2>
          <p className="text-gray-700">
            We use anonymized analytics cookies to understand usage patterns and improve job discovery and platform speed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">3. Managing Cookies</h2>
          <p className="text-gray-700">
            You can manage cookie preferences in your browser settings, but disabling essential cookies may affect functionality.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiesPage;
