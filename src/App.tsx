// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

import React, { useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { useSimulatorStore } from './store/simulatorStore';

function App() {
  const initialize = useSimulatorStore(state => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainLayout />
    </div>
  );
}

export default App;