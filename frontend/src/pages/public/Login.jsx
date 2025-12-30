import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('jobseeker'); 
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // My backend implementation of /login only takes email/password.
        const result = await login(email, password);
        console.log("Login result:", result);
        if (result.success) {
            // Get user from context or result to check role (Context updates slightly later sometimes, safer to use result logic if returned, but here we can rely on what we just set or wait for effect. 

            const storedUser = JSON.parse(localStorage.getItem('user'));
            console.log("Stored user after login:", storedUser);
            const userRole = storedUser?.role;
            console.log("Detected User Role:", userRole);

            if (!userRole) {
                console.error("No role found for user! Redirecting to home or handling error.");
                // Fallback? or maybe alert
                alert("Login successful but role is missing. Please contact support.");
                return;
            }

            if (userRole === 'admin') navigate('/admin/dashboard');
            else if (userRole === 'recruiter') navigate('/recruiter/dashboard');
            else navigate('/seeker/dashboard');
        } else {
            console.error("Login failed:", result.message);
            alert(result.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
                </div>
                <div>
                    <label className="block mb-1">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
                </div>
                {/* Role selection removed, determined by backend */}
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Login</button>
            </form>
        </div>
    );
};

export default Login;
