/**
 * calculadora_concreto.js
 * Motor de cálculo volumétrico y cuantías para Concreto, Mortero y Acero
 * Basado y optimizado a partir de concreto_app.py
 * Oscar Fernando Valencia — Ingeniero Civil
 */

const VOLUMEN_LATA_M3 = 0.01892705; // 5 Galones US (18.927 L)
const DENSIDAD_CEMENTO_KG_M3 = 1440;
const PESO_BULTO_KG = 50;

// Variables de estado
let volumeMode = 'direct';
let currentElementType = 'losa';

// Datos de varillas normalizadas ASTM / NTC 2289
const REBAR_DATA = [
  { num: 2, diam_in: '1/4"', diam_dec: 0.250, diam_mm: 6.4, masa: 0.250, area: 32 },
  { num: 3, diam_in: '3/8"', diam_dec: 0.375, diam_mm: 9.5, masa: 0.560, area: 71 },
  { num: 4, diam_in: '1/2"', diam_dec: 0.500, diam_mm: 12.7, masa: 0.994, area: 129 },
  { num: 5, diam_in: '5/8"', diam_dec: 0.625, diam_mm: 15.9, masa: 1.552, area: 199 },
  { num: 6, diam_in: '3/4"', diam_dec: 0.750, diam_mm: 19.1, masa: 2.235, area: 284 },
  { num: 7, diam_in: '7/8"', diam_dec: 0.875, diam_mm: 22.2, masa: 3.042, area: 387 },
  { num: 8, diam_in: '1"', diam_dec: 1.000, diam_mm: 25.4, masa: 3.973, area: 510 },
  { num: 9, diam_in: '1-1/8"', diam_dec: 1.128, diam_mm: 28.7, masa: 5.060, area: 645 },
  { num: 10, diam_in: '1-1/4"', diam_dec: 1.270, diam_mm: 32.3, masa: 6.404, area: 819 },
  { num: 11, diam_in: '1-3/8"', diam_dec: 1.410, diam_mm: 35.8, masa: 7.907, area: 1006 }
];

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar pestañas superiores
  initTabs();

  // Inicializar cálculos por defecto
  calcularConcreto();
  calcularMortero();
  calcularTarreo();
  calcularAceroHuella();
  initRebarTable();
  mostrarPropVarilla();

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
function initTabs() {
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
      }
    });
  });
}

/* ==========================================================================
   1. CÁLCULO PRINCIPAL: CONCRETO (ARENA, CEMENTO, TRITURADO)
   ========================================================================== */

function setVolumeMode(mode) {
  volumeMode = mode;
  const btnDirect = document.getElementById('btnModeDirect');
  const btnGeom = document.getElementById('btnModeGeom');
  const boxDirect = document.getElementById('boxDirectVolume');
  const boxGeom = document.getElementById('boxGeomVolume');

  if (mode === 'direct') {
    btnDirect.classList.add('active');
    btnGeom.classList.remove('active');
    boxDirect.style.display = 'block';
    boxGeom.style.display = 'none';
  } else {
    btnGeom.classList.add('active');
    btnDirect.classList.remove('active');
    boxDirect.style.display = 'none';
    boxGeom.style.display = 'block';
    recalcGeomVolume();
  }
  calcularConcreto();
}

