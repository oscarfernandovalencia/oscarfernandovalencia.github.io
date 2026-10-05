/**
 * diseno_acero.js
 * Motor de Verificación y Optimización de Perfiles Tubulares HSS según AISC 360-16 / McCormac
 * Conectado con el catálogo dinámico de 56 perfiles (HSS_CATALOG).
 * Oscar Fernando Valencia — Ingeniero Civil
 */

let currentUnits = 'si'; // 'si' o 'imperial'
let currentProfileName = 'HSS6x6x3/16';

// Factores de Resistencia LRFD AISC 360-16
const PHI_T_YIELD = 0.90;
const PHI_T_RUPT = 0.75;
const PHI_C = 0.90;
const PHI_B = 0.90;
const PHI_V = 0.90;

document.addEventListener('DOMContentLoaded', () => {
  initSteelTabs();
  poblarSelectPerfiles();
  actualizarVerificacion();
  filtrarCatalogo();
  ejecutarOptimizacion();

  // Mobile menu toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
});

/* --- Tab System --- */
function initSteelTabs() {
  const tabs = document.querySelectorAll('.app-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('.app-tab-content').forEach(c => c.classList.remove('active'));
      const activeContent = document.getElementById(targetId);
      if (activeContent) {
        activeContent.classList.add('active');
        if (targetId === 'tab-optimizador') {
          ejecutarOptimizacion();
        } else if (targetId === 'tab-catalogo') {
          filtrarCatalogo();
        }
      }
    });
  });
}

/* --- Populate Profile Dropdown --- */
function poblarSelectPerfiles() {
  const sel = document.getElementById('selectProfile');
  if (!sel || typeof HSS_CATALOG === 'undefined') return;

  sel.innerHTML = '';
  const grpSHS = document.createElement('optgroup');
  grpSHS.label = '── Perfiles Cuadrados (SHS) ──';

  const grpRHS = document.createElement('optgroup');
  grpRHS.label = '── Perfiles Rectangulares (RHS) ──';

  for (const [name, p] of Object.entries(HSS_CATALOG)) {
    const opt = document.createElement('option');
    opt.value = name;
    const desc = `${name} (${p.H}"x${p.B}"x${p.t_nom}") - ${p.weight_kg_m} kg/m`;
    opt.textContent = desc;

    if (name === currentProfileName) {
      opt.selected = true;
    }

    if (p.is_square) {
      grpSHS.appendChild(opt);
    } else {
      grpRHS.appendChild(opt);
    }
  }

  sel.appendChild(grpSHS);
  sel.appendChild(grpRHS);
}

/* --- Unit Switching (SI vs Imperial) --- */
function setSteelUnits(unit) {
  if (currentUnits === unit) return;
  currentUnits = unit;

  const btnSI = document.getElementById('btnUnitSI');
  const btnImp = document.getElementById('btnUnitImp');

  const inLx = document.getElementById('inLx');
  const inLy = document.getElementById('inLy');
  const inPu = document.getElementById('inPu');
  const inMux = document.getElementById('inMux');
  const inMuy = document.getElementById('inMuy');
  const inVu = document.getElementById('inVu');

  if (unit === 'si') {
    btnSI.classList.add('active');
    btnImp.classList.remove('active');

    document.getElementById('uLx').textContent = '[m]';
    document.getElementById('uLy').textContent = '[m]';
    document.getElementById('uPu').textContent = '[kN]';
    document.getElementById('uMux').textContent = '[kN·m]';
    document.getElementById('uMuy').textContent = '[kN·m]';
    document.getElementById('uVu').textContent = '[kN]';

    // Convert from Imperial to SI
    inLx.value = (parseFloat(inLx.value) * 0.3048).toFixed(2);
    inLy.value = (parseFloat(inLy.value) * 0.3048).toFixed(2);
    inPu.value = (parseFloat(inPu.value) * 4.44822).toFixed(1);
    inMux.value = (parseFloat(inMux.value) * 1.35582).toFixed(1);
    inMuy.value = (parseFloat(inMuy.value) * 1.35582).toFixed(1);
    inVu.value = (parseFloat(inVu.value) * 4.44822).toFixed(1);
  } else {
    btnImp.classList.add('active');
    btnSI.classList.remove('active');

    document.getElementById('uLx').textContent = '[ft]';
    document.getElementById('uLy').textContent = '[ft]';
    document.getElementById('uPu').textContent = '[kips]';
    document.getElementById('uMux').textContent = '[kip·ft]';
    document.getElementById('uMuy').textContent = '[kip·ft]';
    document.getElementById('uVu').textContent = '[kips]';

    // Convert from SI to Imperial
    inLx.value = (parseFloat(inLx.value) / 0.3048).toFixed(2);
    inLy.value = (parseFloat(inLy.value) / 0.3048).toFixed(2);
    inPu.value = (parseFloat(inPu.value) / 4.44822).toFixed(1);
    inMux.value = (parseFloat(inMux.value) / 1.35582).toFixed(1);
    inMuy.value = (parseFloat(inMuy.value) / 1.35582).toFixed(1);
    inVu.value = (parseFloat(inVu.value) / 4.44822).toFixed(1);
  }

  actualizarVerificacion();
  filtrarCatalogo();
}

