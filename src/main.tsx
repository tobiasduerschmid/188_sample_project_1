import { createRoot } from 'react-dom/client';
import { ProfileStorage } from './storage/profile';
import { PlanRepository } from './storage/repository';
import { CatalogLibrary } from './catalog/library';
import { PlanSession } from './session/session';
import { App } from './ui/App';
import './ui/styles.css';

const storage = new ProfileStorage();
const library = new CatalogLibrary(storage);
const session = new PlanSession(new PlanRepository(storage), library);
createRoot(document.getElementById('root')!).render(<App session={session} />);
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    session.dispose();
    library.dispose();
    storage.close();
  });
