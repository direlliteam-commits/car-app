import { ScrollViewStyleReset } from "expo-router/html";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hy">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
html, body, #root {
  background-color: #000000 !important;
}
@media (prefers-color-scheme: light) {
  html, body, #root {
    background-color: #F2F2F7 !important;
  }
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
