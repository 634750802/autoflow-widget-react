# Autoflow Widget

## Use directly in HTML

```html

<script
  src="$base/widget.js"
  data-api-base="https://tidb.ai"
  data-chat-engine="chat-engine"
></script>
```

## Use with Next.js

```shell
npm install -D autoflow-widget-react
```

```typescript jsx
import { ReactBotRoot } from 'autoflow-widget-react/next';

render(
  <>
    ...
    <ReactBotRoot scriptConfig={{
      src: '',
      apiBase: 'https://tidb.ai',
      controlled: false,
      trigger: null,
      chatEngine: 'chat-engine',
      measurementId: undefined,
    }} />
    ...
  </>,
);

```