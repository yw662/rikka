import { defineElement } from "@rikka/elements";
import { css, div, h1, h2, p, a, span, button, input, For } from "@rikka/dom";
import { sharedStyles, examplePageStyles } from "../../shared/styles";

const styles = css`
  ${examplePageStyles}
`;

const collaborationCode = `const team = store([
  { id: 1, name: 'Rikka', role: 'developer', avatar: '\uD83D\uDC69\uD83D\uDCBB', status: 'online', message: 'Working on UI...' },
  { id: 2, name: 'Takanashi', role: 'designer', avatar: '\uD83D\uDC69\uD83C\uDFA8', status: 'away', message: 'Creating mockups' },
  { id: 3, name: 'Sakura', role: 'manager', avatar: '\uD83D\uDC69\uD83D\uDCBC', status: 'online', message: 'Reviewing PRs' },
  { id: 4, name: 'Mika', role: 'developer', avatar: '\uD83D\uDC69\uD83D\uDCBB', status: 'offline', message: '' },
  { id: 5, name: 'Yui', role: 'designer', avatar: '\uD83D\uDC69\uD83C\uDFA8', status: 'online', message: 'Sketching ideas' },
]);

const selectedRole = signal('all');
const messages = signal([]);
const messageInput = signal('');

const filteredTeam = computed(() => {
  const role = selectedRole.get();
  if (role === 'all') return team;
  return team.filter(m => m.role === role);
});

const onlineCount = computed(() =>
  filteredTeam.get().filter(m => m.status === 'online').length
);

const statusColor = (status) => {
  if (status === 'online') return '#4ade80';
  if (status === 'away') return '#facc15';
  return '#6b7280';
};

effect(() => {
  const interval = setInterval(() => {
    const idx = Math.floor(Math.random() * team.length);
    const statuses = ['online', 'away', 'offline'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    team[idx].status = newStatus;
  }, 3000 + Math.random() * 2000);
  return () => clearInterval(interval);
});

const sendMessage = () => {
  const text = messageInput.get().trim();
  if (!text) return;
  messages.set([...messages.get(), { from: 'You', text, time: new Date().toLocaleTimeString() }]);
  messageInput.set('');
};

const app = div(
  { style: { maxWidth: '500px' } },
  h1({ style: { color: '#e2e8f0', marginBottom: '0.5rem' } }, 'Team Collaboration'),
  div({ style: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' } },
    button({
      style: () => ({ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', background: selectedRole.get() === 'all' ? '#6366f1' : '#1e293b', color: selectedRole.get() === 'all' ? 'white' : '#94a3b8' }),
      onclick: () => selectedRole.set('all')
    }, 'All'),
    button({
      style: () => ({ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', background: selectedRole.get() === 'developer' ? '#6366f1' : '#1e293b', color: selectedRole.get() === 'developer' ? 'white' : '#94a3b8' }),
      onclick: () => selectedRole.set('developer')
    }, 'Developer'),
    button({
      style: () => ({ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', background: selectedRole.get() === 'designer' ? '#6366f1' : '#1e293b', color: selectedRole.get() === 'designer' ? 'white' : '#94a3b8' }),
      onclick: () => selectedRole.set('designer')
    }, 'Designer'),
    button({
      style: () => ({ padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', background: selectedRole.get() === 'manager' ? '#6366f1' : '#1e293b', color: selectedRole.get() === 'manager' ? 'white' : '#94a3b8' }),
      onclick: () => selectedRole.set('manager')
    }, 'Manager'),
    span({ style: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem' } },
      'Online: ',
      span({ style: { color: '#4ade80', fontWeight: '600' } }, onlineCount)
    )
  ),
  div({ style: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' } },
    For(filteredTeam, (member) =>
      div({ style: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#252542', borderRadius: '0.75rem' } },
        span({ style: { fontSize: '2rem' } }, member.avatar),
        div({ style: { flex: '1' } },
          div({ style: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' } },
            span({ style: { fontWeight: '600', color: '#e2e8f0' } }, member.name),
            span({ style: { width: '8px', height: '8px', borderRadius: '50%', background: () => statusColor(member.status) } }),
            span({ style: { fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' } }, member.status),
            span({ style: { color: '#64748b', fontSize: '0.75rem' } }, '|'),
            span({ style: { fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' } }, member.role)
          ),
          member.message ? span({ style: { fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic' } }, '"' + member.message + '"') : null
        )
      )
    )
  ),
  div({ style: { display: 'flex', gap: '0.5rem' } },
    input({
      type: 'text',
      placeholder: 'Type a message...',
      value: messageInput,
      style: { flex: '1', padding: '0.75rem', background: '#0f0f1a', border: '1px solid #334155', borderRadius: '0.5rem', color: '#e2e8f0', fontSize: '1rem' },
      onkeypress: (e) => { if (e.key === 'Enter') sendMessage(); }
    }),
    button({
      onclick: sendMessage,
      style: { padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }
    }, 'Send')
  ),
  Show(computed(() => messages.get().length > 0),
    div({ style: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' } },
      For(messages, (msg) =>
        div({ style: { padding: '0.75rem', background: '#1e293b', borderRadius: '0.5rem', fontSize: '0.875rem' } },
          span({ style: { color: '#a5b4fc', fontWeight: '500' } }, msg.from),
          span({ style: { color: '#64748b' } }, ': ' + msg.text),
          span({ style: { color: '#475569', fontSize: '0.75rem', marginLeft: '0.5rem' } }, msg.time)
        )
      )
    )
  ),
  div({ style: { marginTop: '1.5rem', color: '#64748b', fontSize: '0.75rem' } }, 'Status changes randomly every 3-5 seconds')
);

container.appendChild(app);`;

const ExampleCollaboration = defineElement("rikka-example-collaboration", {
  styles,
  render() {
    return div(
      { class: "example-page" },
      h1("Team Collaboration Simulator"),
      p(
        "Reactive team member list with role filtering, online status tracking, and real-time messaging.",
      ),
      div(
        { class: "playground-container" },
        sharedStyles.createPlayground(
          collaborationCode,
          "600",
          "Team Collaboration Example",
        ),
      ),
      div(
        { class: "explanation" },
        h2("Key Concepts"),
        p(
          sharedStyles.inlineCode("store([...])"),
          " creates a deeply reactive store for the team members array — mutations to nested properties trigger updates.",
        ),
        p(
          sharedStyles.inlineCode("computed(() => ...)"),
          " derives filtered team members based on selected role, and calculates online count.",
        ),
        p(
          sharedStyles.inlineCode("effect(() => { setInterval(...) })"),
          " runs a background interval that randomly changes team member status every 3-5 seconds.",
        ),
        p(
          sharedStyles.inlineCode("For(filteredTeam, (member) => ...)"),
          " efficiently renders the member list with fine-grained reactivity.",
        ),
        p(
          "Message composition uses a separate signal and spread operator to append new messages.",
        ),
      ),
      div(
        { class: "example-nav" },
        a(
          { href: "#/examples/mini-ide", class: "prev-link" },
          "\u2190 Mini IDE",
        ),
        div({ class: "spacer" }),
      ),
    );
  },
});

export { ExampleCollaboration };
