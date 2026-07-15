(function(){
  const app = document.getElementById('app');
  const LOGO_SRC = "logo.png";

  function getParam(name){ return new URLSearchParams(window.location.search).get(name); }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function gradYearOptions(){
    const now = new Date().getFullYear();
    let opts = '<option value="" disabled selected>Select year</option>';
    for(let y=now; y<=now+6; y++){ opts += `<option value="${y}">${y}</option>`; }
    return opts;
  }

  const EVENT_OPTIONS = ['Gobblerfest', 'Atrium Day 1', 'Atrium Day 2', 'Deep Dive', 'Other'];

  function eventOptions(preselect){
    let opts = '<option value="" disabled selected>Select event</option>';
    EVENT_OPTIONS.forEach(ev=>{
      const sel = ev === preselect ? ' selected' : '';
      opts += `<option value="${escapeHtml(ev)}"${sel}>${escapeHtml(ev)}</option>`;
    });
    return opts;
  }

  // Paste your deployed Google Apps Script Web App URL here (ends in /exec).
  // See apps-script-backend.gs for the one-time setup steps.
  const API_URL = 'https://script.google.com/macros/s/AKfycbw0tnhUVq8RzdfOWAPexFEo1NG5GEj5lpCQruF8kIMyN-X9rabpLxjSY0qmvrV5_xhE/exec';

  async function loadSubmissions(){
    try{
      const res = await fetch(API_URL);
      if(!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    }catch(e){
      console.error('Failed to load submissions:', e);
      return [];
    }
  }

  async function saveSubmission(entry){
    const res = await fetch(API_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight that Apps Script does not handle well.
      // The body is still JSON — Apps Script parses it as JSON on the other end.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry)
    });
    if(!res.ok) throw new Error('Storage write failed');
    return res.json();
  }

  function renderForm(){
    const eventFromUrl = getParam('event');
    const preselect = EVENT_OPTIONS.includes(eventFromUrl) ? eventFromUrl : null;

    app.innerHTML = `
      <div class="shell">
        <header class="top">
          <a class="site-link" href="https://www.vtprism.com" target="_blank" rel="noopener">vtprism.com &#8599;</a>
          <img class="logo-mark" src="${LOGO_SRC}" alt="PRISM logo" />
          <div class="eyebrow" style="margin-top:18px;">This is PRISM</div>
          <h1 class="title">Join the PRISMites</h1>
          <div class="rule"></div>
          <p class="subtitle">Faculty-led, student-run. PRISM works with real clients &mdash; VT Undergraduate Admissions, Pamplin College of Business, First & Main, and more. Sign up below and we'll follow up by email.</p>
        </header>

        <div class="card">
          <form id="signup-form" novalidate>
            <div class="field" data-field="name">
              <label for="f-name">Full name</label>
              <input id="f-name" type="text" placeholder="Jordan Ellis" autocomplete="name" />
              <div class="err-msg">Enter your name.</div>
            </div>

            <div class="field" data-field="email">
              <label for="f-email">Email</label>
              <input id="f-email" type="email" placeholder="jordan@vt.edu" autocomplete="email" />
              <div class="err-msg">Enter a valid email.</div>
            </div>

            <div class="field" data-field="major">
              <label for="f-major">Major</label>
              <input id="f-major" type="text" placeholder="Marketing, Finance, CS, ..." />
              <div class="err-msg">Enter your major.</div>
            </div>

            <div class="field" data-field="gradYear">
              <label for="f-gradyear">Graduation year</label>
              <select id="f-gradyear">${gradYearOptions()}</select>
              <div class="err-msg">Select your graduation year.</div>
            </div>

            <div class="field" data-field="event">
              <label for="f-event-select">What event did you attend?</label>
              <select id="f-event-select">${eventOptions(preselect)}</select>
              <div class="err-msg">Select an event.</div>
            </div>

            <div class="field" data-field="eventOther" id="event-other-wrap" style="display:none;">
              <label for="f-event-other">Tell us the event name</label>
              <input id="f-event-other" type="text" placeholder="Event name" />
              <div class="err-msg">Enter the event name.</div>
            </div>

            <button type="submit" class="submit" id="submit-btn">Sign up</button>
          </form>
        </div>

        <footer class="foot">
          <div class="org-line">A Virginia Tech Pamplin College of Business Organization</div>
          
        </footer>
      </div>
    `;

    const eventSelect = document.getElementById('f-event-select');
    const otherWrap = document.getElementById('event-other-wrap');
    const otherInput = document.getElementById('f-event-other');

    function syncOtherVisibility(){
      if(eventSelect.value === 'Other'){
        otherWrap.style.display = 'block';
      }else{
        otherWrap.style.display = 'none';
        otherWrap.classList.remove('error');
        otherInput.value = '';
      }
    }
    syncOtherVisibility();
    eventSelect.addEventListener('change', syncOtherVisibility);

    const form = document.getElementById('signup-form');
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();

      const name = document.getElementById('f-name').value.trim();
      const email = document.getElementById('f-email').value.trim();
      const major = document.getElementById('f-major').value.trim();
      const gradYear = document.getElementById('f-gradyear').value;
      const eventChoice = eventSelect.value;
      const eventOther = otherInput.value.trim();

      const errors = {};
      if(!name) errors.name = true;
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = true;
      if(!major) errors.major = true;
      if(!gradYear) errors.gradYear = true;
      if(!eventChoice) errors.event = true;
      if(eventChoice === 'Other' && !eventOther) errors.eventOther = true;

      document.querySelectorAll('.field').forEach(f=>f.classList.remove('error'));
      Object.keys(errors).forEach(key=>{
        const el = document.querySelector(`.field[data-field="${key}"]`);
        if(el) el.classList.add('error');
      });
      if(Object.keys(errors).length > 0) return;

      const eventVal = eventChoice === 'Other' ? eventOther : eventChoice;

      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      const entry = {
        id: Date.now() + '-' + Math.random().toString(36).slice(2,8),
        name, email, major,
        gradYear: gradYear,
        event: eventVal,
        timestamp: new Date().toISOString()
      };

      try{
        await saveSubmission(entry);
        renderSuccess(eventVal);
      }catch(err){
        btn.disabled = false;
        btn.textContent = 'Sign up';
        alert('Something went wrong saving your info. Please try again.');
      }
    });
  }

  function renderSuccess(eventName){
    app.innerHTML = `
      <div class="shell">
        <header class="top">
          <img class="logo-mark" src="${LOGO_SRC}" alt="PRISM logo" />
        </header>
        <div class="card success">
          <div class="icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12L10 18L20 6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h2>You're in the spectrum</h2>
          <p>Thanks for signing up at ${escapeHtml(eventName)}. PRISM will be in touch by email soon.</p>
          <button id="again-btn">Add another signup</button>
        </div>
        <footer class="foot">
          <div class="org-line">A Virginia Tech Pamplin College of Business Organization</div>
          <a href="#dashboard">Team dashboard</a>
        </footer>
      </div>
    `;
    document.getElementById('again-btn').addEventListener('click', renderForm);
  }

  async function renderDashboard(){
    app.innerHTML = `
      <div class="dash-shell">
        <div class="eyebrow">Internal</div>
        <div class="dash-head">
          <div>
            <h1>Recruitment dashboard</h1>
            <p>All signups collected across events, stored for the PRISM team.</p>
          </div>
          <div class="dash-actions">
            <button class="btn-ghost" id="refresh-btn">Refresh</button>
            <button class="btn-ghost" id="export-btn">Export CSV</button>
            <a class="btn-ghost" href="#" style="text-decoration:none; display:inline-flex; align-items:center;">Back to form</a>
          </div>
        </div>
        <div class="rule left"></div>
        <div id="dash-body" class="loading-note">Loading submissions&hellip;</div>
      </div>
    `;
    document.querySelector('.dash-actions a').addEventListener('click', (e)=>{
      e.preventDefault(); window.location.hash = '';
    });
    document.getElementById('refresh-btn').addEventListener('click', renderDashboard);

    const submissions = await loadSubmissions();
    const events = Array.from(new Set(submissions.map(s=>s.event))).sort();

    document.getElementById('export-btn').addEventListener('click', ()=>{ exportCsv(submissions); });

    const body = document.getElementById('dash-body');
    body.className = '';
    body.innerHTML = `
      <div class="stat-row">
        <div class="stat"><div class="num">${submissions.length}</div><div class="label">Total signups</div></div>
        <div class="stat"><div class="num">${events.length}</div><div class="label">Events represented</div></div>
        <div class="stat"><div class="num">${new Set(submissions.map(s=>s.major)).size}</div><div class="label">Distinct majors</div></div>
      </div>
      <div class="filter-row">
        <select id="event-filter">
          <option value="">All events</option>
          ${events.map(e=>`<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join('')}
        </select>
        <input id="search-box" type="text" placeholder="Search name or email..." style="min-width:200px;" />
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Major</th><th>Grad Year</th><th>Event</th><th>Timestamp</th></tr>
          </thead>
          <tbody id="rows"></tbody>
        </table>
      </div>
    `;

    function renderRows(){
      const filterEvent = document.getElementById('event-filter').value;
      const search = document.getElementById('search-box').value.toLowerCase();
      let rows = submissions.slice().sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp));
      if(filterEvent) rows = rows.filter(r=>r.event === filterEvent);
      if(search) rows = rows.filter(r=> r.name.toLowerCase().includes(search) || r.email.toLowerCase().includes(search));

      const tbody = document.getElementById('rows');
      if(rows.length === 0){
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No submissions yet. Share the form link to start collecting signups.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map(r=>`
        <tr>
          <td>${escapeHtml(r.name)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.major)}</td>
          <td>${escapeHtml(r.gradYear)}</td>
          <td>${escapeHtml(r.event)}</td>
          <td class="ts">${new Date(r.timestamp).toLocaleString()}</td>
        </tr>
      `).join('');
    }
    renderRows();
    document.getElementById('event-filter').addEventListener('change', renderRows);
    document.getElementById('search-box').addEventListener('input', renderRows);
  }

  function exportCsv(submissions){
    const headers = ['Name','Email','Major','Graduation Year','Event','Timestamp'];
    const lines = [headers.join(',')];
    submissions.forEach(r=>{
      const row = [r.name, r.email, r.major, r.gradYear, r.event, r.timestamp]
        .map(v => `"${String(v).replace(/"/g,'""')}"`);
      lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prism-signups-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function route(){
    if(window.location.hash === '#dashboard'){ renderDashboard(); }
    else{ renderForm(); }
  }

  window.addEventListener('hashchange', route);
  route();
})();
