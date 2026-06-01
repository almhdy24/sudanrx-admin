export default function MarkdownCheatsheet() {
  const rows = [
    { syntax: '# Heading 1', result: '<h1>Heading 1</h1>' },
    { syntax: '## Heading 2', result: '<h2>Heading 2</h2>' },
    { syntax: '**bold**', result: '<strong>bold</strong>' },
    { syntax: '*italic*', result: '<em>italic</em>' },
    { syntax: '[link](url)', result: '<a href="url">link</a>' },
    { syntax: '![alt](url)', result: '<img src="url" alt="alt">' },
    { syntax: '- list item', result: 'Unordered list' },
    { syntax: '1. ordered', result: 'Ordered list' },
    { syntax: '> blockquote', result: '<blockquote>quote</blockquote>' },
    { syntax: '`code`', result: '<code>code</code>' },
  ];

  return (
    <table className="table is-fullwidth is-striped">
      <thead>
        <tr><th>Markdown</th><th>Result</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td><code>{r.syntax}</code></td>
            <td dangerouslySetInnerHTML={{ __html: r.result }} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
