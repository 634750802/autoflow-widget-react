import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReactBotRoot from './ReactBotRoot.tsx';
import './test.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <p>Outer</p>
      <button className="text-lg">hi</button>
      <ul>
        <li>LI</li>
      </ul>
      <ReactBotRoot />
    </>
  </StrictMode>,
);
