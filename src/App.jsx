import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Register from './pages/Auth Page/SignUp/Register';
import MainPage from './pages/MainPage/MainPage';
import Authenticate from './pages/Auth Page/SignIn/Authenticate';
import Forum from './pages/Forum Page/Forum';
import CreatePost from './pages/Create Post Page/CreatePost';
import Profile from './pages/Profile Page/Profile';
import PrivateRoute from './routes/PrivateRoute';
import AboutSpecialtyPage from './pages/About Specialty Page/AboutSpecialtyPage';
import CourseMapPage from './pages/Course Map Page/CourseMapPage';
import PostDetail from './pages/Post Detail Page/PostDetail';
import NotFound from './components/Errors/NotFound/NotFound';
import MediaHub from './pages/MediaHub/MediaHub';
import AiChatPopup from './components/AiChatPopup/AiChatPopup';
import Schedule from './pages/Schedule/Schedule';

function ScrollToTopOnNavigate() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'instant' });
  }, [pathname, hash, key]);

  return null;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="ami-route-motion">
      <AiChatPopup />
      <Routes location={location}>
        <Route path="/signup" element={<Register />} />
        <Route path="/signin" element={<Authenticate />} />
        <Route path="/" element={<Navigate to="/main" replace />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/about-specialties" element={<AboutSpecialtyPage />} />
        <Route path="/course-map" element={<CourseMapPage />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/post/:slug" element={<PostDetail />} />
        <Route path="/post/:slug" element={<PostDetail />} />
        <Route path="/media" element={<MediaHub />} />
        <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile/></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTopOnNavigate />
      <AppRoutes />
    </Router>
  );
}

export default App;