function setElementType(type, btn) {
  currentElementType = type;
  document.querySelectorAll('#boxGeomVolume .element-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const lbl1 = document.getElementById('lblDim1');
  const lbl2 = document.getElementById('lblDim2');
  const lbl3 = document.getElementById('lblDim3');

  if (type === 'losa') {
    lbl1.textContent = 'Largo [m]';
    lbl2.textContent = 'Ancho [m]';
    lbl3.textContent = 'Espesor [m]';
    document.getElementById('dim1').value = '4.0';
    document.getElementById('dim2').value = '3.0';
    document.getElementById('dim3').value = '0.10';
  } else if (type === 'viga') {
    lbl1.textContent = 'Longitud [m]';
    lbl2.textContent = 'Base [m]';
    lbl3.textContent = 'Peralte / Altura [m]';
    document.getElementById('dim1').value = '5.0';
    document.getElementById('dim2').value = '0.30';
    document.getElementById('dim3').value = '0.40';
  } else if (type === 'columna') {
    lbl1.textContent = 'Lado X [m]';
    lbl2.textContent = 'Lado Y [m]';
    lbl3.textContent = 'Altura Libre [m]';
    document.getElementById('dim1').value = '0.35';
    document.getElementById('dim2').value = '0.35';
    document.getElementById('dim3').value = '2.80';
  } else if (type === 'zapata') {
    lbl1.textContent = 'Largo Zapata [m]';
    lbl2.textContent = 'Ancho Zapata [m]';
    lbl3.textContent = 'Peralte Zapata [m]';
    document.getElementById('dim1').value = '1.20';
    document.getElementById('dim2').value = '1.20';
    document.getElementById('dim3').value = '0.35';
  }
  recalcGeomVolume();
}

function recalcGeomVolume() {
  const d1 = parseFloat(document.getElementById('dim1').value) || 0;
  const d2 = parseFloat(document.getElementById('dim2').value) || 0;
  const d3 = parseFloat(document.getElementById('dim3').value) || 0;
  const cant = parseFloat(document.getElementById('dimCant').value) || 1;

  const vol = d1 * d2 * d3 * cant;
  document.getElementById('lblGeomCalc').textContent = vol.toFixed(3);
  calcularConcreto();
}

function setProporcionPreset(c, a, g, fc, btn) {
  document.querySelectorAll('#tab-concreto .preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('propC').value = c;
  document.getElementById('propA').value = a;
  document.getElementById('propG').value = g;

  document.getElementById('badgeResistencia').textContent = fc;
  calcularConcreto();
}

function customProporcionChange() {
  document.querySelectorAll('#tab-concreto .preset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('badgeResistencia').textContent = 'Dosificación Personalizada';
  calcularConcreto();
}

function calcularConcreto() {
  let volNeto = 0;
  if (volumeMode === 'direct') {
    volNeto = parseFloat(document.getElementById('inputVolumenDirecto').value) || 0;
  } else {
    const d1 = parseFloat(document.getElementById('dim1').value) || 0;
    const d2 = parseFloat(document.getElementById('dim2').value) || 0;
    const d3 = parseFloat(document.getElementById('dim3').value) || 0;
    const cant = parseFloat(document.getElementById('dimCant').value) || 1;
    volNeto = d1 * d2 * d3 * cant;
  }

  if (volNeto <= 0) return;

  const pC = parseFloat(document.getElementById('propC').value) || 1;
  const pA = parseFloat(document.getElementById('propA').value) || 2;
  const pG = parseFloat(document.getElementById('propG').value) || 3;

  const factorContr = parseFloat(document.getElementById('factorContrConcreto').value) || 1.57;
  const densidadCem = parseFloat(document.getElementById('densidadCemento').value) || 1440;
  const volLata = parseFloat(document.getElementById('volumenLata').value) || VOLUMEN_LATA_M3;
  const despPct = parseFloat(document.getElementById('desperdicioConcreto').value) || 0;

  const factorDesp = 1 + (despPct / 100);
  const sumaPartes = pC + pA + pG;

  // Volumen seco total considerando contracción y desperdicio
  const volSecoTotal = volNeto * factorContr * factorDesp;

  const volCemento = (pC / sumaPartes) * volSecoTotal;
  const volArena = (pA / sumaPartes) * volSecoTotal;
  const volGrava = (pG / sumaPartes) * volSecoTotal;

  // Cemento
  const cemKg = volCemento * densidadCem;
  const cemBultos = cemKg / PESO_BULTO_KG;
  const cemLatas = (cemKg / densidadCem) / volLata;

  // Arena
  const arenaM3 = volArena;
  const arenaLatas = volArena / volLata;
  const arenaViajes = arenaM3 / 6;

  // Triturado / Grava
  const gravaM3 = volGrava;
  const gravaLatas = volGrava / volLata;
  const gravaViajes = gravaM3 / 6;

  // Agua estimada (a/c ~ 0.50 en peso)
  const aguaLitros = cemKg * 0.50;
  const aguaLatas = aguaLitros / (volLata * 1000);
  const aguaCanecas = aguaLitros / (55 * 3.78541);

  // Actualizar UI
  document.getElementById('resVolumenTotal').textContent = volNeto.toFixed(3);
  document.getElementById('resDosifTag').textContent = `${pC} : ${pA} : ${pG}`;
  document.getElementById('resVolSeco').textContent = volSecoTotal.toFixed(3);
  document.getElementById('resDespTag').textContent = `+${despPct}%`;

  // Cemento UI
  document.getElementById('resCementoBultos').textContent = cemBultos.toFixed(2);
  document.getElementById('resCementoBultosRound').textContent = Math.ceil(cemBultos);
  document.getElementById('resCementoKg').textContent = cemKg.toFixed(1);
  document.getElementById('resCementoLatas').textContent = cemLatas.toFixed(1);

  // Arena UI
  document.getElementById('resArenaM3').textContent = arenaM3.toFixed(3);
  document.getElementById('resArenaLatas').textContent = arenaLatas.toFixed(1);
  document.getElementById('resArenaViajes').textContent = arenaViajes.toFixed(2);

  // Triturado UI
  document.getElementById('resGravaM3').textContent = gravaM3.toFixed(3);
  document.getElementById('resGravaLatas').textContent = gravaLatas.toFixed(1);
  document.getElementById('resGravaViajes').textContent = gravaViajes.toFixed(2);

  // Agua UI
  document.getElementById('resAguaLitros').textContent = Math.round(aguaLitros);
  document.getElementById('resAguaLatas').textContent = aguaLatas.toFixed(1);
  document.getElementById('resAguaCanecas').textContent = aguaCanecas.toFixed(1);

  // Barra visual de proporciones
  const pctC = ((pC / sumaPartes) * 100).toFixed(1);
  const pctA = ((pA / sumaPartes) * 100).toFixed(1);
  const pctG = ((pG / sumaPartes) * 100).toFixed(1);

  document.getElementById('propSegC').style.width = `${pctC}%`;
  document.getElementById('propSegA').style.width = `${pctA}%`;
  document.getElementById('propSegG').style.width = `${pctG}%`;
  document.getElementById('propBarRatioTxt').textContent = `${pC} : ${pA} : ${pG} (${pctC}% / ${pctA}% / ${pctG}%)`;
}

/* ==========================================================================
   2. CÁLCULO DE MORTERO (PEGA Y REVOQUE)
   ========================================================================== */

function setMorteroPreset(c, a, desc, btn) {
  document.querySelectorAll('#tab-mortero .preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('propMortC').value = c;
  document.getElementById('propMortA').value = a;
  document.getElementById('morteroTagTitle').textContent = `Proporción ${c}:${a}`;
  calcularMortero();
}

function calcularMortero() {
  const volMortero = parseFloat(document.getElementById('inputVolMortero').value) || 0;
  if (volMortero <= 0) return;

  const pC = parseFloat(document.getElementById('propMortC').value) || 1;
  const pA = parseFloat(document.getElementById('propMortA').value) || 4;
  const FACTOR_CONTRACCION_MORT = 1.52;
  const despPct = parseFloat(document.getElementById('despMortero').value) || 0;
  const factorDesp = 1 + (despPct / 100);

  const suma = pC + pA;
  const volSeco = volMortero * FACTOR_CONTRACCION_MORT * factorDesp;

  const volC = (pC / suma) * volSeco;
  const volA = (pA / suma) * volSeco;

  const cemKg = volC * DENSIDAD_CEMENTO_KG_M3;
  const cemBultos = cemKg / PESO_BULTO_KG;
  const cemLatas = volC / VOLUMEN_LATA_M3;

  const arenaM3 = volA;
  const arenaLatas = volA / VOLUMEN_LATA_M3;
  const arenaViajes = arenaM3 / 6;

  document.getElementById('resMortVol').textContent = volMortero.toFixed(3);
  document.getElementById('resMortVolSeco').textContent = volSeco.toFixed(3);

  document.getElementById('resMortCemBultos').textContent = cemBultos.toFixed(2);
  document.getElementById('resMortCemBultosRound').textContent = Math.ceil(cemBultos);
  document.getElementById('resMortCemKg').textContent = cemKg.toFixed(1);
  document.getElementById('resMortCemLatas').textContent = cemLatas.toFixed(1);

  document.getElementById('resMortArenaM3').textContent = arenaM3.toFixed(3);
  document.getElementById('resMortArenaLatas').textContent = arenaLatas.toFixed(1);
  document.getElementById('resMortArenaViajes').textContent = arenaViajes.toFixed(2);
}

/* ==========================================================================
   3. CÁLCULO DE CONCRETO PARA VÍAS (MÉTODO TARREO)
   ========================================================================== */

function calcularTarreo() {
  const largo = parseFloat(document.getElementById('tarreoLargo').value) || 0;
  const ancho = parseFloat(document.getElementById('tarreoAncho').value) || 0;
  const espesor = parseFloat(document.getElementById('tarreoEspesor').value) || 0;
  const arena = parseFloat(document.getElementById('tarreoPropArena').value) || 2;
  const agregado = parseFloat(document.getElementById('tarreoPropAgregado').value) || 3;

  const volumen = largo * ancho * espesor;
  if (volumen <= 0) return;

  const volumenm3 = (0.45 + 1/3.15 + arena/2.6 + agregado/2.6) / 20;
  const bolsascemento = 1.05 * 0.98 * volumen / volumenm3;
  const viajesarena = (50 * arena * bolsascemento / 1700);
  const viajesagregado = (50 * agregado * bolsascemento) / 1650;
  const agua = 0.5 * bolsascemento * 35;

  const cemKg = bolsascemento * PESO_BULTO_KG;
  const cemLatas = (cemKg / DENSIDAD_CEMENTO_KG_M3) / VOLUMEN_LATA_M3;
  const arenaLatas = viajesarena / VOLUMEN_LATA_M3;
  const agregadoLatas = viajesagregado / VOLUMEN_LATA_M3;

  document.getElementById('resTarreoVol').textContent = volumen.toFixed(3);
  document.getElementById('resTarreoPropTag').textContent = `1 : ${arena} : ${agregado}`;

  document.getElementById('resTarreoBolsas').textContent = bolsascemento.toFixed(1);
  document.getElementById('resTarreoKg').textContent = Math.round(cemKg);
  document.getElementById('resTarreoCemLatas').textContent = cemLatas.toFixed(1);

  document.getElementById('resTarreoArenaM3').textContent = viajesarena.toFixed(2);
  document.getElementById('resTarreoArenaViajes').textContent = (viajesarena / 6).toFixed(2);
  document.getElementById('resTarreoArenaLatas').textContent = arenaLatas.toFixed(1);

  document.getElementById('resTarreoAgregadoM3').textContent = viajesagregado.toFixed(2);
  document.getElementById('resTarreoAgregadoViajes').textContent = (viajesagregado / 6).toFixed(2);
  document.getElementById('resTarreoAgregadoLatas').textContent = agregadoLatas.toFixed(1);

  document.getElementById('resTarreoAguaL').textContent = Math.round(agua);
  document.getElementById('resTarreoAguaCanecas').textContent = (agua / 208.2).toFixed(1);
}

/* ==========================================================================
   4. CÁLCULO DE ACERO (PLACA HUELLA, PAVIMENTO & VARILLAS)
   ========================================================================== */

function setAceroSubtab(tab) {
  const btnH = document.getElementById('btnAceroHuella');
  const btnP = document.getElementById('btnAceroPav');
  const btnV = document.getElementById('btnAceroVarillas');

  const boxH = document.getElementById('subtabPlacaHuella');
  const boxP = document.getElementById('subtabPavimento');
  const boxV = document.getElementById('subtabVarillas');

  const resH = document.getElementById('resBoxAceroHuella');
  const resP = document.getElementById('resBoxAceroPav');
  const resV = document.getElementById('resBoxVarillasTable');

  btnH.classList.remove('active');
  btnP.classList.remove('active');
  btnV.classList.remove('active');

  boxH.style.display = 'none';
  boxP.style.display = 'none';
  boxV.style.display = 'none';

  resH.style.display = 'none';
  resP.style.display = 'none';
  resV.style.display = 'none';

  if (tab === 'huella') {
    btnH.classList.add('active');
    boxH.style.display = 'block';
    resH.style.display = 'block';
    calcularAceroHuella();
  } else if (tab === 'pavimento') {
    btnP.classList.add('active');
    boxP.style.display = 'block';
    resP.style.display = 'block';
    calcularAceroPavimento();
  } else if (tab === 'varillas') {
    btnV.classList.add('active');
    boxV.style.display = 'block';
    resV.style.display = 'block';
  }
}

function calcularAceroHuella() {
  const largo = parseFloat(document.getElementById('huellaLargo').value) || 0;
  if (largo < 6) return;

  const refuerzoLongitudinal = ((largo - 6) / 5.4 + 1) * 10;
  const refuerzoTransversal = (largo / 3) * 18 * 0.9;
  const riostras = (largo / 3) * (26 + 4.1 * 4);
  const cunetasLongitudinal = ((largo - 6) / 5.4 + 1) * 8;
  const cunetasTransversal = (largo / 3) * 18 * 0.9;

  const totalVarillas = refuerzoLongitudinal + (refuerzoTransversal / 6) + (riostras / 6) + cunetasLongitudinal + (cunetasTransversal / 6);

  document.getElementById('resHuellaTotalVar').textContent = totalVarillas.toFixed(1);

  document.getElementById('resHuellaRielLongVar').textContent = refuerzoLongitudinal.toFixed(1);
  document.getElementById('resHuellaRielLongM').textContent = Math.round(refuerzoLongitudinal * 6);

  document.getElementById('resHuellaRielTransVar').textContent = (refuerzoTransversal / 6).toFixed(1);
  document.getElementById('resHuellaRielTransM').textContent = Math.round(refuerzoTransversal);

  document.getElementById('resHuellaRiostrasVar').textContent = (riostras / 6).toFixed(1);
  document.getElementById('resHuellaRiostrasM').textContent = Math.round(riostras);

  document.getElementById('resHuellaCunetaLongVar').textContent = cunetasLongitudinal.toFixed(1);
  document.getElementById('resHuellaCunetaLongM').textContent = Math.round(cunetasLongitudinal * 6);

  document.getElementById('resHuellaCunetaTransVar').textContent = (cunetasTransversal / 6).toFixed(1);
  document.getElementById('resHuellaCunetaTransM').textContent = Math.round(cunetasTransversal);
}

function toggleDisenoArgelia() {
  const val = document.getElementById('pavTipoDiseno').value;
  const boxCustom = document.getElementById('boxPavCustom');
  boxCustom.style.display = (val === 'custom') ? 'grid' : 'none';
  calcularAceroPavimento();
}

function calcularAceroPavimento() {
  const longTotal = parseFloat(document.getElementById('pavLongTotal').value) || 0;
  const largoPlaca = parseFloat(document.getElementById('pavLargoPlaca').value) || 4.0;
  const anchoPlaca = parseFloat(document.getElementById('pavAnchoPlaca').value) || 3.5;

  let espDovela = 30, longDovela = 40, longAnclaje = 85;
  const tipo = document.getElementById('pavTipoDiseno').value;
  if (tipo === 'custom') {
    espDovela = parseFloat(document.getElementById('pavEspDovela').value) || 30;
    longDovela = parseFloat(document.getElementById('pavLongDovela').value) || 40;
    longAnclaje = parseFloat(document.getElementById('pavLongAnclaje').value) || 85;
  }

  const esbeltez = largoPlaca / anchoPlaca;
  document.getElementById('resPavEsbeltez').textContent = esbeltez.toFixed(2);

  const numeroDovelas = Math.floor((anchoPlaca * 100 / espDovela) * (longTotal / largoPlaca));
  const varillasDovelas = Math.ceil(numeroDovelas * longDovela / 600);

  const numeroAnclajes = Math.floor(longTotal / largoPlaca) * 2;
  const varillasAnclajes = Math.ceil(numeroAnclajes * longAnclaje / 600);

  document.getElementById('resPavNumDovelas').textContent = numeroDovelas;
  document.getElementById('resPavVarillasDovelas').textContent = varillasDovelas;

  document.getElementById('resPavNumAnclajes').textContent = numeroAnclajes;
  document.getElementById('resPavVarillasAnclajes').textContent = varillasAnclajes;
}

function initRebarTable() {
  const tbody = document.getElementById('tableRebarBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  REBAR_DATA.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="highlight">#${r.num} (${r.diam_in})</td>
      <td>${r.diam_dec.toFixed(3)}"</td>
      <td>${r.diam_mm.toFixed(1)} mm</td>
      <td>${r.masa.toFixed(3)} kg/m</td>
      <td>${r.area} mm²</td>
    `;
    tbody.appendChild(tr);
  });
}

function mostrarPropVarilla() {
  const num = parseInt(document.getElementById('selectNumVarilla').value);
  const v = REBAR_DATA.find(r => r.num === num);
  if (!v) return;

  document.getElementById('varillaNombre').textContent = `Varilla #${v.num} (${v.diam_in})`;
  document.getElementById('varDiamIn').textContent = `${v.diam_dec.toFixed(3)} in`;
  document.getElementById('varDiamMm').textContent = v.diam_mm.toFixed(1);
  document.getElementById('varMasa').textContent = v.masa.toFixed(3);
  document.getElementById('varArea').textContent = v.area;
}

/* ==========================================================================
   5. UTILIDADES DE EXPORTACIÓN Y COPIADO AL PORTAPAPELES
   ========================================================================== */

function showToast(text) {
  const toast = document.getElementById('neonToast');
  const toastText = document.getElementById('toastText');
  if (!toast) return;

  toastText.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function copiarResultadosConcreto() {
  const vol = document.getElementById('resVolumenTotal').textContent;
  const dosif = document.getElementById('resDosifTag').textContent;
  const cemBultos = document.getElementById('resCementoBultos').textContent;
  const cemKg = document.getElementById('resCementoKg').textContent;
  const cemLatas = document.getElementById('resCementoLatas').textContent;
  const arenaM3 = document.getElementById('resArenaM3').textContent;
  const arenaLatas = document.getElementById('resArenaLatas').textContent;
  const gravaM3 = document.getElementById('resGravaM3').textContent;
  const gravaLatas = document.getElementById('resGravaLatas').textContent;
  const aguaL = document.getElementById('resAguaLitros').textContent;

  const texto = `
============================================================
CÁLCULO DE CANTIDADES DE CONCRETO (MÉTODO VOLUMEN)
Oscar Fernando Valencia Escobar — Ingeniero Civil
============================================================
Volumen a Fundir: ${vol} m³
Dosificación (C:A:G): ${dosif}

CANTIDADES DE MATERIALES REQUERIDAS:
------------------------------------------------------------
- CEMENTO:
  * ${cemBultos} bultos de 50 kg (Enteros: ${document.getElementById('resCementoBultosRound').textContent} bultos)
  * ${cemKg} kg
  * ${cemLatas} latas de 5 galones

- ARENA:
  * ${arenaM3} m³
  * ${arenaLatas} latas de 5 galones
  * ${(parseFloat(arenaM3)/6).toFixed(2)} viajes de volqueta (6 m³)

- TRITURADO / GRAVA:
  * ${gravaM3} m³
  * ${gravaLatas} latas de 5 galones
  * ${(parseFloat(gravaM3)/6).toFixed(2)} viajes de volqueta (6 m³)

- AGUA ESTIMADA:
  * ${aguaL} litros (~${document.getElementById('resAguaLatas').textContent} latas)
============================================================
Generado en: https://oscarfernandovalencia.github.io/calculadora-concreto.html
`;

  navigator.clipboard.writeText(texto.trim()).then(() => {
    showToast('¡Cantidades de concreto copiadas al portapapeles!');
  });
}

function copiarResultadosMortero() {
  const vol = document.getElementById('resMortVol').textContent;
  const c = document.getElementById('propMortC').value;
  const a = document.getElementById('propMortA').value;
  const cemBultos = document.getElementById('resMortCemBultos').textContent;
  const cemKg = document.getElementById('resMortCemKg').textContent;
  const arenaM3 = document.getElementById('resMortArenaM3').textContent;
  const arenaLatas = document.getElementById('resMortArenaLatas').textContent;

  const texto = `
============================================================
CÁLCULO DE CANTIDADES DE MORTERO (PEGA Y REVOQUE)
Oscar Fernando Valencia Escobar — Ingeniero Civil
============================================================
Volumen de Mortero: ${vol} m³
Proporción Cemento:Arena: 1:${a}

MATERIALES REQUERIDOS:
- Cemento: ${cemBultos} bultos (${cemKg} kg / ${document.getElementById('resMortCemLatas').textContent} latas)
- Arena: ${arenaM3} m³ (${arenaLatas} latas / ${(parseFloat(arenaM3)/6).toFixed(2)} viajes)
============================================================
`;
  navigator.clipboard.writeText(texto.trim()).then(() => {
    showToast('¡Cantidades de mortero copiadas!');
  });
}

function copiarResultadosTarreo() {
  const vol = document.getElementById('resTarreoVol').textContent;
  const bolsas = document.getElementById('resTarreoBolsas').textContent;
  const arenaM3 = document.getElementById('resTarreoArenaM3').textContent;
  const agregM3 = document.getElementById('resTarreoAgregadoM3').textContent;
  const aguaL = document.getElementById('resTarreoAguaL').textContent;

  const texto = `
============================================================
CÁLCULO DE CONCRETO PARA VÍAS (MÉTODO TARREO)
Oscar Fernando Valencia Escobar — Ingeniero Civil
============================================================
Volumen de Vía a Vaciar: ${vol} m³
- Cemento: ${bolsas} bolsas de 50 kg
- Arena: ${arenaM3} m³ (${(parseFloat(arenaM3)/6).toFixed(2)} viajes de 6m³)
- Agregado Grueso: ${agregM3} m³ (${(parseFloat(agregM3)/6).toFixed(2)} viajes de 6m³)
- Agua Requerida: ${aguaL} litros
============================================================
`;
  navigator.clipboard.writeText(texto.trim()).then(() => {
    showToast('¡Cálculo de vías copiado!');
  });
}

function copiarResultadosAcero() {
  const huellaLargo = document.getElementById('huellaLargo').value;
  const totalVar = document.getElementById('resHuellaTotalVar').textContent;

  const texto = `
============================================================
CÁLCULO DE ACERO PARA PLACA HUELLA (${huellaLargo} m)
Oscar Fernando Valencia Escobar — Ingeniero Civil
============================================================
Total de Varillas de 6m requeridas: ${totalVar} varillas
- Rieles Longitudinales: ${document.getElementById('resHuellaRielLongVar').textContent} varillas
- Rieles Transversales: ${document.getElementById('resHuellaRielTransVar').textContent} varillas
- Riostras: ${document.getElementById('resHuellaRiostrasVar').textContent} varillas
- Cunetas: ${(parseFloat(document.getElementById('resHuellaCunetaLongVar').textContent) + parseFloat(document.getElementById('resHuellaCunetaTransVar').textContent)).toFixed(1)} varillas
============================================================
`;
  navigator.clipboard.writeText(texto.trim()).then(() => {
    showToast('¡Cálculo de acero copiado!');
  });
}

function descargarResultadosTXT(modulo) {
  let contenido = '';
  let filename = `calculo_${modulo}_${new Date().toISOString().slice(0, 10)}.txt`;

  if (modulo === 'concreto') {
    const vol = document.getElementById('resVolumenTotal').textContent;
    const dosif = document.getElementById('resDosifTag').textContent;
    contenido = `
============================================================
INFORME DE CÁLCULO DE MATERIALES DE CONCRETO
Ing. Oscar Fernando Valencia Escobar — U. de Antioquia
Fecha: ${new Date().toLocaleString()}
============================================================
Parámetros:
- Volumen Neto a Fundir: ${vol} m³
- Dosificación (C:A:G): ${dosif}
- Factor de Contracción: ${document.getElementById('factorContrConcreto').value}
- Densidad de Cemento: ${document.getElementById('densidadCemento').value} kg/m³
- Desperdicio Considerado: ${document.getElementById('desperdicioConcreto').value}%

DESGLOSE DE MATERIALES:
------------------------------------------------------------
1. CEMENTO GRIS:
   - Bultos de 50 kg: ${document.getElementById('resCementoBultos').textContent} (Enteros: ${document.getElementById('resCementoBultosRound').textContent})
   - Masa: ${document.getElementById('resCementoKg').textContent} kg
   - Latas de 5 gal: ${document.getElementById('resCementoLatas').textContent}

2. ARENA (AGREGADO FINO):
   - Volumen neto: ${document.getElementById('resArenaM3').textContent} m³
   - Latas de 5 gal: ${document.getElementById('resArenaLatas').textContent}
   - Viajes de 6 m³: ${document.getElementById('resArenaViajes').textContent}

3. TRITURADO / GRAVA (AGREGADO GRUESO):
   - Volumen neto: ${document.getElementById('resGravaM3').textContent} m³
   - Latas de 5 gal: ${document.getElementById('resGravaLatas').textContent}
   - Viajes de 6 m³: ${document.getElementById('resGravaViajes').textContent}

4. AGUA DE MEZCLADO:
   - Litros: ${document.getElementById('resAguaLitros').textContent} L
   - Latas: ${document.getElementById('resAguaLatas').textContent}
   - Canecas de 55 gal: ${document.getElementById('resAguaCanecas').textContent}
============================================================
`;
  } else if (modulo === 'mortero') {
    contenido = `
============================================================
INFORME DE CÁLCULO DE MEZCLA DE MORTERO
Ing. Oscar Fernando Valencia Escobar
Fecha: ${new Date().toLocaleString()}
============================================================
- Volumen: ${document.getElementById('resMortVol').textContent} m³
- Cemento: ${document.getElementById('resMortCemBultos').textContent} bultos (${document.getElementById('resMortCemKg').textContent} kg)
- Arena: ${document.getElementById('resMortArenaM3').textContent} m³ (${document.getElementById('resMortArenaLatas').textContent} latas)
============================================================
`;
  } else if (modulo === 'tarreo') {
    contenido = `
============================================================
INFORME DE CONCRETO PARA VÍAS (MÉTODO TARREO)
Ing. Oscar Fernando Valencia Escobar
Fecha: ${new Date().toLocaleString()}
============================================================
- Volumen Vía: ${document.getElementById('resTarreoVol').textContent} m³
- Cemento: ${document.getElementById('resTarreoBolsas').textContent} bolsas de 50 kg
- Arena: ${document.getElementById('resTarreoArenaM3').textContent} m³
- Triturado: ${document.getElementById('resTarreoAgregadoM3').textContent} m³
- Agua: ${document.getElementById('resTarreoAguaL').textContent} litros
============================================================
`;
  } else if (modulo === 'acero') {
    contenido = `
============================================================
INFORME DE ACERO DE REFUERZO
Ing. Oscar Fernando Valencia Escobar
Fecha: ${new Date().toLocaleString()}
============================================================
- Total de Varillas de 6 m: ${document.getElementById('resHuellaTotalVar').textContent} varillas
============================================================
`;
  }

  const blob = new Blob([contenido.trim()], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('Archivo TXT descargado con éxito.');
}
