import { createRoot } from 'react-dom/client';
import ReactBotRoot from './ReactBotRoot';

const rootElement = document.createElement('div');
rootElement.id = 'tidbai-root';
document.body.appendChild(rootElement);

createRoot(rootElement).render(<ReactBotRoot />);
