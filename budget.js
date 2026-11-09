const KEY = 'sprout-budget-v1';
const form = document.querySelector('#entry-form');

let entries = [];

try {
  const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (Array.isArray(stored)) entries = stored;
} catch {
  entries = [];
}

const money = value =>
  `${new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)} ብር`;

const monthKey = date => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthName = key => {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, 1));
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(entries));
}

function updateMonths() {
  const select = document.querySelector('#month-filter');
  const prior = select.value;

  const months = [
    ...new Set([
      monthKey(new Date()),
      ...entries.map(entry => monthKey(entry.date))
    ])
  ].sort().reverse();

  select.replaceChildren();

  for (const key of months) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = monthName(key);
    select.append(option);
  }

  select.value = months.includes(prior) ? prior : monthKey(new Date());
}

function render() {
  updateMonths();

  const chosen = document.querySelector('#month-filter').value;
  const visible = entries.filter(entry => monthKey(entry.date) === chosen);

  const income = visible
    .filter(entry => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const spent = visible
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  document.querySelector('#balance').textContent = money(income - spent);
  document.querySelector('#balance-note').textContent =
    income - spent < 0
      ? 'Spending is above income'
      : 'Income minus expenses';
  document.querySelector('#income').textContent = money(income);
  document.querySelector('#spent').textContent = money(spent);

  const container = document.querySelector('#transactions');
  container.replaceChildren();
  document.querySelector('#empty').classList.toggle('show', visible.length === 0);

  for (const entry of visible) {
    const row = document.createElement('article');
    row.className = 'entry';

    const dot = document.createElement('span');
    dot.className = `dot ${entry.type}`;
    dot.textContent = entry.type === 'income' ? '↗' : '↘';

    const name = document.createElement('div');
    name.className = 'entry-name';

    const title = document.createElement('strong');
    title.textContent = entry.description;

    const meta = document.createElement('small');
    meta.textContent =
      `${entry.category} · ${new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric'
      }).format(new Date(entry.date))}`;

    name.append(title, meta);

    const amount = document.createElement('strong');
    amount.className = `entry-amount ${entry.type}`;
    amount.textContent =
      `${entry.type === 'income' ? '+' : '−'}${money(entry.amount)}`;

    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Delete ${entry.description}`);
    remove.addEventListener('click', () => {
      entries = entries.filter(item => item.id !== entry.id);
      save();
      render();
    });

    row.append(dot, name, amount, remove);
    container.append(row);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();

  const description = document.querySelector('#description').value.trim();
  const amount = Number(document.querySelector('#amount').value);

  if (!description || !Number.isFinite(amount) || amount <= 0) return;

  entries.unshift({
    id: crypto.randomUUID(),
    description,
    amount,
    type: document.querySelector('#type').value,
    category: document.querySelector('#category').value,
    date: new Date().toISOString()
  });

  save();
  form.reset();
  render();
});

document.querySelector('#month-filter').addEventListener('change', render);

render();
