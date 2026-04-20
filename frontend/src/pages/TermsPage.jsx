const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Terms and Conditions</h1>
        <p className="text-sm text-gray-600">
          These terms govern your use of Naya Awasar, a Nepal-based job portal connecting job seekers and employers.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">1. Account Responsibility</h2>
          <p className="text-gray-700">
            You are responsible for maintaining the confidentiality of your account and for all activity under your login.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">2. Job Posting and Applications</h2>
          <p className="text-gray-700">
            Recruiters must post genuine vacancies, and applicants must provide accurate information in resumes and profiles.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">3. Acceptable Use</h2>
          <p className="text-gray-700">
            Fraud, misleading content, discriminatory hiring practices, and unauthorized data scraping are strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
