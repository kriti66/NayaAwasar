const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Help and Support</h1>
        <p className="text-sm text-gray-600">
          Need assistance? We are here to help job seekers and recruiters across Nepal use Naya Awasar effectively.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">For Job Seekers</h2>
          <p className="text-gray-700">
            Update your profile, apply to verified roles, and track application status from your dashboard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">For Recruiters</h2>
          <p className="text-gray-700">
            Post jobs, review applications, and manage hiring pipelines with role-based tools and company verification.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">Contact Support</h2>
          <p className="text-gray-700">
            For technical help or account issues, contact us at adminnayaawasar@gmail.com and we will respond soon.
          </p>
        </section>
      </div>
    </div>
  );
};

export default HelpPage;