/* --- AISC 360-16 Member Verification Calculation --- */
function verificarMiembroAISC(profile, loads, steel, lengths) {
  // Normalize internal calculations to Imperial (standard AISC 360 units: ksi, in, kips)
  let Fy_ksi = 50.0;
  if (steel === 'A500-B') Fy_ksi = 46.0;
  else if (steel === 'A500-C' || steel === 'A1085') Fy_ksi = 50.0;

  const E_ksi = 29000.0;

  // Read loads in Imperial
  let Pu_kips = loads.Pu;
  let Mux_kip_in = loads.Mux * 12.0; // ft to in
  let Muy_kip_in = loads.Muy * 12.0;
  let Vu_kips = loads.Vu;

  let Lx_in = lengths.Lx * 12.0;
  let Ly_in = lengths.Ly * 12.0;
  let Kx = lengths.Kx;
  let Ky = lengths.Ky;

  if (currentUnits === 'si') {
    // Convert SI loads to Imperial for verification
    Pu_kips = loads.Pu / 4.44822;
    Mux_kip_in = (loads.Mux / 1.35582) * 12.0;
    Muy_kip_in = (loads.Muy / 1.35582) * 12.0;
    Vu_kips = loads.Vu / 4.44822;

    Lx_in = (lengths.Lx / 0.3048) * 12.0;
    Ly_in = (lengths.Ly / 0.3048) * 12.0;
  }

  const isTension = Pu_kips >= 0;
  const Pu_abs = Math.abs(Pu_kips);

  // 1. Tensión Axial (Cap. D)
  const Pn_yield = Fy_ksi * profile.A_in2;
  const phi_Pn_t_yield = PHI_T_YIELD * Pn_yield;
  const Fu_ksi = 1.30 * Fy_ksi;
  const Ae = profile.A_in2 * 0.85;
  const Pn_rupt = Fu_ksi * Ae;
  const phi_Pn_t_rupt = PHI_T_RUPT * Pn_rupt;
  const phi_Pn_t = Math.min(phi_Pn_t_yield, phi_Pn_t_rupt);
  const r_min = Math.min(profile.rx_in, profile.ry_in);
  const slenderness_t = (Lx_in / r_min);
  const dcr_t = phi_Pn_t > 0 ? (Pu_abs / phi_Pn_t) : 999;

  // 2. Compresión Axial y Pandeo (Cap. E)
  const KL_rx = (Kx * Lx_in) / profile.rx_in;
  const KL_ry = (Ky * Ly_in) / profile.ry_in;
  const KL_r = Math.max(KL_rx, KL_ry);

  // Esbeltez local patín y alma (Tabla B4.1a)
  const limit_local = 1.40 * Math.sqrt(E_ksi / Fy_ksi);
  const is_flange_slender = profile.b_t > limit_local;
  const is_web_slender = profile.h_t > limit_local;
  const is_locally_slender = is_flange_slender || is_web_slender;

  let Q = 1.0;
  if (is_locally_slender) {
    const b_eff = Math.min(1.0, limit_local / Math.max(profile.b_t, 0.001));
    const h_eff = Math.min(1.0, limit_local / Math.max(profile.h_t, 0.001));
    Q = Math.min(b_eff, h_eff);
  }

  const Fe = KL_r > 0 ? (Math.PI * Math.PI * E_ksi) / (KL_r * KL_r) : 1e6;
  const limit_inelastic = 4.71 * Math.sqrt(E_ksi / (Q * Fy_ksi));
  const rel_esfuerzos = (Q * Fy_ksi) / Fe;

  let Fcr = 0;
  let regime = 'Inelástico';
  if (KL_r <= limit_inelastic && rel_esfuerzos <= 2.25) {
    Fcr = Q * Math.pow(0.658, rel_esfuerzos) * Fy_ksi;
    regime = 'Inelástico';
  } else {
    Fcr = 0.877 * Fe;
    regime = 'Elástico';
  }

  const Pn_c = Fcr * profile.A_in2;
  const phi_Pn_c = PHI_C * Pn_c;
  const dcr_c = phi_Pn_c > 0 ? (Pu_abs / phi_Pn_c) : 999;

  // Capacidad axial gobernante
  const phi_Pn = isTension ? phi_Pn_t : phi_Pn_c;
  const dcr_axial = isTension ? dcr_t : dcr_c;

  // 3. Flexión en Eje Fuerte X (Cap. F7)
  const Mpx = Fy_ksi * profile.Zx_in3;
  const lambda_p_flange = 1.12 * Math.sqrt(E_ksi / Fy_ksi);
  const lambda_r_flange = 1.40 * Math.sqrt(E_ksi / Fy_ksi);

  let Mn_flb_x = Mpx;
  if (profile.b_t <= lambda_p_flange) {
    Mn_flb_x = Mpx; // Compacto
  } else if (profile.b_t <= lambda_r_flange) {
    Mn_flb_x = Mpx - (Mpx - Fy_ksi * profile.Sx_in3) * ((profile.b_t - lambda_p_flange) / (lambda_r_flange - lambda_p_flange));
  } else {
    Mn_flb_x = Fy_ksi * profile.Sx_in3 * (lambda_r_flange / profile.b_t);
  }

  const Mn_x = Math.min(Mpx, Mn_flb_x);
  const phi_Mnx_kip_in = PHI_B * Mn_x;
  const dcr_flex_x = phi_Mnx_kip_in > 0 ? (Math.abs(Mux_kip_in) / phi_Mnx_kip_in) : 999;

  // 4. Flexión en Eje Débil Y (Cap. F7)
  const Mpy = Fy_ksi * profile.Zy_in3;
  const Mn_y = Math.min(Mpy, Mn_flb_x); // Sección similar
  const phi_Mny_kip_in = PHI_B * Mn_y;
  const dcr_flex_y = phi_Mny_kip_in > 0 ? (Math.abs(Muy_kip_in) / phi_Mny_kip_in) : 999;

  // 5. Cortante (Cap. G4)
  const Aw_x = 2 * profile.H * profile.t_des;
  const Cv = 1.0; // Típico HSS con espesor estándar
  const Vn = 0.60 * Fy_ksi * Aw_x * Cv;
  const phi_Vn = PHI_V * Vn;
  const dcr_shear = phi_Vn > 0 ? (Math.abs(Vu_kips) / phi_Vn) : 999;

  // 6. Interacción Combinada Flexo-compresión (Cap. H1)
  let dcr_combined = 0;
  let formulaH1 = 'H1-1a';
  const axial_ratio = phi_Pn > 0 ? (Pu_abs / phi_Pn) : 999;

  if (axial_ratio >= 0.20) {
    formulaH1 = 'H1-1a (Pu/φPn ≥ 0.2)';
    dcr_combined = axial_ratio + (8.0 / 9.0) * (dcr_flex_x + dcr_flex_y);
  } else {
    formulaH1 = 'H1-1b (Pu/φPn < 0.2)';
    dcr_combined = (axial_ratio / 2.0) + (dcr_flex_x + dcr_flex_y);
  }

  // DCR Máximo y modo gobernante
  let dcr_max = Math.max(dcr_axial, dcr_flex_x, dcr_flex_y, dcr_shear, dcr_combined);
  let gov_mode = 'Flexo-compresión combinada';

  if (dcr_max === dcr_shear) gov_mode = 'Cortante (Cap. G4)';
  else if (dcr_max === dcr_flex_x) gov_mode = 'Flexión eje fuerte (Cap. F7)';
  else if (dcr_max === dcr_flex_y) gov_mode = 'Flexión eje débil (Cap. F7)';
  else if (dcr_max === dcr_axial) gov_mode = isTension ? 'Tensión axial (Cap. D)' : 'Compresión axial (Cap. E)';

  return {
    is_adequate: dcr_max <= 1.00,
    dcr_max: dcr_max,
    governing_mode: gov_mode,
    isTension: isTension,
    // Capacidades en sistema según currentUnits
    phi_Pn_raw: phi_Pn,
    phi_Mnx_raw: phi_Mnx_kip_in / 12.0,
    phi_Mny_raw: phi_Mny_kip_in / 12.0,
    phi_Vn_raw: phi_Vn,
    // DCRs individuales
    dcr_axial: dcr_axial,
    dcr_flex_x: dcr_flex_x,
    dcr_flex_y: dcr_flex_y,
    dcr_shear: dcr_shear,
    dcr_combined: dcr_combined,
    formulaH1: formulaH1,
    // Parámetros de compresión
    KL_r: KL_r,
    Q: Q,
    regime: regime,
    Fe: Fe,
    Fcr: Fcr,
    is_locally_slender: is_locally_slender
  };
}

