/**
 * EXPRESO ANDINO - LÓGICA DE NEGOCIO PREMIUM (V6.0 COMPLETA)
 * Mantiene todos los datos de viaje detallados, terminales, servicios y soporta moneda/idioma.
 */

function generarFechaOffset(diasOffset, horaString) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasOffset);
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}T${horaString}`;
}

const initialClientTrips = [
  {
    id: 'VIAJE-01', origin: 'Lima', destination: 'Huaraz',
    terminalOrigin: 'Terminal Javier Prado (Av. Javier Prado Este 1100)', terminalDest: 'Terminal Central Huaraz (Jr. Simón Bolívar 450)',
    departureTime: generarFechaOffset(1, '08:00'), arrivalTime: generarFechaOffset(1, '16:00'), durationText: '8 hrs de viaje',
    bus: { plate: 'AND-501', model: 'Scania Marcopolo G7', serviceType: 'Crucero VIP', floors: 2, floor1Capacity: 12, floor2Capacity: 28, floor1Price: 75.00, floor2Price: 60.00 },
    soldSeatsFloor1: [1, 2, 5], soldSeatsFloor2: [15, 16, 20, 22], isEnRoute: false, isOffer: false
  },
  {
    id: 'VIAJE-02', origin: 'Lima', destination: 'Huancayo',
    terminalOrigin: 'Gran Terminal Plaza Norte (Independencia)', terminalDest: 'Terminal Terrestre Huancayo (El Tambo)',
    departureTime: generarFechaOffset(2, '14:00'), arrivalTime: generarFechaOffset(2, '21:00'), durationText: '7 hrs de viaje',
    bus: { plate: 'AND-702', model: 'Volvo B430R', serviceType: 'Doble Piso Mixto', floors: 2, floor1Capacity: 12, floor2Capacity: 32, floor1Price: 65.00, floor2Price: 50.00 },
    soldSeatsFloor1: [2, 3], soldSeatsFloor2: [14, 18], isEnRoute: false, isOffer: true
  },
  {
    id: 'VIAJE-03', origin: 'Huaraz', destination: 'Lima',
    terminalOrigin: 'Terminal Central Huaraz (Jr. Simón Bolívar 450)', terminalDest: 'Terminal Javier Prado (Av. Javier Prado Este 1100)',
    departureTime: generarFechaOffset(3, '09:00'), arrivalTime: generarFechaOffset(3, '17:00'), durationText: '8 hrs de viaje',
    bus: { plate: 'AND-501', model: 'Scania Marcopolo G7', serviceType: 'Crucero VIP', floors: 2, floor1Capacity: 12, floor2Capacity: 28, floor1Price: 75.00, floor2Price: 60.00 },
    soldSeatsFloor1: [], soldSeatsFloor2: [], isEnRoute: false, isOffer: false
  },
  {
    id: 'VIAJE-04', origin: 'Cusco', destination: 'Lima',
    terminalOrigin: 'Terminal Cusco Imperial (Vía Expresa)', terminalDest: 'Terminal Javier Prado (Av. Javier Prado Este 1100)',
    departureTime: generarFechaOffset(4, '18:00'), arrivalTime: generarFechaOffset(5, '14:00'), durationText: '20 hrs de viaje',
    bus: { plate: 'AND-890', model: 'Mercedes-Benz O500', serviceType: 'Crucero Suite', floors: 1, floor1Capacity: 40, floor2Capacity: 0, floor1Price: 120.00, floor2Price: 0 },
    soldSeatsFloor1: [], soldSeatsFloor2: [], isEnRoute: false, isOffer: true
  }
];

let clientTrips = initialClientTrips;
try {
  const stored = localStorage.getItem('ea_client_trips_v12'); 
  if (stored) clientTrips = JSON.parse(stored);
} catch (e) {
  console.error("LocalStorage error", e);
}

let purchasedTickets = JSON.parse(localStorage.getItem('ea_tickets_v12')) || [];

let selectedTrip = null;
let currentFloor = 1;
let selectedSeatNumber = null;
let selectedSeatFloor = 1;
let selectedSeatPrice = 0;
let selectedSeatLocation = 'Ventana';

let bookingMode = 'ow'; 
let returnDateValue = '';

let currentCurrency = 'PEN'; 
let currentLang = 'es';       
const USD_RATE = 3.80;        

const translations = {
  es: {
    subtitle: "Portal Oficial de Pasajes", corp: "Corporativo", trips: "Mis Viajes",
    tabSearch: "Búsqueda Regular", tabOffers: "Ofertas Flash ⚡ (-30%)",
    oneway: "Solo Ida", roundtrip: "Ida y Vuelta", origin: "Origen", dest: "Destino",
    date: "Fecha Ida", retdate: "Fecha Retorno", searchBtn: "Buscar",
    offerTitle: "SUPER OFERTAS DE TEMPORADA", offerDesc: "Aprovecha hasta 30% de descuento en rutas seleccionadas.",
    resTitle: "Catálogo de Viajes", modSeats: "Selección de Asientos", confSeat: "Confirmar Asiento",
    modCheckout: "Checkout Seguro", chkSeat: "Pasaje:", chkTotal: "Total a Cobrar:",
    dniLbl: "DNI Pasajero", nameLbl: "Nombres Completos", payBtn: "Pagar y Emitir Boleto"
  },
  en: {
    subtitle: "Official Ticket Portal", corp: "Corporate", trips: "My Trips",
    tabSearch: "Regular Search", tabOffers: "Flash Deals ⚡ (-30%)",
    oneway: "One Way", roundtrip: "Round Trip", origin: "Origin", dest: "Destination",
    date: "Departure Date", retdate: "Return Date", searchBtn: "Search",
    offerTitle: "SEASONAL SUPER DEALS", offerDesc: "Enjoy up to 30% off on selected routes.",
    resTitle: "Trip Catalog", modSeats: "Seat Selection", confSeat: "Confirm Seat",
    modCheckout: "Secure Checkout", chkSeat: "Ticket:", chkTotal: "Total Amount:",
    dniLbl: "Passenger ID", nameLbl: "Full Name", payBtn: "Pay & Issue Ticket"
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('search-date');
  const returnInput = document.getElementById('search-return-date');
  
  if (dateInput) {
    const hoy = new Date();
    const strHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const mañana = new Date(hoy); mañana.setDate(mañana.getDate() + 1);
    dateInput.min = strHoy; 
    dateInput.value = `${mañana.getFullYear()}-${String(mañana.getMonth() + 1).padStart(2, '0')}-${String(mañana.getDate()).padStart(2, '0')}`;
    if(returnInput) {
      const tresDias = new Date(hoy); tresDias.setDate(tresDias.getDate() + 3);
      returnInput.min = strHoy; 
      returnInput.value = `${tresDias.getFullYear()}-${String(tresDias.getMonth() + 1).padStart(2, '0')}-${String(tresDias.getDate()).padStart(2, '0')}`; 
    }
  }

  renderClientTrips(clientTrips);
});

function saveState() {
  try {
    localStorage.setItem('ea_client_trips_v12', JSON.stringify(clientTrips));
  } catch (e) {
    console.error("Fallo al guardar estado", e);
  }
}

function formatPrice(amountInSoles) {
  if (currentCurrency === 'USD') {
    return `$ ${(amountInSoles / USD_RATE).toFixed(2)} USD`;
  }
  return `S/ ${amountInSoles.toFixed(2)}`;
}

function changeCurrency() {
  currentCurrency = document.getElementById('currency-selector').value;
  const activeTab = document.getElementById('section-search').classList.contains('hidden') ? 'offers' : 'search';
  switchTab(activeTab);
}

function changeLanguage() {
  currentLang = document.getElementById('lang-selector').value;
  const t = translations[currentLang];

  document.getElementById('i-subtitle').textContent = t.subtitle;
  document.getElementById('i-btn-corp').textContent = t.corp;
  document.getElementById('i-btn-trips').textContent = t.trips;
  document.getElementById('i-tab-search').textContent = t.tabSearch;
  document.getElementById('i-tab-offers').textContent = t.tabOffers;
  document.getElementById('i-lbl-oneway').textContent = t.oneway;
  document.getElementById('i-lbl-roundtrip').textContent = t.roundtrip;
  document.getElementById('i-lbl-origin').textContent = t.origin;
  document.getElementById('i-lbl-dest').textContent = t.dest;
  document.getElementById('i-lbl-date').textContent = t.date;
  document.getElementById('i-lbl-retdate').textContent = t.retdate;
  document.getElementById('i-btn-search').textContent = t.searchBtn;
  document.getElementById('i-offer-title').textContent = t.offerTitle;
  document.getElementById('i-offer-desc').textContent = t.offerDesc;
  document.getElementById('i-res-title').innerHTML = `<i class="fa-solid fa-list-check text-blue-600"></i> ${t.resTitle}`;
  document.getElementById('i-mod-seats').textContent = t.modSeats;
  document.getElementById('i-btn-confseat').textContent = t.confSeat;
  document.getElementById('i-mod-checkout').textContent = t.modCheckout;
  document.getElementById('i-chk-seat').textContent = t.chkSeat;
  document.getElementById('i-chk-total').textContent = t.chkTotal;
  document.getElementById('i-lbl-dni').textContent = t.dniLbl;
  document.getElementById('i-lbl-name').textContent = t.nameLbl;
  document.getElementById('i-btn-pay').textContent = t.payBtn;
}

function switchTab(tab) {
  const btnSearch = document.getElementById('tab-search');
  const btnOffers = document.getElementById('tab-offers');
  const secSearch = document.getElementById('section-search');
  const secOffers = document.getElementById('section-offers');

  if (tab === 'search') {
    btnSearch.className = "text-sm font-bold pb-1 text-blue-400 border-b-2 border-blue-500 transition-all flex items-center gap-2";
    btnOffers.className = "text-sm font-bold pb-1 text-slate-400 hover:text-white transition-all flex items-center gap-2";
    secSearch.classList.remove('hidden');
    secOffers.classList.add('hidden');
    renderClientTrips(clientTrips);
  } else {
    btnOffers.className = "text-sm font-bold pb-1 text-amber-400 border-b-2 border-amber-500 transition-all flex items-center gap-2";
    btnSearch.className = "text-sm font-bold pb-1 text-slate-400 hover:text-white transition-all flex items-center gap-2";
    secOffers.classList.remove('hidden');
    secSearch.classList.add('hidden');
    renderClientTrips(clientTrips.filter(t => t.isOffer));
  }
}

function toggleReturnDate() {
  const typeInput = document.querySelector('input[name="trip_type"]:checked');
  if(!typeInput) return;
  bookingMode = typeInput.value;
  const returnWrapper = document.getElementById('return-date-wrapper');
  
  if (bookingMode === 'rt') {
    returnWrapper.classList.remove('hidden');
    setTimeout(() => returnWrapper.classList.remove('opacity-0'), 10);
  } else {
    returnWrapper.classList.add('opacity-0');
    setTimeout(() => returnWrapper.classList.add('hidden'), 300);
  }
}

function renderClientTrips(tripsList) {
  const container = document.getElementById('trips-container');
  if(!container) return; 

  const badge = document.getElementById('trips-count-badge');
  if(badge) badge.textContent = `${tripsList.length} Salidas`;

  if (tripsList.length === 0) {
    container.innerHTML = `<div class="bg-white p-12 text-center rounded-2xl border"><h4 class="font-bold text-slate-700 text-base">No hay salidas disponibles.</h4></div>`;
    return;
  }

  container.innerHTML = tripsList.map(t => {
    const bus = t.bus;
    const freeFloor1 = bus.floor1Capacity - t.soldSeatsFloor1.length;
    const freeFloor2 = bus.floors === 2 ? (bus.floor2Capacity - t.soldSeatsFloor2.length) : 0;
    const totalFree = freeFloor1 + freeFloor2;
    
    const dateObj = new Date(t.departureTime);
    const formattedDate = dateObj.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const depTime = t.departureTime.split('T')[1];
    const arrTime = t.arrivalTime.split('T')[1];

    let finalSeatPrice = bus.floors === 2 ? bus.floor2Price : bus.floor1Price;
    let basePriceForDisplay = finalSeatPrice;
    let priceHtml = '';
    let offerBadge = '';

    if (t.isOffer) {
      finalSeatPrice = basePriceForDisplay * 0.70; // 30% descuento
      priceHtml = `<span class="text-xs line-through text-slate-400 mr-1">${formatPrice(basePriceForDisplay)}</span> ${formatPrice(finalSeatPrice)}`;
      offerBadge = `<span class="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded ml-1"><i class="fa-solid fa-bolt"></i> -30% OFF</span>`;
    } else {
      priceHtml = formatPrice(basePriceForDisplay);
    }

    const amenitiesHtml = `
      <div class="flex items-center gap-2 pt-3 mt-2 border-t border-slate-100 text-slate-400 text-xs">
        <span class="text-[11px] font-bold text-slate-500">Servicios:</span>
        <span class="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"><i class="fa-solid fa-wifi" aria-hidden="true"></i> WiFi</span>
        <span class="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"><i class="fa-solid fa-plug" aria-hidden="true"></i> USB</span>
        <span class="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"><i class="fa-solid fa-snowflake" aria-hidden="true"></i> A/C</span>
        <span class="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600"><i class="fa-solid fa-restroom" aria-hidden="true"></i> SS.HH</span>
      </div>
    `;

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="space-y-2 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-xs font-bold uppercase bg-slate-800 text-white px-2.5 py-1 rounded-lg">${formattedDate}</span>
              <span class="text-xs font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">${t.origin} ➔ ${t.destination}</span>
              <span class="text-xs font-semibold text-slate-500">${t.durationText}</span>
              ${offerBadge}
            </div>
            <div class="flex items-center gap-4 mt-2">
              <div>
                <span class="text-xl font-black text-slate-900">${depTime}</span>
                <p class="text-[11px] text-slate-500 max-w-[160px] leading-tight">${t.terminalOrigin}</p>
              </div>
              <div class="flex-1 flex flex-col items-center max-w-[120px]">
                <span class="text-[10px] text-slate-400 font-bold">DIRECTO</span>
                <div class="w-full h-0.5 bg-slate-300 relative"></div>
              </div>
              <div>
                <span class="text-xl font-black text-slate-900">${arrTime}</span>
                <p class="text-[11px] text-slate-500 max-w-[160px] leading-tight">${t.terminalDest}</p>
              </div>
            </div>
            ${amenitiesHtml}
          </div>

          <div class="border-l-0 md:border-l md:pl-6 border-slate-200 space-y-2 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-800">${bus.model}</span>
              <span class="text-[11px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-semibold border">${bus.plate}</span>
            </div>
            <p class="text-xs text-blue-700 font-semibold">${bus.serviceType} - <b>${bus.floors === 2 ? 'Bus de 2 Pisos' : 'Bus de 1 Piso'}</b></p>
            <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-slate-600">1er Piso:</span>
                <b class="text-emerald-700">${freeFloor1} libres (de ${bus.floor1Capacity})</b>
              </div>
              ${bus.floors === 2 ? `
              <div class="flex justify-between">
                <span class="text-slate-600">2do Piso:</span>
                <b class="text-emerald-700">${freeFloor2} libres (de ${bus.floor2Capacity})</b>
              </div>` : ''}
            </div>
          </div>

          <div class="w-full md:w-48 text-right flex flex-col justify-between items-end shrink-0">
            <div>
              <span class="text-xs text-slate-400">Tarifa Desde</span>
              <div class="text-lg font-black text-slate-900">${priceHtml}</div>
              <span class="text-[11px] text-slate-500">${totalFree} asientos libres</span>
            </div>
            <div class="mt-4 w-full">
              <button onclick="startSeatSelection('${t.id}', ${finalSeatPrice})" class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-chair" aria-hidden="true"></i> Elegir Asientos
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetSearch() {
  switchTab('search');
}

function handleSearch(e) {
  e.preventDefault();
  const orig = document.getElementById('search-origin').value;
  const dest = document.getElementById('search-destination').value;
  const searchDate = document.getElementById('search-date').value; 
  if(bookingMode === 'rt') returnDateValue = document.getElementById('search-return-date').value;

  let filtered = clientTrips.filter(t => t.origin === orig && t.destination === dest && t.departureTime.split('T')[0] === searchDate);
  renderClientTrips(filtered);
}

function startSeatSelection(tripId, customPrice) {
  selectedTrip = clientTrips.find(t => t.id === tripId);
  if (!selectedTrip) return;

  currentFloor = 1; selectedSeatNumber = null; selectedSeatFloor = 1;
  selectedSeatPrice = customPrice; selectedSeatLocation = 'Ventana';

  document.getElementById('modal-trip-summary').textContent = `${selectedTrip.origin} ➔ ${selectedTrip.destination} | ${selectedTrip.bus.model}`;
  document.getElementById('selected-seat-label').textContent = 'Ninguno';
  document.getElementById('selected-seat-location').textContent = '';
  document.getElementById('selected-seat-price').textContent = '';
  document.getElementById('btn-proceed-passenger').disabled = true;

  const tabFloor2 = document.getElementById('tab-floor-2');
  if (selectedTrip.bus.floors === 1) tabFloor2.classList.add('hidden'); else tabFloor2.classList.remove('hidden');

  switchFloor(1);
  document.getElementById('seat-modal').classList.remove('hidden');
}

function switchFloor(floorNum) {
  currentFloor = floorNum;
  renderSeatsForFloor(floorNum);
}

function renderSeatsForFloor(floorNum) {
  const grid = document.getElementById('seat-layout-grid');
  grid.innerHTML = '';
  const bus = selectedTrip.bus;
  const capacity = floorNum === 1 ? bus.floor1Capacity : bus.floor2Capacity;
  const soldList = floorNum === 1 ? selectedTrip.soldSeatsFloor1 : selectedTrip.soldSeatsFloor2;

  for (let i = 1; i <= capacity; i++) {
    const isSold = soldList.includes(i);
    const isSelected = (selectedSeatFloor === floorNum && selectedSeatNumber === i);
    const colPos = (i - 1) % 4; 
    const locationType = (colPos === 0 || colPos === 3) ? 'Ventana' : 'Pasillo';

    const btn = document.createElement('button');
    btn.type = 'button';

    let baseClass = 'p-2.5 rounded-xl text-xs font-bold border-2 flex flex-col items-center justify-center ';
    if (isSold) { btn.className = baseClass + 'seat-sold'; btn.disabled = true; }
    else if (isSelected) { btn.className = baseClass + 'seat-selected'; }
    else { btn.className = baseClass + 'seat-available'; btn.onclick = () => selectSeat(i, floorNum, selectedSeatPrice, locationType); }
    
    btn.innerHTML = `${i}`;
    grid.appendChild(btn);
  }
}

function selectSeat(seatNum, floorNum, price, locationType) {
  selectedSeatNumber = seatNum; selectedSeatFloor = floorNum; selectedSeatPrice = price; selectedSeatLocation = locationType;
  document.getElementById('selected-seat-label').textContent = `Asiento N° ${seatNum} (Piso ${floorNum})`;
  document.getElementById('selected-seat-location').textContent = `• ${locationType}`;
  document.getElementById('selected-seat-price').textContent = `• ${formatPrice(price)}`;
  document.getElementById('btn-proceed-passenger').disabled = false;
  renderSeatsForFloor(floorNum);
}

function handleSeatConfirmation() {
  closeModal('seat-modal');
  let totalPrice = selectedSeatPrice + 5.00; // + tasa
  
  const fechaIdaFormateada = new Date(selectedTrip.departureTime).toLocaleDateString('es-PE', {day:'2-digit', month:'short'});
  document.getElementById('checkout-ida-summary').textContent = `Ida (${fechaIdaFormateada}) - Asiento ${selectedSeatNumber} (${formatPrice(selectedSeatPrice)})`;
  
  const vueltaContainer = document.getElementById('checkout-vuelta-container');
  if (bookingMode === 'rt' && returnDateValue) {
    vueltaContainer.classList.remove('hidden');
    const fechaRetornoFormateada = new Date(returnDateValue).toLocaleDateString('es-PE', {day:'2-digit', month:'short'});
    document.getElementById('checkout-vuelta-summary').textContent = `Retorno (${fechaRetornoFormateada}) - Asiento Automático (${formatPrice(selectedSeatPrice)})`;
    totalPrice += selectedSeatPrice;
  } else {
    vueltaContainer.classList.add('hidden');
  }

  document.getElementById('checkout-total-final').textContent = formatPrice(totalPrice);
  document.getElementById('checkout-modal').classList.remove('hidden');
}

function processFinalPayment(e) {
  e.preventDefault();
  const dni = document.getElementById('p-dni').value;
  const name = document.getElementById('p-name').value;
  const ticketCode = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;

  let descViaje = `${selectedTrip.origin} a ${selectedTrip.destination} (Ida)`;
  if(bookingMode === 'rt') descViaje += ` + Retorno (${returnDateValue})`;

  purchasedTickets.push({ code: ticketCode, dni, name, ida: descViaje, fechaIda: selectedTrip.departureTime });
  localStorage.setItem('ea_tickets_v12', JSON.stringify(purchasedTickets));

  if (selectedSeatFloor === 1) selectedTrip.soldSeatsFloor1.push(selectedSeatNumber);
  else selectedTrip.soldSeatsFloor2.push(selectedSeatNumber);
  
  saveState();
  closeModal('checkout-modal');
  alert(`¡Compra exitosa! Código de boleto: ${ticketCode}`);
  resetSearch();
}

function openCorporateModal() { document.getElementById('corporate-modal').classList.remove('hidden'); }
function handleCorporateSubmit(e) { e.preventDefault(); closeModal('corporate-modal'); alert("¡Solicitud corporativa enviada con éxito!"); }
function openMyTripsModal() { document.getElementById('search-dni').value = ''; document.getElementById('found-tickets-container').classList.add('hidden'); document.getElementById('mytrips-modal').classList.remove('hidden'); }
function findMyTickets() {
  const dni = document.getElementById('search-dni').value.trim();
  const container = document.getElementById('found-tickets-container');
  const results = purchasedTickets.filter(t => t.dni === dni);
  container.innerHTML = results.length === 0 ? `<p class="text-rose-600 text-xs font-bold text-center">No hay boletos.</p>` : results.map(t => `<div class="bg-blue-50 p-2 rounded text-xs"><b>${t.code}</b> - ${t.ida} (${t.name})</div>`).join('');
  container.classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }