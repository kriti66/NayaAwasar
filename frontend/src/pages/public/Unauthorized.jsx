import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
            <p className="mb-4">You do not have permission to view this page.</p>
            <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
        </div>
    );
};

export default Unauthorized;