/* --- Actualizar Verificación Completa y Renderizado --- */
function actualizarVerificacion() {
  const selProfile = document.getElementById('selectProfile').value;
  currentProfileName = selProfile;
  const profile = HSS_CATALOG[selProfile];
  if (!profile) return;

  const steel = document.getElementById('steelGrade').value;

  const loads = {
    Pu: parseFloat(document.getElementById('inPu').value) || 0,
    Mux: parseFloat(document.getElementById('inMux').value) || 0,
    Muy: parseFloat(document.getElementById('inMuy').value) || 0,
    Vu: parseFloat(document.getElementById('inVu').value) || 0
  };

  const lengths = {
    Lx: parseFloat(document.getElementById('inLx').value) || 3.0,
    Ly: parseFloat(document.getElementById('inLy').value) || 3.0,
    Kx: parseFloat(document.getElementById('inKx').value) || 1.0,
    Ky: parseFloat(document.getElementById('inKy').value) || 1.0
  };

  const res = verificarMiembroAISC(profile, loads, steel, lengths);

  // Actualizar UI
  const dcr = res.dcr_max;
  const numElem = document.getElementById('dcrValueNum');
  const badgeStatus = document.getElementById('dcrStatusBadge');
  const barFill = document.getElementById('dcrBarFill');
  const badgeAdecuado = document.getElementById('badgeAdecuado');

  numElem.textContent = dcr.toFixed(2);
  const fillPct = Math.min(100, Math.max(5, dcr * 100));
  barFill.style.width = `${fillPct}%`;

  if (dcr <= 0.70) {
    numElem.className = 'dcr-gauge-num status-safe';
    badgeStatus.className = 'dcr-gauge-status badge-safe';
    badgeStatus.textContent = 'DCR ≤ 0.70 • Seguro / Holgado';
    barFill.className = 'dcr-bar-fill bg-safe';
    badgeAdecuado.className = 'badge-safe';
    badgeAdecuado.textContent = 'ADECUADO';
  } else if (dcr <= 0.95) {
    numElem.className = 'dcr-gauge-num status-optimal';
    badgeStatus.className = 'dcr-gauge-status badge-optimal';
    badgeStatus.textContent = '0.70 < DCR ≤ 0.95 • Óptimo Eficiente';
    barFill.className = 'dcr-bar-fill bg-optimal';
    badgeAdecuado.className = 'badge-optimal';
    badgeAdecuado.textContent = 'ÓPTIMO EFICIENTE';
  } else if (dcr <= 1.00) {
    numElem.className = 'dcr-gauge-num status-warning';
    badgeStatus.className = 'dcr-gauge-status badge-warning';
    badgeStatus.textContent = '0.95 < DCR ≤ 1.00 • Al Límite Normativo';
    barFill.className = 'dcr-bar-fill bg-warning';
    badgeAdecuado.className = 'badge-warning';
    badgeAdecuado.textContent = 'AL LÍMITE (CUMPLE)';
  } else {
    numElem.className = 'dcr-gauge-num status-danger';
    badgeStatus.className = 'dcr-gauge-status badge-danger';
    badgeStatus.textContent = `DCR = ${dcr.toFixed(2)} > 1.00 • Sobreesforzado / Falla`;
    barFill.className = 'dcr-bar-fill bg-danger';
    badgeAdecuado.className = 'badge-danger';
    badgeAdecuado.textContent = 'FALLA / SOBREESFORZADO';
  }

  document.getElementById('dispGovMode').textContent = res.governing_mode;
  document.getElementById('dispWeight').textContent = `${profile.weight_kg_m} kg/m (${profile.weight_lb_ft} lb/ft)`;

  // Limit States Breakdown Values
  let uForce = currentUnits === 'si' ? 'kN' : 'kips';
  let uMoment = currentUnits === 'si' ? 'kN·m' : 'kip·ft';

  let phiPn_disp = currentUnits === 'si' ? (res.phi_Pn_raw * 4.44822).toFixed(1) : res.phi_Pn_raw.toFixed(1);
  let phiMnx_disp = currentUnits === 'si' ? (res.phi_Mnx_raw * 1.35582).toFixed(1) : res.phi_Mnx_raw.toFixed(1);
  let phiMny_disp = currentUnits === 'si' ? (res.phi_Mny_raw * 1.35582).toFixed(1) : res.phi_Mny_raw.toFixed(1);
  let phiVn_disp = currentUnits === 'si' ? (res.phi_Vn_raw * 4.44822).toFixed(1) : res.phi_Vn_raw.toFixed(1);

  if (res.isTension) {
    document.getElementById('nameAxial').textContent = 'Tracción Axial (Fluencia & Ruptura Neta)';
    document.getElementById('refAxial').textContent = `AISC Cap. D • Esbeltez L/r = ${(lengths.Lx * (currentUnits==='si'?100:12) / (profile.rx_cm)).toFixed(1)} ≤ 300`;
  } else {
    document.getElementById('nameAxial').textContent = 'Compresión Axial (Pandeo por Flexión & Local)';
    document.getElementById('refAxial').textContent = `AISC Cap. E • KL/r = ${res.KL_r.toFixed(1)} • Régimen ${res.regime} • Q = ${res.Q.toFixed(2)}`;
  }

  document.getElementById('dcrAxial').textContent = res.dcr_axial.toFixed(2);
  document.getElementById('capAxial').textContent = `φPn = ${phiPn_disp} ${uForce}`;

  document.getElementById('dcrFlexX').textContent = res.dcr_flex_x.toFixed(2);
  document.getElementById('capFlexX').textContent = `φMnx = ${phiMnx_disp} ${uMoment}`;

  document.getElementById('dcrFlexY').textContent = res.dcr_flex_y.toFixed(2);
  document.getElementById('capFlexY').textContent = `φMny = ${phiMny_disp} ${uMoment}`;

  document.getElementById('dcrShear').textContent = res.dcr_shear.toFixed(2);
  document.getElementById('capShear').textContent = `φVn = ${phiVn_disp} ${uForce}`;

  document.getElementById('dcrCombined').textContent = res.dcr_combined.toFixed(2);
  document.getElementById('refInter').textContent = `AISC Cap. ${res.formulaH1}`;

  // Dibujar Canvas 2D de la Sección HSS
  dibujarSeccionHSS(profile, dcr);
}

