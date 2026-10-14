import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import IngredientsPage from './pages/IngredientsPage.jsx'
import RecipesPage from './pages/RecipesPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ingredients" element={<IngredientsPage />} />
      <Route path="/recipes" element={<RecipesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
