import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
            <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
        </div>
    );
};

export default NotFound;