/* --- Canvas 2D Cross Section Drawing --- */
function dibujarSeccionHSS(profile, dcr) {
  const canvas = document.getElementById('canvasSection');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Escalar para ajustar al canvas
  const padding = 45;
  const maxDim = Math.max(profile.H, profile.B);
  const scale = (Math.min(w, h) - 2 * padding) / maxDim;

  const boxW = profile.B * scale;
  const boxH = profile.H * scale;
  const t = profile.t_nom * scale;

  const cx = w / 2;
  const cy = h / 2;
  const x0 = cx - boxW / 2;
  const y0 = cy - boxH / 2;

  // Radio de esquinas (aproximado 2*t exterior, 1*t interior para HSS)
  const rExt = Math.min(boxW / 4, 2 * t);
  const rInt = Math.max(2, rExt - t);

  // Color de acento según DCR
  let strokeColor = '#00f0ff';
  let fillColor = 'rgba(0, 240, 255, 0.12)';
  if (dcr <= 0.70) {
    strokeColor = '#00E676';
    fillColor = 'rgba(0, 230, 118, 0.15)';
  } else if (dcr <= 0.95) {
    strokeColor = '#76FF03';
    fillColor = 'rgba(118, 255, 3, 0.15)';
  } else if (dcr <= 1.00) {
    strokeColor = '#FFD600';
    fillColor = 'rgba(255, 214, 0, 0.15)';
  } else {
    strokeColor = '#FF1744';
    fillColor = 'rgba(255, 23, 68, 0.2)';
  }

  // Dibujar contorno exterior con esquinas redondeadas
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x0, y0, boxW, boxH, rExt);
  // Dibujar contorno interior (agujero)
  ctx.roundRect(x0 + t, y0 + t, boxW - 2 * t, boxH - 2 * t, rInt);
  ctx.fillStyle = fillColor;
  ctx.fill('evenodd');
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();
  ctx.restore();

  // Dibujar cotas exteriores y etiquetas
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';

  // Cota Superior (Ancho B)
  ctx.fillText(`B = ${profile.B}" (${(profile.B * 25.4).toFixed(0)} mm)`, cx, y0 - 10);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y0 - 4);
  ctx.lineTo(x0 + boxW, y0 - 4);
  ctx.stroke();

  // Cota Lateral (Altura H)
  ctx.save();
  ctx.translate(x0 - 15, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`H = ${profile.H}" (${(profile.H * 25.4).toFixed(0)} mm)`, 0, 0);
  ctx.restore();

  // Espesor t dentro de la sección
  ctx.fillStyle = strokeColor;
  ctx.font = 'bold 12px Space Grotesk, sans-serif';
  ctx.fillText(`${profile.name}`, cx, cy - 4);
  ctx.fillStyle = '#fff';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillText(`t = ${profile.t_nom}" (${(profile.t_nom * 25.4).toFixed(1)} mm)`, cx, cy + 12);
}

