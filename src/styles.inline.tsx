import codeStyles from '@wooorm/starry-night/style/light?inline';
import styles from './library.css?inline';

export function InlineStyles () {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <style dangerouslySetInnerHTML={{ __html: codeStyles }} />
    </>
  );
}
