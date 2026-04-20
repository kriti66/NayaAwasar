const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-sm text-gray-600">
          Naya Awasar respects your privacy and processes personal data in line with Nepalese legal and ethical standards.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">1. Information We Collect</h2>
          <p className="text-gray-700">
            We collect profile details, resume data, job preferences, and employer company information to support hiring.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">2. How We Use Data</h2>
          <p className="text-gray-700">
            Your data is used to match jobs, process applications, improve recommendations, and provide account security.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">3. Data Protection</h2>
          <p className="text-gray-700">
            We apply access controls and secure storage practices, and only authorized teams may access sensitive information.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
