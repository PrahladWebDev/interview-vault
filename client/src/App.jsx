import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import QuestionLibraryPage from './pages/QuestionLibraryPage.jsx';
import QuestionDetailPage from './pages/QuestionDetailPage.jsx';
import CompaniesPage from './pages/CompaniesPage.jsx';
import CompanyDetailPage from './pages/CompanyDetailPage.jsx';
import TopicsPage from './pages/TopicsPage.jsx';
import TopicDetailPage from './pages/TopicDetailPage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
import CollectionDetailPage from './pages/CollectionDetailPage.jsx';
import GraphPage from './pages/GraphPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/library" element={<QuestionLibraryPage />} />
        <Route path="/questions/:id" element={<QuestionDetailPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:name" element={<CompanyDetailPage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/topics/:name" element={<TopicDetailPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/collections/:id" element={<CollectionDetailPage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
