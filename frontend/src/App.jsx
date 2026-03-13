import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import ChatWidget from './components/shared/ChatWidget';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ChatWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