/* ==========================================================================
   2. ALGORITMO OPTIMIZADOR AUTOMÁTICO POR PESO MÍNIMO
   ========================================================================== */

function ejecutarOptimizacion() {
  const tbody = document.getElementById('optTableBody');
  if (!tbody || typeof HSS_CATALOG === 'undefined') return;

  tbody.innerHTML = '';

  const filterShape = document.getElementById('optFilterShape').value;
  const targetDCR = parseFloat(document.getElementById('optTargetDCR').value) || 0.95;

  const steel = document.getElementById('steelGrade').value;
  const loads = {
    Pu: parseFloat(document.getElementById('inPu').value) || 0,
    Mux: parseFloat(document.getElementById('inMux').value) || 0,
    Muy: parseFloat(document.getElementById('inMuy').value) || 0,
    Vu: parseFloat(document.getElementById('inVu').value) || 0
  };
  const lengths = {
    Lx: parseFloat(document.getElementById('inLx').value) || 3.0,
    Ly: parseFloat(document.getElementById('inLy').value) || 3.0,
    Kx: parseFloat(document.getElementById('inKx').value) || 1.0,
    Ky: parseFloat(document.getElementById('inKy').value) || 1.0
  };

  // Evaluar todos los perfiles del catálogo
  const candidatos = [];

  for (const [name, p] of Object.entries(HSS_CATALOG)) {
    if (filterShape === 'SHS' && !p.is_square) continue;
    if (filterShape === 'RHS' && p.is_square) continue;

    const res = verificarMiembroAISC(p, loads, steel, lengths);
    candidatos.push({
      profile: p,
      res: res
    });
  }

  // Filtrar perfiles que cumplen el DCR objetivo y ordenar por peso propio ascendente
  const cumplientes = candidatos.filter(c => c.res.dcr_max <= targetDCR);
  cumplientes.sort((a, b) => a.profile.weight_kg_m - b.profile.weight_kg_m);

  // Perfiles no cumplientes ordenados por DCR
  const noCumplientes = candidatos.filter(c => c.res.dcr_max > targetDCR);
  noCumplientes.sort((a, b) => a.res.dcr_max - b.res.dcr_max);

  const listaFinal = [...cumplientes, ...noCumplientes];

  // Mostrar el mejor candidato
  const optBestCard = document.getElementById('optBestCard');
  if (cumplientes.length > 0) {
    const best = cumplientes[0];
    optBestCard.style.display = 'flex';
    document.getElementById('optBestName').textContent = best.profile.name;
    document.getElementById('optBestDCR').textContent = `DCR = ${best.res.dcr_max.toFixed(2)}`;
    document.getElementById('optBestWeight').textContent = `${best.profile.weight_kg_m} kg/m (${best.profile.weight_lb_ft} lb/ft)`;
    document.getElementById('optBestMode').textContent = best.res.governing_mode;

    document.getElementById('btnSelectBest').onclick = () => {
      seleccionarPerfilEnVerificador(best.profile.name);
    };
  } else {
    optBestCard.style.display = 'none';
  }

  // Rellenar tabla
  listaFinal.forEach((item, index) => {
    const p = item.profile;
    const res = item.res;
    const dcr = res.dcr_max;
    const esOptimo = index === 0 && dcr <= targetDCR;

    let badgeClass = 'badge-safe';
    let estadoTxt = 'Cumple (Óptimo)';
    if (dcr > 1.00) {
      badgeClass = 'badge-danger';
      estadoTxt = 'Sobreesforzado';
    } else if (dcr > targetDCR) {
      badgeClass = 'badge-warning';
      estadoTxt = 'Excede Objetivo';
    } else if (dcr > 0.70) {
      badgeClass = 'badge-optimal';
      estadoTxt = 'Eficiente';
    }

    const tr = document.createElement('tr');
    if (esOptimo) {
      tr.style.background = 'rgba(0, 255, 136, 0.08)';
    }

    tr.innerHTML = `
      <td>${esOptimo ? '⭐ #1' : `#${index + 1}`}</td>
      <td class="highlight"><strong>${p.name}</strong></td>
      <td>${p.is_square ? 'Cuadrado (SHS)' : 'Rectangular (RHS)'}</td>
      <td><strong>${p.weight_kg_m}</strong> kg/m</td>
      <td>${p.weight_lb_ft} lb/ft</td>
      <td style="font-weight:700;" class="${dcr <= targetDCR ? 'status-safe' : 'status-danger'}">${dcr.toFixed(2)}</td>
      <td><span class="${badgeClass}" style="padding: 2px 6px; border-radius: 4px; font-size:0.75rem;">${estadoTxt}</span></td>
      <td style="font-size:0.78rem; color:var(--text-muted);">${res.governing_mode}</td>
      <td>
        <button type="button" class="btn-neon btn-neon-outline" style="padding: 4px 10px; font-size:0.75rem;" onclick="seleccionarPerfilEnVerificador('${p.name}')">
          Cargar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function seleccionarPerfilEnVerificador(profileName) {
  document.getElementById('selectProfile').value = profileName;
  document.querySelector('.app-tab-btn[data-tab="tab-verificador"]').click();
  actualizarVerificacion();
  showToast(`Perfil ${profileName} cargado en el verificador.`);
}

/* ==========================================================================
   3. CATÁLOGO DINÁMICO DE PERFILES HSS
   ========================================================================== */

function filtrarCatalogo() {
  const tbody = document.getElementById('catalogTableBody');
  if (!tbody || typeof HSS_CATALOG === 'undefined') return;

  const query = (document.getElementById('catalogSearch').value || '').toLowerCase().trim();
  const filterType = document.getElementById('catalogFilterType').value;

  tbody.innerHTML = '';
  let count = 0;

  for (const [name, p] of Object.entries(HSS_CATALOG)) {
    if (filterType === 'SHS' && !p.is_square) continue;
    if (filterType === 'RHS' && p.is_square) continue;

    if (query && !name.toLowerCase().includes(query) && !p.shape_type.toLowerCase().includes(query)) {
      continue;
    }

    count++;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="highlight"><strong>${p.name}</strong></td>
      <td>${p.is_square ? 'SHS' : 'RHS'}</td>
      <td>${p.H}" &times; ${p.B}"</td>
      <td>${p.t_nom}"</td>
      <td><strong>${p.weight_kg_m}</strong> kg/m</td>
      <td>${p.A_cm2}</td>
      <td>${p.Ix_cm4}</td>
      <td>${p.Sx_cm3}</td>
      <td>${p.Zx_cm3}</td>
      <td>${p.rx_cm}</td>
      <td style="color:${p.b_t > 30 ? 'var(--neon-amber)' : 'inherit'};">${p.b_t}</td>
      <td style="color:${p.h_t > 30 ? 'var(--neon-amber)' : 'inherit'};">${p.h_t}</td>
      <td>
        <button type="button" class="btn-neon btn-neon-primary" style="padding: 3px 8px; font-size:0.75rem;" onclick="seleccionarPerfilEnVerificador('${p.name}')">
          Usar
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  document.getElementById('catalogCountBadge').textContent = `${count} Perfiles Encontrados`;
}

/* ==========================================================================
   4. EXPORTACIÓN Y MEMORIA TÉCNICA
   ========================================================================== */

function showToast(text) {
  const toast = document.getElementById('neonToast');
  const toastText = document.getElementById('toastText');
  if (!toast) return;

  toastText.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function generarTextoMemoria() {
  const profileName = document.getElementById('selectProfile').value;
  const p = HSS_CATALOG[profileName];
  const steel = document.getElementById('steelGrade').value;
  const dcr = document.getElementById('dcrValueNum').textContent;
  const gov = document.getElementById('dispGovMode').textContent;

  return `
============================================================
MEMORIA DE CÁLCULO ESTRUCTURAL DE ACERO AISC 360-16 / LRFD
Diseñador de Secciones Tubulares HSS (McCormac)
Ing. Oscar Fernando Valencia Escobar — Universidad de Antioquia
Fecha: ${new Date().toLocaleString()}
============================================================

1. DATOS DEL MIEMBRO:
   - Perfil HSS: ${p.name} (${p.H}" x ${p.B}" x ${p.t_nom}")
   - Tipo de Sección: ${p.is_square ? 'Cuadrada (SHS)' : 'Rectangular (RHS)'}
   - Norma del Acero: ${steel}
   - Peso Propio: ${p.weight_kg_m} kg/m (${p.weight_lb_ft} lb/ft)
   - Área Bruta: ${p.A_cm2} cm² (${p.A_in2} in²)
   - Inercias: Ix = ${p.Ix_cm4} cm⁴, Iy = ${p.Iy_cm4} cm⁴
   - Radios de Giro: rx = ${p.rx_cm} cm, ry = ${p.ry_cm} cm
   - Módulos Plásticos: Zx = ${p.Zx_cm3} cm³, Zy = ${p.Zy_cm3} cm³
   - Esbeltez Local: b/t = ${p.b_t}, h/t = ${p.h_t}

2. SOLICITACIONES DE DISEÑO FACTORIZADAS (LRFD):
   - Carga Axial Pu: ${document.getElementById('inPu').value} ${currentUnits==='si'?'kN':'kips'}
   - Momento Mux: ${document.getElementById('inMux').value} ${currentUnits==='si'?'kN·m':'kip·ft'}
   - Momento Muy: ${document.getElementById('inMuy').value} ${currentUnits==='si'?'kN·m':'kip·ft'}
   - Cortante Vu: ${document.getElementById('inVu').value} ${currentUnits==='si'?'kN':'kips'}
   - Longitud no arriostrada: Lx = ${document.getElementById('inLx').value}, Ly = ${document.getElementById('inLy').value}

3. ESTADOS LÍMITE Y VERIFICACIONES AISC 360-16:
   - Carga Axial: DCR = ${document.getElementById('dcrAxial').textContent} (${document.getElementById('capAxial').textContent})
   - Flexión Eje Fuerte: DCR = ${document.getElementById('dcrFlexX').textContent} (${document.getElementById('capFlexX').textContent})
   - Flexión Eje Débil: DCR = ${document.getElementById('dcrFlexY').textContent} (${document.getElementById('capFlexY').textContent})
   - Cortante: DCR = ${document.getElementById('dcrShear').textContent} (${document.getElementById('capShear').textContent})
   - Interacción Flexo-Compresión: DCR = ${document.getElementById('dcrCombined').textContent}

4. RESULTADO FINAL DE EVALUACIÓN:
   - RATIO DEMANDA / CAPACIDAD GOBERNANTE: DCR Max = ${dcr}
   - ESTADO NORMATIVO: ${parseFloat(dcr) <= 1.0 ? 'CUMPLE SATISFACTORIAMENTE (ADECUADO)' : 'NO CUMPLE (SOBREESFORZADO / FALLA)'}
   - MODO CRÍTICO GOBERNANTE: ${gov}
============================================================
Generado en: https://oscarfernandovalencia.github.io/diseno-acero.html
`;
}

function copiarReporteAcero() {
  const texto = generarTextoMemoria();
  navigator.clipboard.writeText(texto.trim()).then(() => {
    showToast('¡Memoria de cálculo copiada al portapapeles!');
  });
}

function descargarMemoriaTXT() {
  const texto = generarTextoMemoria();
  const profileName = document.getElementById('selectProfile').value;
  const filename = `memoria_acero_${profileName}_${new Date().toISOString().slice(0, 10)}.txt`;

  const blob = new Blob([texto.trim()], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Memoria técnica descargada en TXT.');
}
