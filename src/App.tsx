import { useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { useStore } from './store/useStore';

function App() {
  const init = useStore((s) => s.init);

  useEffect(() => {
    init();
  }, []);

  return <AppShell />;
}

export default App;
