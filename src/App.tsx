import { Routes, Route } from 'react-router-dom'
import ProjectHome from './pages/ProjectHome'
import Upload from './pages/Upload'
import Pipeline from './pages/Pipeline'
import TradeSummary from './pages/TradeSummary'
import BoqReport from './pages/BoqReport'
import DrawingLibrary from './pages/DrawingLibrary'
import RevisionCompare from './pages/RevisionCompare'
import Workspace from './pages/Workspace'
import { TourProvider } from './components/tour-overlay/TourContext'
import { TourOverlay } from './components/tour-overlay/TourOverlay'

export default function App() {
  return (
    <TourProvider>
      <Routes>
        <Route path="/" element={<ProjectHome />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/trades" element={<TradeSummary />} />
        <Route path="/report" element={<BoqReport />} />
        <Route path="/workspace" element={<Workspace />} />
        <Route path="/revisions" element={<RevisionCompare />} />
        <Route path="/drawings" element={<DrawingLibrary />} />
      </Routes>
      <TourOverlay />
    </TourProvider>
  )
}
