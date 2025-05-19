import { Remark } from '../src/components/remark.tsx';
import main from './doc.md?raw';

const content = main.replace('$base', location.origin);

export default function Page () {
  return (
    <main>
      <Remark className="mx-auto" content={content} />
    </main>
  );
}