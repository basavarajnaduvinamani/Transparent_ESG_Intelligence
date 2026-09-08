export function renderMarkdownLite(text: string) {
  return text.split('\n').map((line, idx) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p key={idx} dangerouslySetInnerHTML={{ __html: html }} />;
  });
}
